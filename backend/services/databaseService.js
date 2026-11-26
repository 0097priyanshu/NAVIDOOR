/**
 * NAVIDOOR Database Service (Neon Postgres via Prisma + Offline In-Memory Fallback)
 * Centralizes persistence for Users, Family Pairing, Medical ID, Medications,
 * OCR History, SOS Alerts, and Location Snapshots.
 */

const bcrypt = require('bcryptjs');
const { getPrismaClient } = require('../lib/prisma');
const { normalizePhone } = require('../lib/phoneUtils');

const DEFAULT_USER_PHONE = '+919812345678';

// Lightweight in-memory fallback when Neon DB is offline or unconfigured
const memoryStore = {
  users: new Map(),
  pairingTokens: new Map(),
  connections: [],
  medications: new Map(),
  ocrScans: [],
  sosAlerts: [],
  locations: [],
};

function statusToClient(status) {
  return (status || 'PENDING').toLowerCase();
}

function statusToDb(status) {
  const s = (status || 'pending').toUpperCase();
  if (['PENDING', 'CONNECTED', 'REJECTED'].includes(s)) return s;
  return 'PENDING';
}

function formatConnection(conn) {
  if (!conn) return null;
  const navUser = conn.assistedUser || {};
  const famUser = conn.caregiver || {};
  return {
    id: conn.id,
    pairingToken: conn.pairingToken || null,
    navidoorUid: navUser.uid || conn.assistedUserId,
    companionUid: famUser.uid || conn.caregiverId,
    navidoorName: navUser.name || 'NAVIDOOR User',
    navidoorPhone: navUser.phone || '',
    toUserPhone: navUser.phone || '',
    companionName: famUser.name || 'Caregiver',
    companionPhone: famUser.phone || '',
    fromFamilyPhone: famUser.phone || '',
    companionRelationship: conn.relationship || 'Family Companion',
    relationship: conn.relationship || 'Family Companion',
    status: statusToClient(conn.status),
    permissions: conn.permissions || {
      canViewLocation: true,
      canViewActivity: true,
      canReceiveSOSAlerts: true,
      canControlRemoteMic: false,
    },
    createdAt: conn.createdAt ? new Date(conn.createdAt).getTime() : Date.now(),
    updatedAt: conn.updatedAt ? new Date(conn.updatedAt).getTime() : Date.now(),
  };
}

class DatabaseService {
  get db() {
    return getPrismaClient();
  }

  async ensureUser({ phone, uid, name, email, role = 'NAVIDOOR_USER', languageCode, themeMode, fontScale, speechRate }) {
    const cleanPhone = normalizePhone(phone) || (uid ? `uid_${uid}` : normalizePhone(DEFAULT_USER_PHONE));
    const db = this.db;

    if (!db) {
      const existing = memoryStore.users.get(cleanPhone) || {
        id: `mem_${cleanPhone}`,
        uid: uid || null,
        phone: cleanPhone,
        name: name || 'NAVIDOOR User',
        email: email || null,
        role,
        languageCode: languageCode || 'en',
        themeMode: themeMode || 'standard',
        fontScale: fontScale || 'normal',
        speechRate: speechRate || 1.0,
      };
      Object.assign(existing, {
        ...(uid ? { uid } : {}),
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(languageCode ? { languageCode } : {}),
        ...(themeMode ? { themeMode } : {}),
        ...(fontScale ? { fontScale } : {}),
        ...(typeof speechRate === 'number' ? { speechRate } : {}),
      });
      memoryStore.users.set(cleanPhone, existing);
      return existing;
    }

    try {
      // Check by uid first if provided
      let existing = uid ? await db.user.findUnique({ where: { uid } }) : null;
      if (!existing && cleanPhone) {
        existing = await db.user.findUnique({ where: { phone: cleanPhone } });
      }

      if (existing) {
        return await db.user.update({
          where: { id: existing.id },
          data: {
            ...(uid && !existing.uid ? { uid } : {}),
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
            ...(languageCode ? { languageCode } : {}),
            ...(themeMode ? { themeMode } : {}),
            ...(fontScale ? { fontScale } : {}),
            ...(typeof speechRate === 'number' ? { speechRate } : {}),
          },
        });
      }

      return await db.user.create({
        data: {
          phone: cleanPhone,
          uid: uid || null,
          name: name || (role === 'FAMILY_MEMBER' ? 'Caregiver' : 'NAVIDOOR User'),
          email: email || null,
          role,
          languageCode: languageCode || 'en',
          themeMode: themeMode || 'standard',
          fontScale: fontScale || 'normal',
          speechRate: typeof speechRate === 'number' ? speechRate : 1.0,
        },
      });
    } catch (err) {
      console.warn('[DatabaseService.ensureUser] Fallback due to DB error:', err.message);
      return { id: `mem_${cleanPhone}`, phone: cleanPhone, uid, name: name || 'NAVIDOOR User', role };
    }
  }

