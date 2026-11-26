/**
 * NAVIDOOR Offline Cache & Neon Sync Service (Phase 4 Hybrid Layer)
 *
 * Strategy:
 * - Web: Uses window.localStorage for instant zero-dependency persistence.
 * - Native (iOS / Android): Uses Expo FileSystem (expo-file-system) JSON files in Paths.document.
 * - Mutations update local cache immediately and attempt live backend sync; any offline/failed
 *   writes are stored in a persistent retry queue and flushed automatically once online.
 */

import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { discoverBackendUrl, getBackendUrl } from './voiceAssistantBackend';
import {
  EmergencyContact,
  FontScale,
  MedicalProfileInfo,
  MedicineInfo,
  OcrHistoryEntry,
  PendingSyncItem,
  SupportedLanguageCode,
  ThemeMode,
} from '../types';

const CACHE_STORAGE_KEY = 'navidoor_offline_cache_v1';
const QUEUE_STORAGE_KEY = 'navidoor_sync_queue_v1';

export interface LocalOfflineSnapshot {
  userName?: string;
  userPhone?: string;
  activeLanguageCode?: SupportedLanguageCode;
  themeMode?: ThemeMode;
  fontScale?: FontScale;
  speechRate?: number;
  medicalProfile?: MedicalProfileInfo;
  emergencyContacts?: EmergencyContact[];
  medicines?: MedicineInfo[];
  ocrHistory?: OcrHistoryEntry[];
  updatedAt?: number;
}

// In-memory fallback for non-browser / headless test environments
const memoryStorage = new Map<string, string>();

async function readJsonStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    }

    if (Platform.OS !== 'web') {
      const file = new File(Paths.document, `${key}.json`);
      if (file.exists) {
        const raw = await file.text();
        return raw ? (JSON.parse(raw) as T) : fallback;
      }
      return fallback;
    }

    const mem = memoryStorage.get(key);
    return mem ? (JSON.parse(mem) as T) : fallback;
  } catch (err) {
    console.warn(`[OfflineSync] Read storage failed for ${key}:`, err);
    return fallback;
  }
}

async function writeJsonStorage<T>(key: string, value: T): Promise<void> {
  const serialized = JSON.stringify(value);
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
      return;
    }

    if (Platform.OS !== 'web') {
      const file = new File(Paths.document, `${key}.json`);
      if (!file.exists) {
        file.create({ intermediates: true, overwrite: true });
      }
      file.write(serialized);
      return;
    }

    memoryStorage.set(key, serialized);
  } catch (err) {
    console.warn(`[OfflineSync] Write storage failed for ${key}:`, err);
    memoryStorage.set(key, serialized);
  }
}

class OfflineSyncService {
  private isFlushing = false;

  async loadLocalSnapshot(): Promise<LocalOfflineSnapshot | null> {
    return readJsonStorage<LocalOfflineSnapshot | null>(CACHE_STORAGE_KEY, null);
  }

  async saveLocalSnapshot(snapshot: LocalOfflineSnapshot): Promise<void> {
    await writeJsonStorage(CACHE_STORAGE_KEY, {
      ...snapshot,
      updatedAt: Date.now(),
    });
  }

  async getSyncQueue(): Promise<PendingSyncItem[]> {
    return readJsonStorage<PendingSyncItem[]>(QUEUE_STORAGE_KEY, []);
  }

  async enqueueSync(item: Omit<PendingSyncItem, 'id' | 'createdAt'>): Promise<void> {
    const queue = await this.getSyncQueue();
    queue.push({
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    });
    // Cap queue at 100 entries so offline storage never grows unbounded
    const trimmed = queue.slice(-100);
    await writeJsonStorage(QUEUE_STORAGE_KEY, trimmed);
  }

  private async resolveBaseUrl(): Promise<string> {
    try {
      return await discoverBackendUrl();
    } catch {
      return getBackendUrl();
    }
  }

  /**
   * Sends a mutation to the Express/Neon backend; if offline or unreachable,
   * queues it locally for automatic replay when connectivity returns.
   */
  async sendOrQueue(
    method: 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<{ synced: boolean; data?: any }> {
    try {
      const baseUrl = await this.resolveBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      // Opportunistically flush older queued mutations while online
      this.flushSyncQueue().catch(() => {});
      return { synced: true, data };
    } catch (err) {
      await this.enqueueSync({ method, endpoint, body });
      return { synced: false };
    }
  }

  /**
   * Replays queued offline mutations in FIFO order.
   */
  async flushSyncQueue(): Promise<{ flushed: number; remaining: number }> {
    if (this.isFlushing) {
      const q = await this.getSyncQueue();
      return { flushed: 0, remaining: q.length };
    }

    this.isFlushing = true;
    let flushed = 0;
    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) return { flushed: 0, remaining: 0 };

      const baseUrl = await this.resolveBaseUrl();
      const remaining: PendingSyncItem[] = [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${baseUrl}${item.endpoint}`, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            ...(item.body !== undefined ? { body: JSON.stringify(item.body) } : {}),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (!res.ok) {
            // Keep failed 5xx/offline items; drop malformed 4xx items so they don't block the queue
            if (res.status >= 500) {
              remaining.push(...queue.slice(i));
              break;
            }
            continue;
          }
          flushed++;
        } catch {
          remaining.push(...queue.slice(i));
          break;
        }
      }

      await writeJsonStorage(QUEUE_STORAGE_KEY, remaining);
      return { flushed, remaining: remaining.length };
    } finally {
      this.isFlushing = false;
    }
  }

  async fetchBootstrap(phone: string): Promise<any | null> {
    if (!phone) return null;
    try {
      const baseUrl = await this.resolveBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `${baseUrl}/api/user/bootstrap?phone=${encodeURIComponent(phone)}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async fetchOcrHistory(phone: string, limit = 25): Promise<OcrHistoryEntry[] | null> {
    try {
      const baseUrl = await this.resolveBaseUrl();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `${baseUrl}/api/history?phone=${encodeURIComponent(phone)}&limit=${limit}`,
        { signal: controller.signal }
      );
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data?.scans) ? data.scans : null;
    } catch {
      return null;
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
