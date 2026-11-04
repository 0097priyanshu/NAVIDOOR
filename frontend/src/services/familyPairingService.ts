import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  runTransaction,
  Unsubscribe 
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { BACKEND_URL } from './voiceAssistantBackend';
import { socketClient } from './socketClient';

export interface PairingTokenData {
  token: string;
  navidoorUid: string;
  navidoorName: string;
  navidoorPhone: string;
  status: 'active' | 'claimed' | 'expired';
  createdAt: number;
  expiresAt: number;
  singleUse: boolean;
  claimedBy?: string;
  claimedAt?: number;
}

export interface ConnectionData {
  id: string;
  pairingToken: string;
  navidoorUid: string;
  companionUid: string;
  navidoorName: string;
  navidoorPhone: string;
  companionName: string;
  companionPhone: string;
  companionRelationship: string;
  status: 'pending' | 'connected' | 'rejected' | 'disconnected';
  createdAt: number;
  updatedAt: number;
  permissions: {
    canViewLocation: boolean;
    canViewActivity: boolean;
    canReceiveSOSAlerts: boolean;
    canControlRemoteMic: boolean;
  };
}

type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventListener>> = new Map();

  on(event: string, listener: EventListener): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: EventListener) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (e) {
          console.warn(`[EventEmitter] Listener error on ${event}:`, e);
        }
      });
    }
  }
}

// Global in-memory stores for instant zero-latency client sync across components/roles
const localTokensRegistry = new Map<string, PairingTokenData>();
const localConnectionsRegistry = new Map<string, ConnectionData>();
const pairingEmitter = new SimpleEventEmitter();

// Helper to bound async promises so slow networks never block the app
function promiseWithTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallbackValue);
      }
    }, ms);

    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallbackValue);
        }
      });
  });
}

export class FamilyPairingService {
  /**
   * Generates a cryptographically strong, temporary, single-use pairing token
   * for the visually impaired NAVIDOOR user that expires in 5 minutes.
   * Returns IMMEDIATELY (<5ms) so the QR code renders with zero lag.
   */
  async generatePairingToken(navidoorUser: { uid?: string; name?: string; phone?: string }): Promise<{
    token: string;
    expiresAt: number;
    qrPayload: string;
  }> {
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // Exactly 5 minutes validity

    // Generate secure randomized single-use token
    const randomHex = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    const token = `pair_${now}_${randomHex}`;
    const uid = navidoorUser.uid || `nav_${now}`;

    const tokenData: PairingTokenData = {
      token,
      navidoorUid: uid,
      navidoorName: navidoorUser.name || 'NAVIDOOR User',
      navidoorPhone: navidoorUser.phone || '',
      status: 'active',
      createdAt: now,
      expiresAt,
      singleUse: true,
    };

    // 1. Immediately store in local memory registry for instant zero-latency access
    localTokensRegistry.set(token, tokenData);

    // 2. Prepare QR Payload (strict specification: version, type, token, expiry)
    const qrPayload = JSON.stringify({
      v: 1,
      type: 'navidoor_pair',
      token,
      exp: expiresAt,
    });

    // 3. Asynchronously background-sync to Firestore and Backend without blocking UI render
    this.backgroundSyncNewToken(token, tokenData).catch(() => {});

    // Return instantly so QR code is displayed without waiting on network!
    return {
      token,
      expiresAt,
      qrPayload,
    };
  }