  async getBootstrapData({ phone, uid }) {
    const cleanPhone = normalizePhone(phone);
    const db = this.db;
    if (!db || (!cleanPhone && !uid)) {
      return { source: 'offline-fallback', user: null, medications: [], emergencyContacts: [], ocrScans: [], pendingRequests: [] };
    }

    try {
      const user = await db.user.findFirst({
        where: uid ? { OR: [{ uid }, ...(cleanPhone ? [{ phone: cleanPhone }] : [])] } : { phone: cleanPhone },
        include: {
          medicalProfile: true,
          emergencyContacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
          medications: {
            orderBy: { createdAt: 'desc' },
            include: { logs: { orderBy: { takenAt: 'desc' }, take: 3 } },
          },
          ocrScans: { orderBy: { createdAt: 'desc' }, take: 20 },
          assistedLinks: {
            where: { status: 'PENDING' },
            include: { caregiver: true, assistedUser: true },
          },
        },
      });

      if (!user) {
        return { source: 'neon', user: null, medications: [], emergencyContacts: [], ocrScans: [], pendingRequests: [] };
      }

      return {
        source: 'neon',
        user: {
          id: user.id,
          uid: user.uid,
          phone: user.phone,
          name: user.name,
          role: user.role,
          languageCode: user.languageCode,
          themeMode: user.themeMode,
          fontScale: user.fontScale,
          speechRate: user.speechRate,
        },
        medicalProfile: user.medicalProfile,
        emergencyContacts: user.emergencyContacts,
        medications: user.medications,
        ocrScans: user.ocrScans,
        pendingRequests: (user.assistedLinks || []).map(formatConnection),
      };
    } catch (err) {
      console.warn('[DatabaseService.getBootstrapData] Error:', err.message);
      return { source: 'offline-fallback', error: err.message, user: null, medications: [], emergencyContacts: [], ocrScans: [], pendingRequests: [] };
    }
  }

  // -------------------- FAMILY AUTH & PAIRING --------------------

  async registerFamilyUser({ name, phone, email, password, relationship, uid }) {
    const cleanPhone = normalizePhone(phone) || '+919876543210';
    const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;
    const db = this.db;

    if (!db) {
      return {
        id: `fam_${Date.now()}`,
        name: name || 'Priya Sharma',
        phone: cleanPhone,
        email: email || null,
        relationship: relationship || 'Family Companion',
      };
    }

    try {
      const existing = await db.user.findUnique({ where: { phone: cleanPhone } });
      const user = existing
        ? await db.user.update({
            where: { id: existing.id },
            data: {
              name: name || existing.name,
              email: email || existing.email,
              role: 'FAMILY_MEMBER',
              ...(uid ? { uid } : {}),
              ...(passwordHash ? { passwordHash } : {}),
            },
          })
        : await db.user.create({
            data: {
              phone: cleanPhone,
              uid: uid || null,
              name: name || 'Priya Sharma',
              email: email || null,
              passwordHash,
              role: 'FAMILY_MEMBER',
            },
          });

      return {
        id: user.id,
        uid: user.uid,
        name: user.name,
        phone: user.phone,
        email: user.email,
        relationship: relationship || 'Family Companion',
      };
    } catch (err) {
      console.warn('[DatabaseService.registerFamilyUser] Fallback:', err.message);
      return { id: `fam_${Date.now()}`, name: name || 'Priya Sharma', phone: cleanPhone, email, relationship: relationship || 'Family Companion' };
    }
  }

