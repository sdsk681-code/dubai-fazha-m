import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  authDomain: 'dsfe-ert.firebaseapp.com',
  databaseURL: 'https://dsfe-ert-default-rtdb.firebaseio.com',
  projectId: 'dsfe-ert',
  storageBucket: 'dsfe-ert.firebasestorage.app',
  messagingSenderId: '964263514104',
  appId: '1:964263514104:web:de017cc91f93959df4500d',
  measurementId: 'G-LEJC41RWGS',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// ── types ─────────────────────────────────────────────────────────────────

export interface RegPayload {
  fullName: string;
  phone: string;
  emiratesId: string;
  brand: string;
  cardType: string;
  region: string;
  streetAddress: string;
  neighborhood: string;
  deliveryDate: string;
  paymentMethod: string;
}

export interface Registration {
  id: string;
  fullName: string;
  phone: string;
  emiratesId: string;
  brand: string;
  cardType: string;
  region: string;
  streetAddress: string;
  neighborhood: string;
  deliveryDate: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ── helpers ───────────────────────────────────────────────────────────────

/** Insert a new registration and return its Firestore document ID */
export async function createRegistration(p: RegPayload): Promise<string> {
  const docRef = await addDoc(collection(db, 'registrations'), {
    fullName: p.fullName,
    phone: p.phone,
    emiratesId: p.emiratesId,
    brand: p.brand,
    cardType: p.cardType,
    region: p.region,
    streetAddress: p.streetAddress,
    neighborhood: p.neighborhood,
    deliveryDate: p.deliveryDate,
    paymentMethod: p.paymentMethod,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Approve a registration */
export async function approveRegistration(id: string): Promise<void> {
  await updateDoc(doc(db, 'registrations', id), { status: 'approved' });
}

/** Fetch a single registration by Firestore document ID */
export async function getRegistration(id: string): Promise<Registration | null> {
  if (!id) return null;
  const snap = await getDoc(doc(db, 'registrations', id));
  if (!snap.exists()) return null;
  const r = snap.data();
  const createdAt =
    r['createdAt'] instanceof Timestamp
      ? r['createdAt'].toDate().toISOString()
      : typeof r['createdAt'] === 'string'
      ? r['createdAt']
      : new Date().toISOString();
  return {
    id: snap.id,
    fullName: String(r['fullName'] ?? ''),
    phone: String(r['phone'] ?? ''),
    emiratesId: String(r['emiratesId'] ?? ''),
    brand: String(r['brand'] ?? ''),
    cardType: String(r['cardType'] ?? ''),
    region: String(r['region'] ?? ''),
    streetAddress: String(r['streetAddress'] ?? ''),
    neighborhood: String(r['neighborhood'] ?? ''),
    deliveryDate: String(r['deliveryDate'] ?? ''),
    paymentMethod: String(r['paymentMethod'] ?? ''),
    status: (r['status'] as Registration['status']) ?? 'pending',
    createdAt,
  };
}

/** Fetch all registrations ordered by creation date (admin) */
export async function listRegistrations(): Promise<Registration[]> {
  const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const r = d.data();
    const createdAt =
      r['createdAt'] instanceof Timestamp
        ? r['createdAt'].toDate().toISOString()
        : typeof r['createdAt'] === 'string'
        ? r['createdAt']
        : new Date().toISOString();
    return {
      id: d.id,
      fullName: String(r['fullName'] ?? ''),
      phone: String(r['phone'] ?? ''),
      emiratesId: String(r['emiratesId'] ?? ''),
      brand: String(r['brand'] ?? ''),
      cardType: String(r['cardType'] ?? ''),
      region: String(r['region'] ?? ''),
      streetAddress: String(r['streetAddress'] ?? ''),
      neighborhood: String(r['neighborhood'] ?? ''),
      deliveryDate: String(r['deliveryDate'] ?? ''),
      paymentMethod: String(r['paymentMethod'] ?? ''),
      status: (r['status'] as Registration['status']) ?? 'pending',
      createdAt,
    };
  });
}

/** Update registration status (admin) */
export async function updateRegistrationStatus(
  id: string,
  status: 'approved' | 'rejected',
): Promise<void> {
  await updateDoc(doc(db, 'registrations', id), { status });
}