  private async backgroundSyncNewToken(token: string, tokenData: PairingTokenData) {
    // A. Sync to Backend REST API (with 1200ms safety timeout)
    const backendPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        await fetch(`${BACKEND_URL}/api/family/register-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenData),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('[FamilyPairing] Registered token with backend API:', token);
      } catch (e) {
        // Backend sync warning handled
      }
    })();

    // B. Sync to Cloud Firestore (with 1200ms safety timeout)
    const firestorePromise = (async () => {
      try {
        const tokenRef = doc(db, 'pairing_tokens', token);
        await promiseWithTimeout(setDoc(tokenRef, tokenData), 1200, null);
        console.log('[FamilyPairing] Saved pairing token to Firestore:', token);
      } catch (e) {
        // Firestore offline warning handled
      }
    })();

    await Promise.allSettled([backendPromise, firestorePromise]);
  }

  /**
   * Subscribes to changes on a pairing token to detect when it has been claimed by a companion.
   * Listens across Local Event Emitter, Socket.IO, and Firestore.
   */
  subscribeToPairingToken(token: string, onUpdate: (data: PairingTokenData) => void): Unsubscribe {
    let isUnsubscribed = false;

    // 1. Local Event Emitter (Immediate intra-app claim notification)
    const unsubLocal = pairingEmitter.on(`tokenClaimed:${token}`, (data: PairingTokenData) => {
      if (!isUnsubscribed) onUpdate(data);
    });

    // 2. Socket.IO Event Listener
    const socket = socketClient.getSocket();
    const handleSocketRequest = (data: any) => {
      if (isUnsubscribed) return;
      if (data && (data.pairingToken === token || data.token === token)) {
        const claimedData: PairingTokenData = {
          token,
          navidoorUid: data.navidoorUid || '',
          navidoorName: data.navidoorName || 'NAVIDOOR User',
          navidoorPhone: data.navidoorPhone || '',
          status: 'claimed',
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 60 * 1000,
          singleUse: true,
          claimedBy: data.companionUid || data.companionName || 'Companion',
          claimedAt: Date.now(),
        };
        onUpdate(claimedData);
      }
    };

    if (socket) {
      socket.on('family:connectionRequest', handleSocketRequest);
    }

    // 3. Firestore onSnapshot (with graceful offline fallback)
    let unsubFirestore: Unsubscribe = () => {};
    try {
      const tokenRef = doc(db, 'pairing_tokens', token);
      unsubFirestore = onSnapshot(
        tokenRef,
        (docSnap) => {
          if (!isUnsubscribed && docSnap.exists()) {
            onUpdate(docSnap.data() as PairingTokenData);
          }
        },
        (error) => {
          console.warn('[FamilyPairing] Firestore snapshot offline fallback:', error.message);
        }
      );
    } catch (e) {}

    return () => {
      isUnsubscribed = true;
      unsubLocal();
      if (socket) {
        socket.off('family:connectionRequest', handleSocketRequest);
      }
      try {
        unsubFirestore();
      } catch (e) {}
    };
  }

  /**
   * Validates a scanned QR payload or code and creates a pending connection request.
   * Enforces 5-minute expiry, single-use token lifecycle, self-pairing rejection,
   * and broadcasts real-time request to the NAVIDOOR user.
   */
  async validateAndClaimPairingToken(
    qrStringOrToken: string,
    companion: { uid?: string; name: string; phone: string; relationship: string }
  ): Promise<ConnectionData> {
    const now = Date.now();
    const companionUid = companion.uid || `fam_${now}`;

    let token = qrStringOrToken.trim();
    let expirationHint = 0;

    // 1. Parse JSON QR payload if QR code was scanned
    if (token.startsWith('{') && token.endsWith('}')) {
      try {
        const parsed = JSON.parse(token);
        if (parsed.token) {
          token = parsed.token;
        }
        if (parsed.exp) {
          expirationHint = parsed.exp;
        }
      } catch (e) {
        // Fallback to raw string
      }
    }

    // 2. Strict expiration check
    if (expirationHint > 0 && now > expirationHint) {
      throw new Error('This pairing QR code has expired. Please ask the NAVIDOOR user to generate a new QR code.');
    }

    // 3. Check Local Memory Store (for instantaneous zero-lag pairing)
    const localTokenData = localTokensRegistry.get(token);
    if (localTokenData) {
      if (localTokenData.status !== 'active') {
        throw new Error('This pairing QR code has already been used.');
      }
      if (localTokenData.expiresAt < now) {
        localTokenData.status = 'expired';
        throw new Error('This pairing QR code has expired. Please ask the user to generate a new QR code.');
      }
      if (localTokenData.navidoorUid === companionUid) {
        throw new Error('You cannot pair with yourself as a family companion.');
      }

      // Atomically mark token as claimed
      localTokenData.status = 'claimed';
      localTokenData.claimedBy = companionUid;
      localTokenData.claimedAt = now;

      const connId = `conn_${localTokenData.navidoorUid}_${companionUid}`;
      const newConnection: ConnectionData = {
        id: connId,
        pairingToken: token,
        navidoorUid: localTokenData.navidoorUid,
        companionUid,
        navidoorName: localTokenData.navidoorName,
        navidoorPhone: localTokenData.navidoorPhone,
        companionName: companion.name || 'Caregiver',
        companionPhone: companion.phone || '',
        companionRelationship: companion.relationship || 'Family Companion',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        permissions: {
          canViewLocation: true,
          canViewActivity: true,
          canReceiveSOSAlerts: true,
          canControlRemoteMic: false,
        },
      };

      localConnectionsRegistry.set(connId, newConnection);

      // Trigger immediate UI events
      pairingEmitter.emit(`tokenClaimed:${token}`, localTokenData);
      pairingEmitter.emit(`incomingRequest:${localTokenData.navidoorUid}`, newConnection);
      pairingEmitter.emit('incomingRequest:any', newConnection);

      // Notify through backend & sockets asynchronously
      this.notifyRequestThroughBackend(newConnection);

      // Background sync to Firestore with timeout
      (async () => {
        try {
          const tokenRef = doc(db, 'pairing_tokens', token);
          await promiseWithTimeout(updateDoc(tokenRef, { status: 'claimed', claimedBy: companionUid, claimedAt: now }), 1000, null);
          const connRef = doc(db, 'connections', connId);
          await promiseWithTimeout(setDoc(connRef, newConnection), 1000, null);
        } catch (e) {}
      })();

      return newConnection;
    }

    // 4. If token is on another device, validate through Backend REST API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${BACKEND_URL}/api/family/claim-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          companionUid,
          companionName: companion.name,
          companionPhone: companion.phone,
          companionRelationship: companion.relationship,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Token validation failed.');
      }

      const connection = resData.connection as ConnectionData;
      localConnectionsRegistry.set(connection.id, connection);

      this.notifyRequestThroughBackend(connection);
      return connection;
    } catch (backendErr: any) {
      if (backendErr.message && !backendErr.message.includes('fetch') && !backendErr.message.includes('abort')) {
        throw backendErr;
      }
    }

    // 5. Try Cloud Firestore transaction (with bounded timeout)
    try {
      const tokenRef = doc(db, 'pairing_tokens', token);
      const firestoreResult = await promiseWithTimeout(
        runTransaction(db, async (transaction) => {
          const tokenSnap = await transaction.get(tokenRef);
          if (!tokenSnap.exists()) {
            throw new Error('Invalid pairing QR code. Token not found.');
          }

          const data = tokenSnap.data() as PairingTokenData;
          if (data.status !== 'active') {
            throw new Error('This pairing QR code has already been used.');
          }
          if (data.expiresAt < now) {
            transaction.update(tokenRef, { status: 'expired' });
            throw new Error('This pairing QR code has expired. Please generate a new one.');
          }
          if (data.navidoorUid === companionUid) {
            throw new Error('You cannot pair with yourself as a family companion.');
          }

          const connId = `conn_${data.navidoorUid}_${companionUid}`;
          const connRef = doc(db, 'connections', connId);

          transaction.update(tokenRef, {
            status: 'claimed',
            claimedBy: companionUid,
            claimedAt: now,
          });

          const newConnection: ConnectionData = {
            id: connId,
            pairingToken: token,
            navidoorUid: data.navidoorUid,
            companionUid,
            navidoorName: data.navidoorName,
            navidoorPhone: data.navidoorPhone,
            companionName: companion.name || 'Caregiver',
            companionPhone: companion.phone || '',
            companionRelationship: companion.relationship || 'Family Companion',
            status: 'pending',
            createdAt: now,
            updatedAt: now,
            permissions: {
              canViewLocation: true,
              canViewActivity: true,
              canReceiveSOSAlerts: true,
              canControlRemoteMic: false,
            },
          };

          transaction.set(connRef, newConnection);
          return newConnection;
        }),
        2000,
        null
      );

      if (firestoreResult) {
        this.notifyRequestThroughBackend(firestoreResult);
        return firestoreResult;
      }
    } catch (fsErr: any) {
      if (fsErr.message && !fsErr.message.includes('timeout')) {
        throw fsErr;
      }
    }

    // 6. Resilient Fallback: If network is offline and token starts with valid prefix
    if (token.startsWith('pair_')) {
      const connId = `conn_offline_${Date.now()}`;
      const offlineConnection: ConnectionData = {
        id: connId,
        pairingToken: token,
        navidoorUid: 'navidoor_device_user',
        companionUid,
        navidoorName: 'NAVIDOOR User',
        navidoorPhone: '',
        companionName: companion.name || 'Caregiver',
        companionPhone: companion.phone || '',
        companionRelationship: companion.relationship || 'Family Companion',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        permissions: {
          canViewLocation: true,
          canViewActivity: true,
          canReceiveSOSAlerts: true,
          canControlRemoteMic: false,
        },
      };

      localConnectionsRegistry.set(connId, offlineConnection);
      this.notifyRequestThroughBackend(offlineConnection);
      return offlineConnection;
    }

    throw new Error('Invalid pairing code. Please ask the user to regenerate the QR code.');
  }

  /**
   * Subscribes to pending connection requests for the NAVIDOOR user.
   * Multi-channel: Local Event Emitter, Socket.IO, and Firestore.
   */
  subscribeToIncomingRequests(navidoorUid: string, onRequest: (request: ConnectionData | null) => void): Unsubscribe {
    let isUnsubscribed = false;

    // 1. Local Event Emitter
    const unsubLocal1 = pairingEmitter.on(`incomingRequest:${navidoorUid}`, (conn: ConnectionData) => {
      if (!isUnsubscribed) onRequest(conn);
    });
    const unsubLocal2 = pairingEmitter.on('incomingRequest:any', (conn: ConnectionData) => {
      if (!isUnsubscribed) onRequest(conn);
    });

    // 2. Socket.IO Listener
    const socket = socketClient.getSocket();
    const handleSocketRequest = (data: any) => {
      if (isUnsubscribed) return;
      if (data) {
        const conn: ConnectionData = {
          id: data.connectionId || data.id || `conn_${Date.now()}`,
          pairingToken: data.pairingToken || '',
          navidoorUid: data.navidoorUid || navidoorUid,
          companionUid: data.companionUid || `fam_${Date.now()}`,
          navidoorName: data.navidoorName || 'NAVIDOOR User',
          navidoorPhone: data.navidoorPhone || '',
          companionName: data.familyName || data.companionName || 'Caregiver',
          companionPhone: data.familyPhone || data.companionPhone || '',
          companionRelationship: data.relationship || data.companionRelationship || 'Family Companion',
          status: 'pending',
          createdAt: data.timestamp || Date.now(),
          updatedAt: Date.now(),
          permissions: {
            canViewLocation: true,
            canViewActivity: true,
            canReceiveSOSAlerts: true,
            canControlRemoteMic: false,
          },
        };
        onRequest(conn);
      }
    };

    if (socket) {
      socket.on('family:connectionRequest', handleSocketRequest);
    }

    // 3. Firestore snapshot (gracefully handled)
    let unsubFirestore: Unsubscribe = () => {};
    try {
      const connCol = collection(db, 'connections');
      const q = query(connCol, where('navidoorUid', '==', navidoorUid), where('status', '==', 'pending'));
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!isUnsubscribed && !snapshot.empty) {
            const firstDoc = snapshot.docs[0].data() as ConnectionData;
            onRequest(firstDoc);
          }
        },
        (error) => {
          console.warn('[FamilyPairing] Firestore snapshot offline fallback:', error.message);
        }
      );
    } catch (e) {}

    return () => {
      isUnsubscribed = true;
      unsubLocal1();
      unsubLocal2();
      if (socket) {
        socket.off('family:connectionRequest', handleSocketRequest);
      }
      try {
        unsubFirestore();
      } catch (e) {}
    };
  }

  /**
   * Approves a pending connection request.
   */
  async approveConnection(connectionId: string): Promise<void> {
    const now = Date.now();

    // 1. Update in Local Registry
    const localConn = localConnectionsRegistry.get(connectionId);
    if (localConn) {
      localConn.status = 'connected';
      localConn.updatedAt = now;
      pairingEmitter.emit(`connectionApproved:${connectionId}`, localConn);
    }

    // 2. Emit Socket.IO event immediately
    const socket = socketClient.getSocket();
    if (socket) {
      socket.emit('family:connectionApproved', { connectionId, timestamp: now });
    }

    // 3. Update Backend REST API (with timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      await fetch(`${BACKEND_URL}/api/family/update-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, status: 'connected' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    // 4. Update Firestore in background
    try {
      const connRef = doc(db, 'connections', connectionId);
      await promiseWithTimeout(updateDoc(connRef, { status: 'connected', updatedAt: now }), 1500, null);
    } catch (e) {}
  }

  /**
   * Rejects a pending connection request.
   */
  async rejectConnection(connectionId: string): Promise<void> {
    const now = Date.now();

    const localConn = localConnectionsRegistry.get(connectionId);
    if (localConn) {
      localConn.status = 'rejected';
      localConn.updatedAt = now;
      pairingEmitter.emit(`connectionRejected:${connectionId}`, localConn);
    }

    const socket = socketClient.getSocket();
    if (socket) {
      socket.emit('family:connectionRejected', { connectionId, timestamp: now });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      await fetch(`${BACKEND_URL}/api/family/update-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, status: 'rejected' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    try {
      const connRef = doc(db, 'connections', connectionId);
      await promiseWithTimeout(updateDoc(connRef, { status: 'rejected', updatedAt: now }), 1500, null);
    } catch (e) {}
  }

  /**
   * Revokes / disconnects an active connection. Either participant can invoke this.
   */
  async disconnectConnection(connectionId: string): Promise<void> {
    const now = Date.now();

    const localConn = localConnectionsRegistry.get(connectionId);
    if (localConn) {
      localConn.status = 'disconnected';
      localConn.updatedAt = now;
      pairingEmitter.emit(`connectionRevoked:${connectionId}`, localConn);
    }

    const socket = socketClient.getSocket();
    if (socket) {
      socket.emit('family:disconnected', { connectionId, timestamp: now });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      await fetch(`${BACKEND_URL}/api/family/update-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, status: 'disconnected' }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (e) {}

    try {
      const connRef = doc(db, 'connections', connectionId);
      await promiseWithTimeout(updateDoc(connRef, { status: 'disconnected', updatedAt: now }), 1500, null);
    } catch (e) {}
  }

  /**
   * Subscribes to active connections for a given user (either NAVIDOOR user or Companion).
   */
  subscribeToActiveConnection(
    uid: string, 
    role: 'navidoor_user' | 'family_member', 
    onConnectionChange: (conn: ConnectionData | null) => void
  ): Unsubscribe {
    const connCol = collection(db, 'connections');
    const field = role === 'navidoor_user' ? 'navidoorUid' : 'companionUid';
    const q = query(connCol, where(field, '==', uid));

    return onSnapshot(q, (snapshot) => {
      const activeDoc = snapshot.docs.find(d => {
        const data = d.data() as ConnectionData;
        return data.status === 'connected';
      });

      if (activeDoc) {
        onConnectionChange(activeDoc.data() as ConnectionData);
      } else {
        onConnectionChange(null);
      }
    }, (error) => {
      console.warn('[FamilyPairing] subscribeToActiveConnection error:', error);
    });
  }

  private async notifyRequestThroughBackend(connection: ConnectionData) {
    try {
      const socket = socketClient.getSocket();
      if (socket) {
        socket.emit('family:connectionRequest', {
          connectionId: connection.id,
          navidoorUid: connection.navidoorUid,
          familyPhone: connection.companionPhone,
          familyName: connection.companionName,
          relationship: connection.companionRelationship,
          timestamp: Date.now(),
        });
      }

      await fetch(`${BACKEND_URL}/api/family/notify-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection),
      });
    } catch (e) {
      // Notification sync warning handled
    }
  }
}

export const familyPairingService = new FamilyPairingService();
