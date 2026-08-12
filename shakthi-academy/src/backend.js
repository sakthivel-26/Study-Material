// ------------------------------------------------------------------
// Realtime backend for KEN IAS Academy using Firebase Firestore + Storage.
//
// When Firebase is configured (a real .env exists), this module is used
// instead of the in-memory demo data:
//   • uploads / mockTests / notifications live in Firestore collections
//   • a Firestore onSnapshot listener syncs every logged-in device in real
//     time (when the admin uploads, all students see it instantly)
//   • PDFs/images are uploaded to Firebase Storage
//
// When Firebase is NOT configured, the app falls back to demo mode.
// ------------------------------------------------------------------

import {
  isFirebaseConfigured,
  getFirebaseDb,
  getFirebaseStorage,
  getFirebaseAuth,
} from "./firebase.js";

const COLLECTIONS = {
  uploads: "uploads",
  mockTests: "mockTests",
  notifications: "notifications",
};

const NOTIF_ICONS = { pdf: "📄", video: "🎥", mock: "📝", announcement: "📢" };
const NOTIF_COLORS = { pdf: "#8B5CF6", video: "#0EA5E9", mock: "#10B981", announcement: "#EF4444" };

const mapDoc = (doc) => ({ ...doc.data(), id: doc.id });

/* --------------------------- SUBSCRIBE (realtime) ------------------------- */
// Sets up onSnapshot listeners so all logged-in devices update live.
export async function subscribeBackend({ onUploads, onTests, onNotifications }) {
  const { onSnapshot, collection, query, orderBy } = await import("firebase/firestore");
  const db = await getFirebaseDb();
  const unsubs = [];
  unsubs.push(
    onSnapshot(query(collection(db, COLLECTIONS.uploads), orderBy("createdAt", "desc")), (snap) =>
      onUploads(snap.docs.map(mapDoc))
    )
  );
  unsubs.push(
    onSnapshot(query(collection(db, COLLECTIONS.mockTests), orderBy("createdAt", "desc")), (snap) =>
      onTests(snap.docs.map(mapDoc))
    )
  );
  unsubs.push(
    onSnapshot(query(collection(db, COLLECTIONS.notifications), orderBy("createdAt", "desc")), (snap) =>
      onNotifications(snap.docs.map(mapDoc))
    )
  );
  return () => unsubs.forEach((u) => u());
}

/* ------------------------------- WRITERS --------------------------------- */
export async function fsAddUpload(item) {
  const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
  const db = await getFirebaseDb();
  const cleanItem = Object.fromEntries(
    Object.entries(item).filter(([_, v]) => v !== undefined)
  );
  const ref = await addDoc(collection(db, COLLECTIONS.uploads), {
    ...cleanItem,
    createdAt: serverTimestamp(),
  });
  return { ...cleanItem, id: ref.id, createdAt: Date.now() };
}

export async function fsAddMockTest(test) {
  const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
  const db = await getFirebaseDb();
  const ref = await addDoc(collection(db, COLLECTIONS.mockTests), {
    ...test,
    createdAt: serverTimestamp(),
  });
  return { ...test, id: ref.id };
}

export async function fsNotify(type, title, body) {
  const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
  const db = await getFirebaseDb();
  await addDoc(collection(db, COLLECTIONS.notifications), {
    type,
    icon: NOTIF_ICONS[type] || "🔔",
    title,
    body,
    read: false,
    color: NOTIF_COLORS[type] || "#6D28D9",
    createdAt: serverTimestamp(),
  });
}

export async function fsMarkAllRead() {
  const { collection, query, where, getDocs, updateDoc, doc } = await import("firebase/firestore");
  const db = await getFirebaseDb();
  const q = query(collection(db, COLLECTIONS.notifications), where("read", "==", false));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(doc(db, COLLECTIONS.notifications, d.id), { read: true })));
}

/* ---------------------------- STORAGE (PDFs) ------------------------------ */
// Uploads a file to Firebase Storage under {folder}/{uid}/{timestamp}-{name}
export async function fsUploadFile(file, uid, folder = "uploads") {
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const st = await getFirebaseStorage();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${uid}/${Date.now()}-${safeName}`;
  const storageRef = ref(st, path);
  const snap = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snap.ref);
  return { url, path };
}

export async function currentUserId() {
  const auth = await getFirebaseAuth();
  return auth.currentUser?.uid || "anonymous";
}

export const useRealtimeBackend = isFirebaseConfigured;
