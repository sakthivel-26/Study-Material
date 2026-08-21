// ------------------------------------------------------------------
// Firebase configuration for KEN IAS Academy.
//
// 🔑 TO CONNECT FIREBASE (production):
//   1. Create a project at https://console.firebase.google.com
//   2. Add a Web App and copy the config values below.
//   3. Enable Authentication → Email/Password + Google sign-in.
//   4. Create a file named  .env  in this project and fill in your values.
//   5. (Recommended) Set  VITE_ADMIN_EMAILS  to the admin email(s).
//
// The app runs in a safe DEMO mode until you fill in the config. Once you
// add real values, Firebase auth (with email verification) takes over
// automatically — no code changes needed.
// ------------------------------------------------------------------

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only when a real Firebase config has been provided in .env
export const isFirebaseConfigured =
  !!config.apiKey && !!config.projectId && !!config.appId;

// The admin account(s). Only these emails can access the /admin panel.
export const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS || "admin@kenias.academy"
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

let app = null;
let auth = null;
let db = null;
let storage = null;

// Lazy singleton initializers — only called when Firebase is configured.
export async function getFirebaseApp() {
  const { initializeApp } = await import("firebase/app");
  if (!app) app = initializeApp(config);
  return app;
}

export async function getFirebaseAuth() {
  const { getAuth } = await import("firebase/auth");
  if (!auth) {
    const a = await getFirebaseApp();
    auth = getAuth(a);
  }
  return auth;
}

export async function getFirebaseDb() {
  const { getFirestore } = await import("firebase/firestore");
  if (!db) {
    const a = await getFirebaseApp();
    db = getFirestore(a);
  }
  return db;
}

export async function getFirebaseStorage() {
  const { getStorage } = await import("firebase/storage");
  if (!storage) {
    const a = await getFirebaseApp();
    storage = getStorage(a);
  }
  return storage;
}
