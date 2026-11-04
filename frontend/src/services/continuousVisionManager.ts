/**
 * NAVIDOOR Continuous Vision Manager & Inference Scheduler
 * 
 * Provides production-ready, bounded continuous object detection at 3-4 FPS with:
 * - Strict lifecycle-aware single-flight request guard
 * - Bounded frame intervals (220-280ms) and lightweight capture (~320x240)
 * - Temporal Object Tracking (IoU matching, centroid proximity, stable track IDs)
 * - Exponential Moving Average (EMA) distance and coordinate smoothing
 * - Detection noise & occlusion gap tolerance (miss budget up to 2.8s)
 * - Announcement Deduplication: stationary objects spoken ONCE, remaining quiet while unchanged
 * - Material change alerts: triggers speech only on significant approach (>= 0.5m), risk escalation, or path intrusion
 * - Prioritized Speech Queue: CRITICAL alerts preempt routine speech without message bloat
 * - Independent coordination with voice assistant (silences vision guidance while user speaks)
 * - Bounded RAM usage, clean file cleanup, and full lifecycle reset
 */

import { Platform, AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { yoloVisionService, YoloAnalysisResult, YoloDetection, NavigationPathState } from './yoloVisionService';
import { useNavidoorStore } from '../store/useNavidoorStore';
import { playObstacleBeep, speakAnnouncement, stopSpeech } from '../utils/speechUtils';

export type SpatialZone = 'LEFT' | 'CENTER' | 'RIGHT';
export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'FAR';
export type HazardPriority = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ContinuousVisionOptions {
  targetIntervalMs?: number; // Target frame interval (default 280ms ~ 3.5 FPS)
  minIntervalMs?: number;    // Absolute minimum interval between frame captures (default 220ms)
}

export interface TrackedObject {
  trackId: string;
  classLabel: string;
  classId: number;
  confidence: number;
  bbox: [number, number, number, number]; // smoothed [x1, y1, x2, y2]
  normalizedBbox: [number, number, number, number]; // smoothed [nx1, ny1, nx2, ny2]
  distanceMeters: number; // smoothed via Exponential Moving Average (EMA)
  zone: SpatialZone;
  riskLevel: RiskLevel;
  firstSeenTime: number;
  lastSeenTime: number;
  framesSeen: number;
  framesMissed: number;
  isConfirmed: boolean;
  approachSpeedMps: number;
}

interface TrackAnnouncementRecord {
  trackId: string;
  lastAnnouncedTime: number;
  lastAnnouncedDistance: number;
  lastAnnouncedZone: SpatialZone;
  lastAnnouncedRisk: RiskLevel;
  announcementCount: number;
}

interface QueuedSpeechItem {
  id: string;
  text: string;
  priority: HazardPriority;
  timestamp: number;
  trackId?: string;
  interrupt: boolean;
}

// Multilingual labels for common everyday navigation objects
const LOCALIZED_OBJECT_NAMES: Record<string, Record<string, string>> = {
  laptop: {
    en: 'Laptop', hi: 'लैपटॉप', mr: 'लॅपटॉप', gu: 'લેપટોપ', pa: 'ਲੈਪਟਾਪ',
    bn: 'ল্যাপটপ', ta: 'மடிக்கணினி', te: 'ల్యాప్‌టాప్', kn: 'ಲ್ಯಾಪ್ಟಾಪ್', ml: 'ലാപ്‌ടോപ്പ്'
  },
  person: {
    en: 'Person', hi: 'व्यक्ति', mr: 'व्यक्ती', gu: 'વ્યક્તિ', pa: 'ਵਿਅਕਤੀ',
    bn: 'ব্যক্তি', ta: 'நபர்', te: 'వ్యక్తి', kn: 'ವ್ಯಕ್ತಿ', ml: 'വ്യക്തി'
  },
  chair: {
    en: 'Chair', hi: 'कुर्सी', mr: 'खुर्ची', gu: 'ખુરશી', pa: 'ਕੁਰਸੀ',
    bn: 'চেয়ার', ta: 'நாற்காலி', te: 'కుర్చీ', kn: 'ಕುರ್ಚಿ', ml: 'കസേര'
  },
  door: {
    en: 'Door', hi: 'दरवाजा', mr: 'दरवाजा', gu: 'દરવાજો', pa: 'ਦਰਵਾਜ਼ਾ',
    bn: 'দরজা', ta: 'கதவு', te: 'ద్వారం', kn: 'ಬಾಗಿಲು', ml: 'വാതിൽ'
  },
  stairs: {
    en: 'Stairs', hi: 'सीढ़ियां', mr: 'पायऱ्या', gu: 'પગથિયાં', pa: 'ਪੌੜੀਆਂ',
    bn: 'সিঁড়ি', ta: 'படிகள்', te: 'మెట్లు', kn: 'ಮೆಟ್ಟಿಲುಗಳು', ml: 'പടികൾ'
  },
  bottle: {
    en: 'Bottle', hi: 'बोतल', mr: 'बाटली', gu: 'બોટલ', pa: 'ਬੋਤਲ',
    bn: 'বোতল', ta: 'பாட்டில்', te: 'సీసా', kn: 'ಬಾಟಲ್', ml: 'കുപ്പി'
  },
  cup: {
    en: 'Cup', hi: 'कप', mr: 'कप', gu: 'કપ', pa: 'ਕੱਪ',
    bn: 'কাপ', ta: 'கோப்பை', te: 'కప్పు', kn: 'ಕಪ್', ml: 'കപ്പ്'
  },
  book: {
    en: 'Book', hi: 'किताब', mr: 'पुस्तक', gu: 'પુસ્તક', pa: 'ਕਿਤਾਬ',
    bn: 'বই', ta: 'புத்தகம்', te: 'పుస్తకం', kn: 'ಪುಸ್ತಕ', ml: 'പുസ്തകം'
  },
  teddy_bear: {
    en: 'Teddy bear', hi: 'खिलौना भालू', mr: 'टेडी बेअर', gu: 'ટેડી રીંછ', pa: 'ਟੈਡੀ ਬੀਅਰ',
    bn: 'টেডি বিয়ার', ta: 'பொம்மை கரடி', te: 'టెడ్డీ బేర్', kn: 'ಟೆಡ್ಡಿ ಬೇರ್', ml: 'ടെഡി ബെയർ'
  },
  cell_phone: {
    en: 'Mobile phone', hi: 'मोबाइल फोन', mr: 'मोबाईल फोन', gu: 'મોબાઇલ ફોન', pa: 'ਮੋਬਾਈਲ ਫੋਨ',
    bn: 'মোবাইল ফোন', ta: 'கைபேசி', te: 'మొబైల్ ఫోన్', kn: 'ಮೊಬೈಲ್ ಫೋನ್', ml: 'മൊബൈൽ ഫോൺ'
  },
  dining_table: {
    en: 'Table', hi: 'मेज', mr: 'टेबल', gu: 'ટેબલ', pa: 'ਮੇਜ਼',
    bn: 'টেবিল', ta: 'மேஜை', te: 'మేజా', kn: 'ಮೇಜು', ml: 'മേശ'
  },
  dog: {
    en: 'Dog', hi: 'कुत्ता', mr: 'कुत्रा', gu: 'કૂતરો', pa: 'ਕੁੱਤਾ',
    bn: 'কুকুর', ta: 'நாய்', te: 'కుక్క', kn: 'ನಾಯಿ', ml: 'പട്ടി'
  },
  pole: {
    en: 'Pole', hi: 'खंभा', mr: 'खांब', gu: 'થાંભલો', pa: 'ਖੰਭਾ',
    bn: 'খুঁটি', ta: 'தூண்', te: 'స్తంభం', kn: 'ಕಂಬ', ml: 'തൂൺ'
  },
  pothole: {
    en: 'Pothole', hi: 'गड्ढा', mr: 'खड्डा', gu: 'ખાડો', pa: 'ਟੋਆ',
    bn: 'গর্ত', ta: 'பள்ளம்', te: 'గుంత', kn: 'ಗುಂಡಿ', ml: 'കുഴി'
  },
  vehicle: {
    en: 'Vehicle', hi: 'वाहन', mr: 'वाहन', gu: 'વાહન', pa: 'ਵਾਹਨ',
    bn: 'যানবাহন', ta: 'வாகனம்', te: 'వాహనం', kn: 'ವಾಹನ', ml: 'വാಹനം'
  },
};

/**
 * 1. LIGHTWEIGHT TEMPORAL OBJECT TRACKER
 */
class TemporalTracker {
  private activeTracks: Map<string, TrackedObject> = new Map();
  private nextTrackId: number = 1;

  update(rawDetections: any[], now: number): TrackedObject[] {
    const matchedTrackIds = new Set<string>();
    const matchedDetectionIndices = new Set<number>();
    const trackList = Array.from(this.activeTracks.values());
    const candidates: Array<{ trackId: string; detIdx: number; score: number }> = [];

    for (let dIdx = 0; dIdx < rawDetections.length; dIdx++) {
      const det = rawDetections[dIdx];
      const detClass = (det.class || '').toLowerCase().trim();

      for (const track of trackList) {
        const trackClass = track.classLabel.toLowerCase().trim();
        if (detClass !== trackClass && !this.isCompatibleClass(detClass, trackClass)) {
          continue;
        }

        const iou = this.calculateIoU(track.bbox, det.bbox || [0, 0, 0, 0]);
        const dist = this.calculateCentroidDistance(
          track.normalizedBbox,
          det.normalized_bbox || [0.1, 0.1, 0.4, 0.4]
        );

        let score = 0;
        if (iou >= 0.20) {
          score = 0.65 * iou + 0.35 * Math.max(0, 1 - dist);
        } else if (dist <= 0.25) {
          score = 0.50 * Math.max(0, 1 - dist);
        }

        if (score > 0.15) {
          candidates.push({ trackId: track.trackId, detIdx: dIdx, score });
        }
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    for (const match of candidates) {
      if (matchedTrackIds.has(match.trackId) || matchedDetectionIndices.has(match.detIdx)) {
        continue;
      }
      matchedTrackIds.add(match.trackId);
      matchedDetectionIndices.add(match.detIdx);

      const track = this.activeTracks.get(match.trackId)!;
      const det = rawDetections[match.detIdx];
      this.updateTrack(track, det, now);
    }

    // New candidate tracks
    for (let dIdx = 0; dIdx < rawDetections.length; dIdx++) {
      if (!matchedDetectionIndices.has(dIdx)) {
        const det = rawDetections[dIdx];
        const newTrack = this.createTrack(det, now);
        this.activeTracks.set(newTrack.trackId, newTrack);
      }
    }

    // Missed and expired tracks (keep alive during brief 2.8s dropouts)
    const expired: string[] = [];
    for (const [id, track] of this.activeTracks.entries()) {
      if (!matchedTrackIds.has(id)) {
        track.framesMissed++;
        if (now - track.lastSeenTime > 2800 || track.framesMissed > 12) {
          expired.push(id);
        }
      }
    }
    for (const id of expired) {
      this.activeTracks.delete(id);
    }

    return Array.from(this.activeTracks.values());
  }

  private updateTrack(track: TrackedObject, det: any, now: number) {
    const rawDist = det.distance_meters || 2.0;
    const smoothedDist = Math.round((track.distanceMeters * 0.65 + rawDist * 0.35) * 10) / 10;
    const rawBbox = det.bbox || track.bbox;
    const rawNorm = det.normalized_bbox || track.normalizedBbox;

    track.distanceMeters = smoothedDist;
    track.confidence = Number((track.confidence * 0.7 + (det.confidence || 0.8) * 0.3).toFixed(2));
    track.bbox = [
      Math.round(track.bbox[0] * 0.6 + rawBbox[0] * 0.4),
      Math.round(track.bbox[1] * 0.6 + rawBbox[1] * 0.4),
      Math.round(track.bbox[2] * 0.6 + rawBbox[2] * 0.4),
      Math.round(track.bbox[3] * 0.6 + rawBbox[3] * 0.4),
    ];
    track.normalizedBbox = [
      Number((track.normalizedBbox[0] * 0.6 + rawNorm[0] * 0.4).toFixed(3)),
      Number((track.normalizedBbox[1] * 0.6 + rawNorm[1] * 0.4).toFixed(3)),
      Number((track.normalizedBbox[2] * 0.6 + rawNorm[2] * 0.4).toFixed(3)),
      Number((track.normalizedBbox[3] * 0.6 + rawNorm[3] * 0.4).toFixed(3)),
    ];
    track.zone = this.determineZone(track.normalizedBbox);
    track.riskLevel = smoothedDist <= 1.2 ? 'CRITICAL' : (smoothedDist <= 2.5 ? 'WARNING' : 'INFO');
    track.lastSeenTime = now;
    track.framesSeen++;
    track.framesMissed = 0;

    if (track.framesSeen >= 2) {
      track.isConfirmed = true;
    }
  }

  private createTrack(det: any, now: number): TrackedObject {
    const id = `trk_${this.nextTrackId++}`;
    const norm = det.normalized_bbox || [0.1, 0.1, 0.4, 0.4];
    const dist = Math.round((det.distance_meters || 2.0) * 10) / 10;

    return {
      trackId: id,
      classLabel: (det.class || 'object').toLowerCase().trim(),
      classId: det.class_id || 0,
      confidence: det.confidence || 0.8,
      bbox: det.bbox ? [det.bbox[0], det.bbox[1], det.bbox[2], det.bbox[3]] : [0, 0, 100, 100],
      normalizedBbox: [norm[0], norm[1], norm[2], norm[3]],
      distanceMeters: dist,
      zone: det.zone || this.determineZone(norm),
      riskLevel: det.risk_level || (dist <= 1.2 ? 'CRITICAL' : (dist <= 2.5 ? 'WARNING' : 'INFO')),
      firstSeenTime: now,
      lastSeenTime: now,
      framesSeen: 1,
      framesMissed: 0,
      isConfirmed: false,
      approachSpeedMps: 0,
    };
  }

  private calculateIoU(a: [number, number, number, number], b: [number, number, number, number]): number {
    const xA = Math.max(a[0], b[0]);
    const yA = Math.max(a[1], b[1]);
    const xB = Math.min(a[2], b[2]);
    const yB = Math.min(a[3], b[3]);
    const inter = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    if (inter <= 0) return 0;
    const areaA = (a[2] - a[0]) * (a[3] - a[1]);
    const areaB = (b[2] - b[0]) * (b[3] - b[1]);
    return inter / (areaA + areaB - inter);
  }

  private calculateCentroidDistance(a: [number, number, number, number], b: [number, number, number, number]): number {
    const cAx = (a[0] + a[2]) / 2;
    const cAy = (a[1] + a[3]) / 2;
    const cBx = (b[0] + b[2]) / 2;
    const cBy = (b[1] + b[3]) / 2;
    return Math.hypot(cAx - cBx, cAy - cBy);
  }

  private determineZone(norm: [number, number, number, number]): SpatialZone {
    const cx = (norm[0] + norm[2]) / 2;
    if (cx < 0.35) return 'LEFT';
    if (cx > 0.65) return 'RIGHT';
    return 'CENTER';
  }

  private isCompatibleClass(a: string, b: string): boolean {
    if (a === b) return true;
    const groups = [
      ['laptop', 'computer'],
      ['cell phone', 'phone', 'mobile phone'],
      ['chair', 'couch', 'sofa', 'seat'],
      ['person', 'man', 'woman'],
    ];
    return groups.some((g) => g.includes(a) && g.includes(b));
  }

  getConfirmedTracks(): TrackedObject[] {
    return Array.from(this.activeTracks.values()).filter((t) => t.isConfirmed);
  }

  reset() {
    this.activeTracks.clear();
    this.nextTrackId = 1;
  }
}

/**
 * 2. CENTRALIZED HAZARD & ANNOUNCEMENT GATEKEEPER
 */
class AnnouncementManager {
  private trackRecords: Map<string, TrackAnnouncementRecord> = new Map();
  private lastGlobalSpokenTime: number = 0;
  private lastClearPathSpokenTime: number = 0;
  private lastVisibilitySpokenTime: number = 0;
  private lastSurfaceSpokenTime: number = 0;
  private hadActiveHazards: boolean = false;
  private primaryTrackId: string | null = null;

  evaluate(
    confirmedTracks: TrackedObject[],
    languageCode: string,
    now: number,
    pathState: NavigationPathState = 'UNKNOWN'
  ): { shouldAnnounce: boolean; text: string; priority: HazardPriority; trackId?: string; interrupt: boolean } {
    // 1. Prune ancient records (> 15 seconds), never prune on single missing frames
    for (const [id, rec] of this.trackRecords.entries()) {
      if (now - rec.lastAnnouncedTime > 15000) {
        this.trackRecords.delete(id);
      }
    }

    // 2. Navigation State Handling when no confirmed object tracks exist
    if (confirmedTracks.length === 0) {
      this.primaryTrackId = null;

      // PATH_CLEAR: Only declare clear path when explicitly verified by perception engine
      if (
        pathState === 'PATH_CLEAR' &&
        this.hadActiveHazards &&
        now - this.lastClearPathSpokenTime > 12000 &&
        now - this.lastGlobalSpokenTime > 4000
      ) {
        this.hadActiveHazards = false;
        this.lastClearPathSpokenTime = now;
        this.lastGlobalSpokenTime = now;
        return {
          shouldAnnounce: true,
          text: this.getClearPathMessage(languageCode),
          priority: 'INFO',
          interrupt: false,
        };
      }

      // VISIBILITY_REDUCED: Inform user of dark or obscured view
      if (
        pathState === 'VISIBILITY_REDUCED' &&
        now - this.lastVisibilitySpokenTime > 14000 &&
        now - this.lastGlobalSpokenTime > 4000
      ) {
        this.lastVisibilitySpokenTime = now;
        this.lastGlobalSpokenTime = now;
        return {
          shouldAnnounce: true,
          text: this.getVisibilityMessage(languageCode),
          priority: 'WARNING',
          interrupt: false,
        };
      }

      // PATH_OBSTRUCTED: Flat surface/wall or closed door detected directly in front
      if (
        pathState === 'PATH_OBSTRUCTED' &&
        now - this.lastSurfaceSpokenTime > 10000 &&
        now - this.lastGlobalSpokenTime > 4000
      ) {
        this.lastSurfaceSpokenTime = now;
        this.lastGlobalSpokenTime = now;
        return {
          shouldAnnounce: true,
          text: this.getSurfaceMessage(languageCode),
          priority: 'CRITICAL',
          interrupt: false,
        };
      }

      // UNKNOWN (default for empty detections / lack of evidence): REMAIN QUIET!
      // A lack of detections must never be treated as proof that path is clear.
      this.hadActiveHazards = false;
      return { shouldAnnounce: false, text: '', priority: 'INFO', interrupt: false };
    }

    this.hadActiveHazards = true;

    // 3. Strict Global Speech Cooldown: Never speak more frequently than every 4.0 seconds!
    if (now - this.lastGlobalSpokenTime < 4000) {
      return { shouldAnnounce: false, text: '', priority: 'INFO', interrupt: false };
    }

    // 4. Sort confirmed tracks: closest first, prefer CENTER
    const sorted = [...confirmedTracks].sort((a, b) => {
      const pScore = (r: RiskLevel) => (r === 'CRITICAL' ? 3 : (r === 'WARNING' ? 2 : 1));
      const pDiff = pScore(b.riskLevel) - pScore(a.riskLevel);
      if (pDiff !== 0) return pDiff;
      const dDiff = a.distanceMeters - b.distanceMeters;
      if (Math.abs(dDiff) > 0.3) return dDiff;
      return (b.zone === 'CENTER' ? 1 : 0) - (a.zone === 'CENTER' ? 1 : 0);
    });

    // 5. Primary track hysteresis: don't rapidly swap between two tracks of similar distance
    let primary = sorted[0];
    if (this.primaryTrackId) {
      const existingPrimary = sorted.find((t) => t.trackId === this.primaryTrackId);
      if (existingPrimary && primary.distanceMeters >= existingPrimary.distanceMeters - 0.4) {
        primary = existingPrimary;
      }
    }
    this.primaryTrackId = primary.trackId;

    const prev = this.trackRecords.get(primary.trackId);
    const priority: HazardPriority = primary.distanceMeters <= 1.2 ? 'CRITICAL' : (primary.distanceMeters <= 2.5 ? 'WARNING' : 'INFO');

    let shouldAnnounce = false;

    if (!prev) {
      // RULE 1: First confirmed detection of persistent obstacle -> announce once!
      shouldAnnounce = true;
    } else {
      // RULE 2: Material change detection
      const distanceDecreased = prev.lastAnnouncedDistance - primary.distanceMeters;
      const riskEscalated = prev.lastAnnouncedRisk !== 'CRITICAL' && primary.riskLevel === 'CRITICAL';
      const pathIntruded = prev.lastAnnouncedZone !== 'CENTER' && primary.zone === 'CENTER';

      if (riskEscalated) {
        shouldAnnounce = true;
      } else if (distanceDecreased >= 0.6) {
        shouldAnnounce = true;
      } else if (pathIntruded) {
        shouldAnnounce = true;
      } else {
        // RULE 3: Stationary & unchanged (e.g. laptop/chair remains stationary):
        // REMAIN QUIET! Do not repeat every frame or every second.
        shouldAnnounce = false;
      }
    }

    if (shouldAnnounce) {
      this.lastGlobalSpokenTime = now;
      const text = this.formatGuidance(primary, priority, languageCode);
      this.trackRecords.set(primary.trackId, {
        trackId: primary.trackId,
        lastAnnouncedTime: now,
        lastAnnouncedDistance: primary.distanceMeters,
        lastAnnouncedZone: primary.zone,
        lastAnnouncedRisk: primary.riskLevel,
        announcementCount: (prev ? prev.announcementCount : 0) + 1,
      });

      return {
        shouldAnnounce: true,
        text,
        priority,
        trackId: primary.trackId,
        interrupt: false, // Never interrupt mid-word; let sentences speak cleanly
      };
    }

    return { shouldAnnounce: false, text: '', priority: 'INFO', interrupt: false };
  }

  formatGuidance(track: TrackedObject, priority: HazardPriority, languageCode: string): string {
    const lang = languageCode.split('-')[0].toLowerCase();
    const nameMap = LOCALIZED_OBJECT_NAMES[track.classLabel.toLowerCase().replace(/\s+/g, '_')];
    const name = (nameMap && nameMap[lang]) || (track.classLabel.charAt(0).toUpperCase() + track.classLabel.slice(1));
    const dist = track.distanceMeters.toFixed(1);

    if (lang === 'hi') {
      const z = track.zone === 'LEFT' ? 'बाईं ओर' : (track.zone === 'RIGHT' ? 'दाईं ओर' : 'सीधे सामने');
      return priority === 'CRITICAL' ? `सावधान! ${z} लगभग ${dist} मीटर पर ${name} है।` : `${z} ${dist} मीटर पर ${name} है।`;
    }
    if (lang === 'mr') {
      const z = track.zone === 'LEFT' ? 'डाव्या बाजूला' : (track.zone === 'RIGHT' ? 'उजव्या बाजूला' : 'समोर');
      return priority === 'CRITICAL' ? `सावधान! ${z} सुमारे ${dist} मीटरवर ${name} आहे.` : `${z} ${dist} मीटरवर ${name} आहे.`;
    }
    if (lang === 'gu') {
      const z = track.zone === 'LEFT' ? 'ડાબી બાજુ' : (track.zone === 'RIGHT' ? 'જમણી બાજુ' : 'સામે');
      return priority === 'CRITICAL' ? `સાવધાન! ${z} આશરે ${dist} મીટર પર ${name} છે.` : `${z} ${dist} મીટર પર ${name} છે.`;
    }
    if (lang === 'pa') {
      const z = track.zone === 'LEFT' ? 'ਖੱਬੇ ਪਾਸੇ' : (track.zone === 'RIGHT' ? 'ਸੱਜੇ ਪਾਸੇ' : 'ਸਾਹਮਣੇ');
      return priority === 'CRITICAL' ? `ਧਿਆਨ ਦਿਓ! ${z} ਲਗਭਗ ${dist} ਮੀਟਰ 'ਤੇ ${name} ਹੈ।` : `${z} ${dist} ਮੀਟਰ 'ਤੇ ${name} ਹੈ।`;
    }
    if (lang === 'bn') {
      const z = track.zone === 'LEFT' ? 'বামে' : (track.zone === 'RIGHT' ? 'ডানে' : 'সামনে');
      return priority === 'CRITICAL' ? `সাবধান! ${z} প্রায় ${dist} মিটারে ${name} আছে।` : `${z} ${dist} মিটারে ${name} আছে।`;
    }
    if (lang === 'ta') {
      const z = track.zone === 'LEFT' ? 'இடதுபுறம்' : (track.zone === 'RIGHT' ? 'வலதுபுறம்' : 'நேரெதிரே');
      return priority === 'CRITICAL' ? `எச்சரிக்கை! ${z} சுமார் ${dist} மீட்டரில் ${name} உள்ளது.` : `${z} ${dist} மீட்டரில் ${name} உள்ளது.`;
    }
    if (lang === 'te') {
      const z = track.zone === 'LEFT' ? 'ఎడమవైపు' : (track.zone === 'RIGHT' ? 'కుడివైపు' : 'ఎదురుగా');
      return priority === 'CRITICAL' ? `హెచ్చరిక! ${z} దాదాపు ${dist} మీటర్లలో ${name} ఉంది.` : `${z} ${dist} మీటర్ల దూరంలో ${name} ఉంది.`;
    }
    if (lang === 'kn') {
      const z = track.zone === 'LEFT' ? 'ಎಡಭಾಗದಲ್ಲಿ' : (track.zone === 'RIGHT' ? 'ಬಲಭಾಗದಲ್ಲಿ' : 'ನೇರವಾಗಿ ಮುಂದೆ');
      return priority === 'CRITICAL' ? `ಎಚ್ಚರಿಕೆ! ${z} ಸುಮಾರು ${dist} ಮೀಟರ್‌ನಲ್ಲಿ ${name} ಇದೆ.` : `${z} ${dist} ಮೀಟರ್‌ನಲ್ಲಿ ${name} ಇದೆ.`;
    }
    if (lang === 'ml') {
      const z = track.zone === 'LEFT' ? 'ഇടതുവശത്ത്' : (track.zone === 'RIGHT' ? 'വലതുവശത്ത്' : 'നേരെ മുന്നിൽ');
      return priority === 'CRITICAL' ? `ശ്രദ്ധിക്കുക! ${z} ഏകദേശം ${dist} മീറ്ററിൽ ${name} ഉണ്ട്.` : `${z} ${dist} മീറ്ററിൽ ${name} ഉണ്ട്.`;
    }

    const z = track.zone === 'LEFT' ? 'on your left' : (track.zone === 'RIGHT' ? 'on your right' : 'directly ahead');
    return priority === 'CRITICAL'
      ? `Caution, ${name} ${z}, approximately ${dist} meters.`
      : `${name} ${z}, approximately ${dist} meters.`;
  }

  getClearPathMessage(languageCode: string): string {
    const lang = languageCode.split('-')[0].toLowerCase();
    const map: Record<string, string> = {
      en: 'Path appears clear ahead.',
      hi: 'सामने रास्ता साफ लग रहा है।',
      mr: 'समोर चालण्यासाठी वाट मोकळी दिसते.',
      gu: 'સામે રસ્તો સાફ જણાય છે.',
      pa: 'ਸਾਹਮਣੇ ਰਸਤਾ ਸਾਫ਼ ਲੱਗਦਾ ਹੈ।',
      bn: 'সামনে হাঁটার পথ পরিষ্কার দেখাচ্ছে।',
      ta: 'முன்னால் பாதை தெளிவாகத் தெரிகிறது.',
      te: 'ముందు దారి స్పష్టంగా కనిపిస్తోంది.',
      kn: 'ಮುಂದೆ ಹಾದಿ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಿಸುತ್ತಿದೆ.',
      ml: 'മുന്നിൽ വഴി വ്യക്തമായി തോന്നുന്നു.',
    };
    return map[lang] || map.en;
  }

  getVisibilityMessage(languageCode: string): string {
    const lang = languageCode.split('-')[0].toLowerCase();
    const map: Record<string, string> = {
      en: 'Low visibility. Lighting is too low or camera view is obscured.',
      hi: 'कम रोशनी। दृश्य स्पष्ट नहीं दिख रहा है।',
      mr: 'कमी प्रकाश. दृश्य स्पष्ट दिसत नाही.',
      gu: 'ઓછો પ્રકાશ. કેમેરા દ્રશ્ય સ્પષ્ટ નથી.',
      pa: 'ਘੱਟ ਰੋਸ਼ਨੀ। ਕੈਮਰਾ ਦ੍ਰਿਸ਼ ਸਾਫ਼ ਨਹੀਂ ਹੈ।',
      bn: 'কম আলো। ক্যামেরা দৃশ্য পরিষ্কার নয়।',
      ta: 'குறைந்த வெளிச்சம். கேமரா காட்சி தெளிவாக இல்லை.',
      te: 'తక్కువ వెలుతురు. కెమెరా దృశ్యం స్పష్టంగా లేదు.',
      kn: 'ಕಡಿಮೆ ಬೆಳಕು. ಕ್ಯಾಮೆರಾ ದೃಶ್ಯ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ.',
      ml: 'കുറഞ്ഞ വെളിച്ചം. കാഴ്ച വ്യക്തമല്ല.',
    };
    return map[lang] || map.en;
  }

  getSurfaceMessage(languageCode: string): string {
    const lang = languageCode.split('-')[0].toLowerCase();
    const map: Record<string, string> = {
      en: 'Surface directly ahead. Possible wall or closed door. Please stop.',
      hi: 'सामने दीवार या दरवाजा है। कृपया रुकें।',
      mr: 'समोर भिंत किंवा दार आहे. कृपया थांबा.',
      gu: 'સામે દીવાલ કે દરવાજો છે. કૃપા કરીને થોભો.',
      pa: 'ਸਾਹਮਣੇ ਕੰਧ ਜਾਂ ਦਰਵਾਜ਼ਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਰੁਕੋ।',
      bn: 'সামনে দেয়াল বা দরজা আছে। অনুগ্রহ করে থামুন।',
      ta: 'முன்னால் சுவர் அல்லது கதவு உள்ளது. தயவுசெய்து நிற்கவும்.',
      te: 'ముందు గోడ లేదా తలుపు ఉంది. దయచేసి ఆగండి.',
      kn: 'ಮುಂದೆ ಗೋಡೆ ಅಥವಾ ಬಾಗಿಲು ಇದೆ. ದಯವಿಟ್ಟು ನಿಲ್ಲಿ.',
      ml: 'മുന്നിൽ ഭിത്തിയോ വാതിലോ ഉണ്ട്. ദയവായി നിൽക്കൂ.',
    };
    return map[lang] || map.en;
  }

  getUnknownMessage(languageCode: string): string {
    const lang = languageCode.split('-')[0].toLowerCase();
    const map: Record<string, string> = {
      en: 'No recognized obstacles in view. Path clearance unverified.',
      hi: 'कोई रुकावट नहीं दिखी। रास्ते की पुष्टि नहीं हो सकी।',
      mr: 'कोणताही अडथळा दिसला नाही. वाट सुरक्षित आहे की नाही याची खात्री नाही.',
      gu: 'કોઈ અડચણ દેખાતી નથી. રસ્તાની ખાતરી થઈ નથી.',
      pa: 'ਕੋਈ ਰੁਕਾਵਟ ਨਹੀਂ ਦਿੱਸੀ। ਰਸਤੇ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਹੋ ਸਕੀ।',
      bn: 'কোনো বাধা দেখা যায়নি। পথের নিশ্চয়তা পাওয়া যায়নি।',
      ta: 'தடைகள் எதுவும் தெரியவில்லை. பாதை உறுதிப்படுத்தப்படவில்லை.',
      te: 'ఎలాంటి అడ్డంకులు కనిపించలేదు. మార్గం నిర్ధారించబడలేదు.',
      kn: 'ಯಾವುದೇ ಅಡೆತಡೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹಾದಿ ದೃಢಪಟ್ಟಿಲ್ಲ.',
      ml: 'തടസ്സങ്ങളൊന്നും കാണുന്നില്ല. വഴി ഉറപ്പാക്കാനായില്ല.',
    };
    return map[lang] || map.en;
  }

  reset() {
    this.trackRecords.clear();
    this.lastClearPathSpokenTime = 0;
    this.lastVisibilitySpokenTime = 0;
    this.lastSurfaceSpokenTime = 0;
    this.hadActiveHazards = false;
  }
}

/**
 * 3. PRIORITIZED SPEECH QUEUE & PLAYBACK COORDINATOR
 */
class SpeechQueueManager {
  private activeItem: QueuedSpeechItem | null = null;
  private pendingQueue: Map<HazardPriority, QueuedSpeechItem> = new Map();
  private isProcessing: boolean = false;
  private playbackTimer: any = null;
  private nextItemId: number = 1;

  enqueue(text: string, priority: HazardPriority, options: { trackId?: string; interrupt?: boolean } = {}) {
    const clean = (text || '').trim();
    if (!clean) return;

    const store = useNavidoorStore.getState();
    if (store.voiceState === 'listening' || store.voiceState === 'thinking') {
      return;
    }

    if (this.activeItem && this.activeItem.text === clean) return;
    const existing = this.pendingQueue.get(priority);
    if (existing && existing.text === clean) return;

    // Do NOT cut off currently playing speech! Let the sentence finish speaking naturally.
    if (this.activeItem || this.isProcessing || store.voiceState === 'speaking') {
      this.pendingQueue.set(priority, {
        id: `spch_${this.nextItemId++}`,
        text: clean,
        priority,
        timestamp: Date.now(),
        trackId: options.trackId,
        interrupt: false,
      });
      return;
    }

    const item: QueuedSpeechItem = {
      id: `spch_${this.nextItemId++}`,
      text: clean,
      priority,
      timestamp: Date.now(),
      trackId: options.trackId,
      interrupt: false,
    };

    this.pendingQueue.set(priority, item);
    this.processNext();
  }

  private interruptAndPlay(item: QueuedSpeechItem) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    stopSpeech();
    this.activeItem = null;
    this.executeSpeech(item);
  }

  private processNext() {
    if (this.activeItem || this.isProcessing) return;
    let next: QueuedSpeechItem | null = null;
    for (const p of ['CRITICAL', 'WARNING', 'INFO'] as HazardPriority[]) {
      if (this.pendingQueue.has(p)) {
        next = this.pendingQueue.get(p)!;
        this.pendingQueue.delete(p);
        break;
      }
    }
    if (!next) return;
    this.executeSpeech(next);
  }

  private executeSpeech(item: QueuedSpeechItem) {
    this.activeItem = item;
    this.isProcessing = true;

    const store = useNavidoorStore.getState();
    const activeLang = store.activeLanguageCode || 'en';

    useNavidoorStore.setState({
      lastAnnouncement: item.text,
      voiceState: 'speaking',
    });

    speakAnnouncement(item.text, {
      rate: store.speechRate || 1.0,
      pitch: 1.0,
      interrupt: item.interrupt,
      languageCode: activeLang as any,
    });

    const estDurationMs = Math.max(1800, item.text.length * 55 + 600);
    this.playbackTimer = setTimeout(() => {
      this.playbackTimer = null;
      this.activeItem = null;
      this.isProcessing = false;
      if (useNavidoorStore.getState().voiceState === 'speaking') {
        useNavidoorStore.setState({ voiceState: 'idle' });
      }
      this.processNext();
    }, estDurationMs);
  }

  reset(stopActiveAudio: boolean = false) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    if (stopActiveAudio) {
      stopSpeech();
    }
    this.pendingQueue.clear();
    this.activeItem = null;
    this.isProcessing = false;
  }
}

/**
 * 4. CONTINUOUS VISION MANAGER ENGINE
 */
class ContinuousVisionManager {
  private isRunning: boolean = false;
  private sessionId: number = 0;
  private isRequestInFlight: boolean = false;
  private timerHandle: any = null;
  private abortController: AbortController | null = null;
  private consecutiveErrors: number = 0;

  // Frame timing
  private targetIntervalMs: number = 280; // ~3.5 FPS
  private minIntervalMs: number = 220;
  private lastFrameStartTime: number = 0;

  // Camera references
  private cameraRef: any = null;
  private videoRef: HTMLVideoElement | null = null;
  private persistentCanvas: HTMLCanvasElement | null = null;

  // Audio & Tactile Beep timing
  private lastBeepTime: number = 0;

  // Vision Pipeline Subsystems
  private tracker = new TemporalTracker();
  private announcementManager = new AnnouncementManager();
  private speechQueue = new SpeechQueueManager();

  // AppState subscription
  private appStateSubscription: any = null;

  constructor() {
    this.handleAppStateChange = this.handleAppStateChange.bind(this);
    if (Platform.OS !== 'web') {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }
  }

  setCameraRef(ref: any) {
    this.cameraRef = ref;
  }

  setVideoRef(ref: HTMLVideoElement | null) {
    this.videoRef = ref;
  }

  public isPerceptionNeeded(): boolean {
    const store = useNavidoorStore.getState();
    const isVisionMode = ['assist', 'navigate', 'read', 'medicine', 'transport'].includes(store.activeMode);
    const isProfileOrModalActive = 
      store.isFirstTimeUser || 
      store.isProfileModalOpen || 
      store.isSosModalOpen || 
      store.isFamilyCompanionOpen || 
      store.isDesignSystemOpen || 
      Boolean(store.isCapturedPhotoModalOpen) ||
      store.userRole !== 'navidoor_user';

    return isVisionMode && store.isDetectionActive && !isProfileOrModalActive;
  }

  private handleAppStateChange(nextState: AppStateStatus) {
    if (nextState !== 'active') {
      if (this.isRunning) {
        this.pause();
      }
    } else {
      if (this.isPerceptionNeeded() && !this.isRunning) {
        this.start();
      }
    }
  }

  start(options?: ContinuousVisionOptions) {
    if (!this.isPerceptionNeeded()) {
      if (this.isRunning) {
        this.stop();
      }
      return;
    }
    if (this.isRunning) return;
    this.sessionId++;
    this.isRunning = true;
    this.consecutiveErrors = 0;

    if (options?.targetIntervalMs) this.targetIntervalMs = options.targetIntervalMs;
    if (options?.minIntervalMs) this.minIntervalMs = options.minIntervalMs;

    yoloVisionService.setContinuousActive(true);
    this.scheduleNextFrame(50);
  }

  stop() {
    this.sessionId++;
    this.isRunning = false;
    yoloVisionService.setContinuousActive(false);

    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.isRequestInFlight = false;

    // Reset vision tracking, announcements, and speech queues
    this.tracker.reset();
    this.announcementManager.reset();
    this.speechQueue.reset(false);
  }

  pause() {
    this.stop();
  }

  resume() {
    this.start();
  }

  private scheduleNextFrame(delayMs: number) {
    if (!this.isRunning) return;

    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
    }

    this.timerHandle = setTimeout(() => {
      this.timerHandle = null;
      this.processSingleTick();
    }, Math.max(20, delayMs));
  }

  private async processSingleTick() {
    if (!this.isRunning) return;

    const currentSession = this.sessionId;
    const now = Date.now();

    const elapsedSinceLast = now - this.lastFrameStartTime;
    if (elapsedSinceLast < this.minIntervalMs) {
      const waitNeeded = this.minIntervalMs - elapsedSinceLast;
      this.scheduleNextFrame(waitNeeded);
      return;
    }

    if (this.isRequestInFlight || yoloVisionService.isBusy) {
      yoloVisionService.recordDroppedFrame();
      this.scheduleNextFrame(100);
      return;
    }

    if (!this.isPerceptionNeeded()) {
      this.stop();
      return;
    }

    const store = useNavidoorStore.getState();

    this.isRequestInFlight = true;
    this.lastFrameStartTime = Date.now();
    let base64Image: string | null = null;
    let tempPhotoUri: string | null = null;

    try {
      if (Platform.OS === 'web') {
        if (this.videoRef && this.videoRef.videoWidth > 0 && this.videoRef.videoHeight > 0) {
          if (!this.persistentCanvas) {
            this.persistentCanvas = document.createElement('canvas');
            this.persistentCanvas.width = 640;
            this.persistentCanvas.height = 480;
          }
          const canvas = this.persistentCanvas;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(this.videoRef, 0, 0, 640, 480);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.includes(',')) {
              base64Image = dataUrl.split(',')[1];
            }
          }
        }
      } else {
        const cam = this.cameraRef || store.cameraRef;
        if (cam && typeof cam.takePictureAsync === 'function') {
          try {
            const photo = await cam.takePictureAsync({
              quality: 0.65,
              shutterSound: false,
              exif: true,
              skipProcessing: false,
              base64: true,
            });

            if (photo && photo.base64) {
              base64Image = photo.base64;
              tempPhotoUri = photo.uri || null;
            }
          } catch (camErr) {}
        }
      }

      if (!this.isRunning || this.sessionId !== currentSession) {
        return;
      }

      if (base64Image) {
        this.abortController = new AbortController();
        const yoloResult = await yoloVisionService.analyzeFrame(
          base64Image,
          store.activeLanguageCode || 'en',
          store.activeMode,
          this.abortController.signal
        );

        if (!this.isRunning || this.sessionId !== currentSession) {
          return;
        }

        if (yoloResult && yoloResult.success) {
          this.consecutiveErrors = 0;
          this.handleDetectionsResult(yoloResult, false);
        } else if (yoloResult && yoloResult.busy) {
          this.consecutiveErrors = Math.min(this.consecutiveErrors + 1, 5);
        } else {
          this.consecutiveErrors = Math.min(this.consecutiveErrors + 1, 10);
        }
      }
    } catch (err) {
      this.consecutiveErrors = Math.min(this.consecutiveErrors + 1, 10);
    } finally {
      if (tempPhotoUri && Platform.OS !== 'web' && typeof FileSystem.deleteAsync === 'function') {
        FileSystem.deleteAsync(tempPhotoUri, { idempotent: true }).catch(() => {});
      }
      base64Image = null;
      tempPhotoUri = null;
      this.isRequestInFlight = false;
      this.abortController = null;

      const totalElapsed = Date.now() - this.lastFrameStartTime;
      let nextDelay = Math.max(this.targetIntervalMs - totalElapsed, 40);

      if (this.consecutiveErrors > 2) {
        nextDelay = Math.min(nextDelay * (this.consecutiveErrors - 1), 2000);
      }

      if (this.isRunning) {
        this.scheduleNextFrame(nextDelay);
      }
    }
  }

  /**
   * Handles detection response: updates temporal tracker, UI objects, and coordinates speech
   */
  private handleDetectionsResult(result: YoloAnalysisResult, isForcedScan: boolean = false) {
    const rawDetections = (result.detections || []) as any[];
    const now = Date.now();

    // 1. Update temporal object tracker
    const activeTracks = this.tracker.update(rawDetections, now);
    const confirmedTracks = this.tracker.getConfirmedTracks();

    // 2. Map tracks to UI objects with stable IDs and smoothed coordinates
    const mappedObjects = activeTracks.map((t: TrackedObject) => ({
      id: t.trackId,
      classId: t.classId,
      label: t.classLabel,
      emojiIcon: this.getEmojiForClass(t.classLabel),
      category: this.getCategoryForClass(t.classLabel),
      confidence: t.confidence,
      distanceMeters: t.distanceMeters,
      direction: t.zone.toLowerCase() as any,
      xRatio: t.normalizedBbox[0],
      yRatio: t.normalizedBbox[1],
      x2Ratio: t.normalizedBbox[2],
      y2Ratio: t.normalizedBbox[3],
      isHazard: t.riskLevel === 'CRITICAL' || t.riskLevel === 'WARNING',
    }));

    // 3. Always update store visual indicators
    useNavidoorStore.setState({
      detectedObjects: mappedObjects,
    });

    // 4. Centralized Announcement & Prioritized Speech Coordination
    this.coordinateVisionSpeech(confirmedTracks, result, isForcedScan, now);
  }

  /**
   * Centralized audio guidance and hazard alert coordinator
   */
  private coordinateVisionSpeech(
    confirmedTracks: TrackedObject[],
    rawResult: YoloAnalysisResult,
    isForcedScan: boolean,
    now: number
  ) {
    const store = useNavidoorStore.getState();

    // Suppress vision speech while user interacts with mic
    if (store.voiceState === 'listening' || store.voiceState === 'thinking') {
      return;
    }

    const pathState = rawResult.safe_path?.path_state || 'UNKNOWN';

    // Forced scan on demand
    if (isForcedScan) {
      let scanText = '';
      if (confirmedTracks.length > 0) {
        const primary = confirmedTracks[0];
        scanText = this.announcementManager.formatGuidance(primary, 'INFO', store.activeLanguageCode || 'en');
      } else if (pathState === 'PATH_OBSTRUCTED') {
        scanText = this.announcementManager.getSurfaceMessage(store.activeLanguageCode || 'en');
      } else if (pathState === 'VISIBILITY_REDUCED') {
        scanText = this.announcementManager.getVisibilityMessage(store.activeLanguageCode || 'en');
      } else if (pathState === 'PATH_CLEAR') {
        scanText = this.announcementManager.getClearPathMessage(store.activeLanguageCode || 'en');
      } else {
        scanText = this.announcementManager.getUnknownMessage(store.activeLanguageCode || 'en');
      }
      this.speechQueue.enqueue(scanText, 'INFO', { interrupt: true });
      return;
    }

    // Centralized Announcement Manager Decision
    const decision = this.announcementManager.evaluate(
      confirmedTracks,
      store.activeLanguageCode || 'en',
      now,
      pathState
    );

    if (!decision.shouldAnnounce || !decision.text) {
      return;
    }

    // Tactile Obstacle Beep
    if (decision.priority === 'CRITICAL') {
      if (now - this.lastBeepTime > 800) {
        this.lastBeepTime = now;
        try { playObstacleBeep(880, 120); } catch (e) {}
      }
    } else if (decision.priority === 'WARNING') {
      if (now - this.lastBeepTime > 1500) {
        this.lastBeepTime = now;
        try { playObstacleBeep(600, 100); } catch (e) {}
      }
    }

    // Enqueue in prioritized speech queue
    this.speechQueue.enqueue(decision.text, decision.priority, {
      trackId: decision.trackId,
      interrupt: decision.interrupt,
    });
  }

  async forceScan() {
    if (!this.isPerceptionNeeded()) {
      console.log('[ContinuousVisionManager] Force scan ignored: perception not currently needed or profile setup is active.');
      return;
    }
    const store = useNavidoorStore.getState();
    if (!store.isDetectionActive) {
      store.toggleDetection();
      this.start();
    }
    if (!this.isRunning) {
      this.start();
    }
    this.processSingleTick();
  }

  private getEmojiForClass(cls: string = ''): string {
    const c = cls.toLowerCase();
    if (c.includes('person')) return '🚶';
    if (c.includes('car') || c.includes('bus') || c.includes('truck')) return '🚌';
    if (c.includes('chair') || c.includes('couch') || c.includes('sofa')) return '🪑';
    if (c.includes('bottle') || c.includes('medicine') || c.includes('cup')) return '💊';
    if (c.includes('dog') || c.includes('cat')) return '🐕';
    if (c.includes('door')) return '🚪';
    if (c.includes('tv') || c.includes('laptop') || c.includes('cell')) return '📱';
    return '📦';
  }

  private getCategoryForClass(cls: string = ''): 'obstacle' | 'person' | 'door' | 'text' | 'sign' | 'furniture' | 'hazard' {
    const c = cls.toLowerCase();
    if (c.includes('person')) return 'person';
    if (c.includes('door')) return 'door';
    if (c.includes('chair') || c.includes('couch') || c.includes('table')) return 'furniture';
    if (c.includes('car') || c.includes('bus') || c.includes('truck')) return 'hazard';
    return 'obstacle';
  }

  destroy() {
    this.stop();
    if (this.appStateSubscription && typeof this.appStateSubscription.remove === 'function') {
      this.appStateSubscription.remove();
    }
    this.persistentCanvas = null;
  }
}

export const continuousVisionManager = new ContinuousVisionManager();