  async loginFamilyUser({ phone, password }) {
    const cleanPhone = normalizePhone(phone) || '+919876543210';
    const db = this.db;

    if (!db) {
      return { success: true, user: { id: `fam_${Date.now()}`, name: 'Priya Sharma', phone: cleanPhone, relationship: 'Caregiver' } };
    }

    try {
      let user = await db.user.findUnique({ where: { phone: cleanPhone } });
      if (!user) {
        user = await db.user.create({
          data: {
            phone: cleanPhone,
            name: 'Caregiver',
            role: 'FAMILY_MEMBER',
            passwordHash: password ? await bcrypt.hash(String(password), 10) : null,
          },
        });
      } else if (user.passwordHash && password) {
        const valid = await bcrypt.compare(String(password), user.passwordHash);
        if (!valid) {
          return { success: false, error: 'Invalid phone number or password.' };
        }
      }

      return {
        success: true,
        user: {
          id: user.id,
          uid: user.uid,
          name: user.name,
          phone: user.phone,
          email: user.email,
          relationship: 'Caregiver',
        },
      };
    } catch (err) {
      console.warn('[DatabaseService.loginFamilyUser] Fallback:', err.message);
      return { success: true, user: { id: `fam_${Date.now()}`, name: 'Priya Sharma', phone: cleanPhone, relationship: 'Caregiver' } };
    }
  }

  async registerPairingToken({ token, navidoorUid, navidoorName, navidoorPhone, expiresAt }) {
    const expDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 5 * 60 * 1000);
    const db = this.db;
    const cleanPhone = normalizePhone(navidoorPhone);

    const fallbackRecord = {
      token,
      navidoorUid: navidoorUid || 'navidoor_default_user',
      navidoorName: navidoorName || 'NAVIDOOR User',
      navidoorPhone: cleanPhone,
      status: 'active',
      expiresAt: expDate.getTime(),
    };
    memoryStore.pairingTokens.set(token, fallbackRecord);

    if (!db) return fallbackRecord;

    try {
      await this.ensureUser({ phone: cleanPhone, uid: navidoorUid, name: navidoorName, role: 'NAVIDOOR_USER' });
      return await db.pairingToken.upsert({
        where: { token },
        update: { status: 'active', expiresAt: expDate, navidoorName: navidoorName || 'NAVIDOOR User', navidoorPhone: cleanPhone },
        create: {
          token,
          navidoorUid: navidoorUid || 'navidoor_default_user',
          navidoorName: navidoorName || 'NAVIDOOR User',
          navidoorPhone: cleanPhone,
          status: 'active',
          expiresAt: expDate,
        },
      });
    } catch (err) {
      console.warn('[DatabaseService.registerPairingToken] Fallback:', err.message);
      return fallbackRecord;
    }
  }

  async claimPairingToken({ token, companionUid, companionName, companionPhone, companionRelationship }) {
    const db = this.db;
    let tokenData = memoryStore.pairingTokens.get(token);

    if (db) {
      try {
        const dbToken = await db.pairingToken.findUnique({ where: { token } });
        if (dbToken) {
          tokenData = {
            token: dbToken.token,
            navidoorUid: dbToken.navidoorUid,
            navidoorName: dbToken.navidoorName,
            navidoorPhone: dbToken.navidoorPhone,
            status: dbToken.status,
            expiresAt: new Date(dbToken.expiresAt).getTime(),
          };
        }
      } catch (err) {
        console.warn('[DatabaseService.claimPairingToken] DB lookup note:', err.message);
      }
    }

    if (!tokenData && !token.startsWith('pair_')) {
      return { success: false, statusCode: 404, error: 'Invalid pairing token' };
    }

    if (tokenData) {
      if (tokenData.status !== 'active') {
        return { success: false, statusCode: 400, error: 'This pairing token has already been claimed or used.' };
      }
      if (tokenData.expiresAt < Date.now()) {
        if (db) {
          db.pairingToken.update({ where: { token }, data: { status: 'expired' } }).catch(() => {});
        }
        return { success: false, statusCode: 400, error: 'This pairing token has expired. Please ask the user to generate a new QR code.' };
      }
      if (companionUid && tokenData.navidoorUid === companionUid) {
        return { success: false, statusCode: 400, error: 'Cannot pair with your own device.' };
      }
      tokenData.status = 'claimed';
      if (db) {
        db.pairingToken.update({
          where: { token },
          data: { status: 'claimed', claimedBy: companionUid || null, claimedAt: new Date() },
        }).catch(() => {});
      }
    }

    const navidoorUid = tokenData?.navidoorUid || 'navidoor_default_user';
    const navidoorName = tokenData?.navidoorName || 'NAVIDOOR User';
    const navidoorPhone = tokenData?.navidoorPhone || DEFAULT_USER_PHONE;
    const defaultPerms = {
      canViewLocation: true,
      canViewActivity: true,
      canReceiveSOSAlerts: true,
      canControlRemoteMic: false,
    };

    if (!db) {
      const conn = {
        id: `conn_${navidoorUid}_${companionUid || Date.now()}`,
        pairingToken: token,
        navidoorUid,
        companionUid: companionUid || `fam_${Date.now()}`,
        navidoorName,
        navidoorPhone,
        companionName: companionName || 'Caregiver',
        companionPhone: normalizePhone(companionPhone),
        companionRelationship: companionRelationship || 'Family Companion',
        status: 'pending',
        permissions: defaultPerms,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      memoryStore.connections.push(conn);
      return { success: true, connection: conn };
    }

    try {
      const assistedUser = await this.ensureUser({ phone: navidoorPhone, uid: navidoorUid, name: navidoorName, role: 'NAVIDOOR_USER' });
      const caregiver = await this.ensureUser({
        phone: companionPhone || `fam_${companionUid || Date.now()}`,
        uid: companionUid,
        name: companionName || 'Caregiver',
        role: 'FAMILY_MEMBER',
      });

      const conn = await db.caregiverConnection.upsert({
        where: { caregiverId_assistedUserId: { caregiverId: caregiver.id, assistedUserId: assistedUser.id } },
        update: {
          status: 'PENDING',
          pairingToken: token,
          relationship: companionRelationship || 'Family Companion',
          permissions: defaultPerms,
        },
        create: {
          caregiverId: caregiver.id,
          assistedUserId: assistedUser.id,
          relationship: companionRelationship || 'Family Companion',
          status: 'PENDING',
          pairingToken: token,
          permissions: defaultPerms,
        },
        include: { caregiver: true, assistedUser: true },
      });

      return { success: true, connection: formatConnection(conn) };
    } catch (err) {
      console.warn('[DatabaseService.claimPairingToken] DB error:', err.message);
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async updateConnectionStatus({ connectionId, userPhone, familyPhone, status }) {
    const dbStatus = statusToDb(status);
    const db = this.db;
    if (!db) {
      const conn = memoryStore.connections.find((c) => c.id === connectionId);
      if (conn) conn.status = statusToClient(dbStatus);
      return statusToClient(dbStatus);
    }

    try {
      if (connectionId) {
        const updated = await db.caregiverConnection.update({
          where: { id: connectionId },
          data: { status: dbStatus },
        });
        return statusToClient(updated.status);
      }

      const cleanUser = normalizePhone(userPhone);
      const cleanFamily = normalizePhone(familyPhone);
      if (cleanUser && cleanFamily) {
        const assisted = await db.user.findUnique({ where: { phone: cleanUser } });
        const caregiver = await db.user.findUnique({ where: { phone: cleanFamily } });
        if (assisted && caregiver) {
          const updated = await db.caregiverConnection.update({
            where: { caregiverId_assistedUserId: { caregiverId: caregiver.id, assistedUserId: assisted.id } },
            data: { status: dbStatus },
          });
          return statusToClient(updated.status);
        }
      }
    } catch (err) {
      console.warn('[DatabaseService.updateConnectionStatus] Fallback:', err.message);
    }
    return statusToClient(dbStatus);
  }

  async getPendingRequests({ phone, uid }) {
    const cleanPhone = normalizePhone(phone);
    const db = this.db;
    if (!db) {
      return memoryStore.connections.filter(
        (c) => c.status === 'pending' && (!cleanPhone || c.navidoorPhone === cleanPhone || c.navidoorUid === uid)
      );
    }

    try {
      const where = { status: 'PENDING' };
      if (cleanPhone || uid) {
        where.assistedUser = uid
          ? { OR: [{ uid }, ...(cleanPhone ? [{ phone: cleanPhone }] : [])] }
          : { phone: cleanPhone };
      }
      const rows = await db.caregiverConnection.findMany({
        where,
        include: { caregiver: true, assistedUser: true },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(formatConnection);
    } catch (err) {
      console.warn('[DatabaseService.getPendingRequests] Fallback:', err.message);
      return [];
    }
  }

  async getConnectionStatus({ phone }) {
    const cleanPhone = normalizePhone(phone);
    const db = this.db;
    if (!db) {
      const requests = memoryStore.connections.filter(
        (c) => c.companionPhone === cleanPhone || c.navidoorPhone === cleanPhone
      );
      const connectedUsers = requests
        .filter((c) => c.status === 'connected')
        .map((c) => (c.navidoorPhone === cleanPhone ? c.companionPhone : c.navidoorPhone));
      return { requests, connectedUsers };
    }

    try {
      const rows = await db.caregiverConnection.findMany({
        where: cleanPhone
          ? { OR: [{ caregiver: { phone: cleanPhone } }, { assistedUser: { phone: cleanPhone } }] }
          : {},
        include: { caregiver: true, assistedUser: true },
        orderBy: { updatedAt: 'desc' },
      });
      const requests = rows.map(formatConnection);
      const connectedUsers = requests
        .filter((c) => c.status === 'connected')
        .map((c) => (c.navidoorPhone === cleanPhone ? c.companionPhone : c.navidoorPhone))
        .filter(Boolean);
      return { requests, connectedUsers };
    } catch (err) {
      console.warn('[DatabaseService.getConnectionStatus] Fallback:', err.message);
      return { requests: [], connectedUsers: [] };
    }
  }

  async connectFamilyDirect({ familyPhone, familyName, relationship, userPhone, status = 'CONNECTED' }) {
    const cleanUser = normalizePhone(userPhone) || normalizePhone(DEFAULT_USER_PHONE);
    const cleanFamily = normalizePhone(familyPhone) || '+919876543210';
    const dbStatus = statusToDb(status);
    const db = this.db;
    if (!db) {
      return { status: statusToClient(dbStatus), connectedUserPhone: cleanUser };
    }

    try {
      const assistedUser = await this.ensureUser({ phone: cleanUser, role: 'NAVIDOOR_USER' });
      const caregiver = await this.ensureUser({ phone: cleanFamily, name: familyName || 'Caregiver', role: 'FAMILY_MEMBER' });

      await db.caregiverConnection.upsert({
        where: { caregiverId_assistedUserId: { caregiverId: caregiver.id, assistedUserId: assistedUser.id } },
        update: { status: dbStatus, relationship: relationship || 'Family' },
        create: {
          caregiverId: caregiver.id,
          assistedUserId: assistedUser.id,
          relationship: relationship || 'Family',
          status: dbStatus,
        },
      });
      return { status: statusToClient(dbStatus), connectedUserPhone: assistedUser.phone };
    } catch (err) {
      console.warn('[DatabaseService.connectFamilyDirect] Fallback:', err.message);
      return { status: statusToClient(dbStatus), connectedUserPhone: cleanUser };
    }
  }

  async getFamilyDashboard({ phone, userPhone }) {
    const targetPhone = normalizePhone(userPhone) || normalizePhone(phone) || normalizePhone(DEFAULT_USER_PHONE);
    const db = this.db;

    const fallback = {
      userName: 'Aarav Sharma',
      userPhone: targetPhone,
      location: { latitude: 28.6315, longitude: 77.2167, address: 'Connaught Place, Inner Circle, New Delhi' },
      activity: { status: 'Walking safely with AI voice assist', battery: '85%' },
      alerts: [],
      recentScans: [],
      medicines: [],
    };

    if (!db) return fallback;

    try {
      // If caregiver phone is passed, resolve connected assisted user first
      let user = await db.user.findUnique({ where: { phone: targetPhone } });
      if (user && user.role === 'FAMILY_MEMBER') {
        const link = await db.caregiverConnection.findFirst({
          where: { caregiverId: user.id, status: 'CONNECTED' },
          include: { assistedUser: true },
        });
        if (link?.assistedUser) user = link.assistedUser;
      }

      if (!user) return fallback;

      const [latestLoc, activeAlerts, recentScans, medicines] = await Promise.all([
        db.locationSnapshot.findFirst({ where: { userId: user.id }, orderBy: { recordedAt: 'desc' } }),
        db.sosAlert.findMany({ where: { userId: user.id }, orderBy: { triggeredAt: 'desc' }, take: 5 }),
        db.ocrScan.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
        db.medication.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 10 }),
      ]);

      return {
        userName: user.name,
        userPhone: user.phone,
        location: latestLoc
          ? { latitude: latestLoc.latitude, longitude: latestLoc.longitude, address: latestLoc.address || 'Live GPS Location' }
          : fallback.location,
        activity: {
          status: recentScans[0] ? `Scanned ${recentScans[0].category}: ${recentScans[0].spokenSummary}` : 'Walking safely with AI voice assist',
          battery: latestLoc?.batteryPct || '85%',
        },
        alerts: activeAlerts,
        recentScans,
        medicines,
      };
    } catch (err) {
      console.warn('[DatabaseService.getFamilyDashboard] Fallback:', err.message);
      return fallback;
    }
  }

  // -------------------- MEDICAL ID & EMERGENCY CONTACTS --------------------

  async getMedicalProfile(phone) {
    const db = this.db;
    if (!db) return null;
    try {
      const user = await db.user.findUnique({
        where: { phone: normalizePhone(phone) || normalizePhone(DEFAULT_USER_PHONE) },
        include: { medicalProfile: true },
      });
      return user?.medicalProfile || null;
    } catch (err) {
      return null;
    }
  }

  async upsertMedicalProfile({ phone, uid, bloodGroup, allergies, chronicConditions, primaryPhysician, notes }) {
    const db = this.db;
    if (!db) return { bloodGroup, allergies, chronicConditions, primaryPhysician, notes };

    const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
    return await db.medicalProfile.upsert({
      where: { userId: user.id },
      update: {
        ...(bloodGroup !== undefined ? { bloodGroup } : {}),
        ...(Array.isArray(allergies) ? { allergies } : {}),
        ...(Array.isArray(chronicConditions) ? { chronicConditions } : {}),
        ...(primaryPhysician !== undefined ? { primaryPhysician } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      create: {
        userId: user.id,
        bloodGroup: bloodGroup || null,
        allergies: Array.isArray(allergies) ? allergies : [],
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
        primaryPhysician: primaryPhysician || null,
        notes: notes || null,
      },
    });
  }

  async listEmergencyContacts(phone) {
    const db = this.db;
    if (!db) return [];
    const user = await db.user.findUnique({
      where: { phone: normalizePhone(phone) || normalizePhone(DEFAULT_USER_PHONE) },
      include: { emergencyContacts: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } },
    });
    return user?.emergencyContacts || [];
  }

  async addEmergencyContact({ phone, uid, name, relation, contactPhone, isPrimary = false }) {
    const db = this.db;
    if (!db) {
      return { id: `ec_${Date.now()}`, name, relation, phone: contactPhone, isPrimary };
    }
    const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
    return await db.emergencyContact.create({
      data: {
        userId: user.id,
        name,
        relation: relation || 'Family',
        phone: normalizePhone(contactPhone) || contactPhone,
        isPrimary: Boolean(isPrimary),
      },
    });
  }

  async deleteEmergencyContact(id) {
    const db = this.db;
    if (!db) return { deleted: true };
    await db.emergencyContact.delete({ where: { id } }).catch(() => {});
    return { deleted: true };
  }

  // -------------------- MEDICATIONS & ADHERENCE --------------------

  async listMedications(phone) {
    const db = this.db;
    if (!db) return [];
    const user = await db.user.findUnique({
      where: { phone: normalizePhone(phone) || normalizePhone(DEFAULT_USER_PHONE) },
      include: {
        medications: {
          orderBy: { createdAt: 'desc' },
          include: { logs: { orderBy: { takenAt: 'desc' }, take: 5 } },
        },
      },
    });
    return user?.medications || [];
  }

  async addMedication({ phone, uid, name, dosage, instructions, remainingPills, nextScheduledTime, prescribedFor, expiryDate }) {
    const db = this.db;
    if (!db) {
      return { id: `med_${Date.now()}`, name, dosage, instructions, remainingPills, nextScheduledTime, prescribedFor, expiryDate };
    }
    const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
    return await db.medication.create({
      data: {
        userId: user.id,
        name,
        dosage: dosage || '1 Pill',
        instructions: instructions || 'Take daily as prescribed',
        remainingPills: typeof remainingPills === 'number' ? remainingPills : 20,
        nextScheduledTime: nextScheduledTime || '8:00 AM Today',
        prescribedFor: prescribedFor || 'General Health',
        expiryDate: expiryDate || null,
      },
    });
  }

  async confirmMedicationTaken({ medicationId, status = 'TAKEN' }) {
    const db = this.db;
    if (!db) return { success: true };

    const med = await db.medication.findUnique({ where: { id: medicationId } });
    if (!med) return null;

    const nextCount = status === 'TAKEN' ? Math.max(0, med.remainingPills - 1) : med.remainingPills;
    const [updatedMed, log] = await db.$transaction([
      db.medication.update({ where: { id: medicationId }, data: { remainingPills: nextCount } }),
      db.medicationLog.create({ data: { medicationId, status } }),
    ]);

    return { medication: updatedMed, log };
  }

  async deleteMedication(id) {
    const db = this.db;
    if (!db) return { deleted: true };
    await db.medication.delete({ where: { id } }).catch(() => {});
    return { deleted: true };
  }

  // -------------------- OCR SCAN HISTORY (MODULE 5) --------------------

  async logOcrScan({ phone, uid, category, rawText, structuredData, spokenSummary, language = 'en' }) {
    if (!rawText && !spokenSummary) return null;
    const db = this.db;
    if (!db) {
      const row = {
        id: `ocr_${Date.now()}`,
        category: category || 'unknown',
        rawText: rawText || '',
        structuredData: structuredData || null,
        spokenSummary: spokenSummary || '',
        language,
        createdAt: new Date().toISOString(),
      };
      memoryStore.ocrScans.unshift(row);
      if (memoryStore.ocrScans.length > 50) memoryStore.ocrScans.pop();
      return row;
    }

    try {
      const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
      return await db.ocrScan.create({
        data: {
          userId: user.id,
          category: category || 'unknown',
          rawText: rawText || '',
          structuredData: structuredData ?? undefined,
          spokenSummary: spokenSummary || '',
          language,
        },
      });
    } catch (err) {
      console.warn('[DatabaseService.logOcrScan] Non-blocking DB error:', err.message);
      return null;
    }
  }

  async getOcrHistory({ phone, limit = 25 }) {
    const db = this.db;
    if (!db) return memoryStore.ocrScans.slice(0, limit);

    try {
      const cleanPhone = normalizePhone(phone) || normalizePhone(DEFAULT_USER_PHONE);
      const user = await db.user.findUnique({ where: { phone: cleanPhone } });
      if (!user) return [];
      return await db.ocrScan.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (err) {
      console.warn('[DatabaseService.getOcrHistory] Fallback:', err.message);
      return [];
    }
  }

  // -------------------- SOS & LOCATION TRACKING --------------------

  async logSosAlert({ phone, uid, latitude, longitude, address }) {
    const db = this.db;
    if (!db) {
      const alert = { id: `sos_${Date.now()}`, latitude, longitude, address, status: 'ACTIVE', triggeredAt: new Date().toISOString() };
      memoryStore.sosAlerts.unshift(alert);
      return alert;
    }
    try {
      const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
      return await db.sosAlert.create({
        data: {
          userId: user.id,
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
          address: address || null,
          status: 'ACTIVE',
        },
      });
    } catch (err) {
      console.warn('[DatabaseService.logSosAlert] Non-blocking DB error:', err.message);
      return null;
    }
  }

  async resolveSosAlert(id) {
    const db = this.db;
    if (!db) return { id, status: 'RESOLVED' };
    return await db.sosAlert.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  async logLocationSnapshot({ phone, uid, latitude, longitude, address, speed, batteryPct }) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
    const db = this.db;
    if (!db) {
      const snap = { id: `loc_${Date.now()}`, latitude, longitude, address, speed, batteryPct, recordedAt: new Date().toISOString() };
      memoryStore.locations.unshift(snap);
      return snap;
    }
    try {
      const user = await this.ensureUser({ phone, uid, role: 'NAVIDOOR_USER' });
      return await db.locationSnapshot.create({
        data: {
          userId: user.id,
          latitude,
          longitude,
          address: address || null,
          speed: typeof speed === 'number' ? speed : null,
          batteryPct: batteryPct || null,
        },
      });
    } catch (err) {
      console.warn('[DatabaseService.logLocationSnapshot] Non-blocking DB error:', err.message);
      return null;
    }
  }
}

module.exports = new DatabaseService();
