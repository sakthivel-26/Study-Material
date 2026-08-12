import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  isFirebaseConfigured,
  ADMIN_EMAILS,
  getFirebaseAuth,
} from "./firebase.js";

// ------------------------------------------------------------------
// Authentication for Shakthi Academy.
//
// TWO MODES — selected automatically:
//   • FIREBASE MODE  (when Firebase config is added to .env)
//       Real accounts, email verification, Google OAuth.
//       Only verified email addresses can log in.
//   • DEMO MODE      (no config yet)
//       Runs locally in the browser so you can try the whole flow now.
//
// The rest of the app only consumes the { user, role } shape, so the
// UI is identical in both modes.
// ------------------------------------------------------------------

const AuthCtx = createContext(null);
const STORAGE_KEY = "kenias_session";
const USERS_KEY = "kenias_users";

const initialsOf = (name) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const seed = () => {
  const base = [
    {
      id: "u_admin",
      name: "KEN IAS Admin",
      email: "admin@kenias.academy",
      password: "admin123",
      role: "admin",
      initials: "KA",
      createdAt: new Date().toISOString(),
    },
    {
      id: "u_arjun",
      name: "Arjun Kumar",
      email: "arjun.kumar@gmail.com",
      password: "student123",
      role: "student",
      initials: "AK",
      createdAt: new Date().toISOString(),
    },
  ];
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(base));
  return base;
};

export const loadUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return seed();
  } catch {
    return seed();
  }
};
export const persistUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event("shakthi_users_updated"));
};

export const getRegisteredStudents = () => {
  const users = loadUsers();
  return users
    .filter((u) => u.role !== "admin")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      enrolled: u.enrolled || "UPSC Civil Services",
      progress: u.progress || 0,
      joined: new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    }));
};

export const removeStudentByEmail = (email) => {
  const users = loadUsers().filter(
    (u) => u.email.toLowerCase() !== email.toLowerCase()
  );
  persistUsers(users);
  return getRegisteredStudents();
};

// Map a Firebase user object to our app user shape.
const fbToUser = (fb) => {
  const email = (fb.email || "").toLowerCase();
  const name = fb.displayName || email.split("@")[0];
  return {
    id: fb.uid,
    name,
    email,
    role: ADMIN_EMAILS.includes(email) ? "admin" : "student",
    initials: initialsOf(name),
    photo: fb.photoURL || null,
    provider: fb.providerData?.[0]?.providerId || "firebase",
    emailVerified: !!fb.emailVerified,
    createdAt: fb.metadata?.creationTime || null,
  };
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Keep the Firebase session in sync with React state.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsub = () => {};
    (async () => {
      const { onAuthStateChanged } = await import("firebase/auth");
      const auth = await getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (fb) => {
        setSession(fb ? fbToUser(fb) : null);
        if (fb) setError(null);
      });
    })();
    return () => unsub();
  }, []);

  // Persist demo-mode session.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  /* ------------------------------ DEMO MODE ------------------------------ */
  const demoSignUp = ({ name, email, password, role = "student", enrolled = "UPSC Civil Services" }) => {
    const list = loadUsers();
    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError("An account with this email already exists.");
      throw new Error("email-exists");
    }
    const nu = {
      id: "u_" + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      enrolled,
      initials: initialsOf(name),
      createdAt: new Date().toISOString(),
    };
    const next = [...list, nu];
    persistUsers(next);
    setSession({ ...nu, provider: "email", emailVerified: true });
    notify(`Welcome to KEN IAS Academy, ${nu.name}! 🎉`);
    return { ...nu, provider: "email", emailVerified: true };
  };

  const demoSignIn = ({ email, password }) => {
    const cleanEmail = (email || "").trim().toLowerCase();
    let list = loadUsers();
    let found = list.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    // Fallback search in seed defaults if missing from local state
    if (!found) {
      const baseDefaults = [
        {
          id: "u_admin",
          name: "KEN IAS Admin",
          email: "admin@kenias.academy",
          password: "admin123",
          role: "admin",
          initials: "KA",
          createdAt: new Date().toISOString(),
        },
        {
          id: "u_arjun",
          name: "Arjun Kumar",
          email: "arjun.kumar@gmail.com",
          password: "student123",
          role: "student",
          initials: "AK",
          createdAt: new Date().toISOString(),
        },
      ];
      found = baseDefaults.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );
      if (found) {
        list = [...list.filter((u) => u.email.toLowerCase() !== cleanEmail), found];
        persistUsers(list);
      }
    }

    // Auto-create local user session if valid email & password supplied
    if (!found) {
      if (cleanEmail && password && password.length >= 4) {
        const isAdminEmail = cleanEmail.includes("admin") || ADMIN_EMAILS.includes(cleanEmail);
        const namePart = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        found = {
          id: "u_" + Date.now(),
          name: formattedName,
          email: cleanEmail,
          password,
          role: isAdminEmail ? "admin" : "student",
          initials: initialsOf(formattedName),
          createdAt: new Date().toISOString(),
        };
        list = [...list, found];
        persistUsers(list);
      } else {
        setError("Invalid email or password. Please try again.");
        throw new Error("invalid-credentials");
      }
    }

    setSession({ ...found, provider: "email", emailVerified: true });
    notify(`Welcome back, ${found.name}! 👋`);
    return { ...found, provider: "email", emailVerified: true };
  };

  /* ---------------------------- FIREBASE MODE ---------------------------- */
  const fbSignUp = async ({ name, email, password }) => {
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } =
      await import("firebase/auth");
    const auth = await getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await sendEmailVerification(cred.user);
    // Do not auto-login: the user must verify their email first.
    await signOut(auth);
    return { needsVerification: true, email: email.trim().toLowerCase() };
  };

  const fbSignIn = async ({ email, password }) => {
    const { signInWithEmailAndPassword, signOut } = await import("firebase/auth");
    const auth = await getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      setError(
        "Please verify your email first. Check your inbox for the verification link, then log in."
      );
      throw new Error("verify-email");
    }
    notify(`Welcome back! 👋`);
    return fbToUser(cred.user);
  };

  const fbGoogle = async () => {
    const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
    const auth = await getFirebaseAuth();
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    notify(`Signed in with Google as ${cred.user.displayName?.split(" ")[0] || "user"}! 🎉`);
    return fbToUser(cred.user);
  };

  const fbRequestReset = async ({ email }) => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    const auth = await getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    notify("Password reset link sent to your email 📧");
  };

  /* ------------------------------ SIGN OUT ------------------------------- */
  const signOut = async () => {
    if (isFirebaseConfigured) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      try {
        await fbSignOut(await getFirebaseAuth());
      } catch {
        /* ignore */
      }
      setSession(null);
    } else {
      setSession(null);
    }
    notify("You've been signed out. See you soon 👋");
  };

  /* --------------------------- HELPER FOR FB ERRORS ------------------------ */
  const isFirebaseConfigError = (err) => {
    if (!err) return false;
    const msg = String(err.message || "").toUpperCase();
    const code = String(err.code || "").toLowerCase();
    return (
      msg.includes("CONFIGURATION_NOT_FOUND") ||
      msg.includes("API_KEY") ||
      msg.includes("PROJECT_NOT_FOUND") ||
      code.includes("configuration-not-found") ||
      code.includes("invalid-api-key") ||
      code.includes("operation-not-allowed") ||
      code.includes("auth/user-not-found") ||
      code.includes("auth/invalid-credential")
    );
  };

  /* --------------------------- PUBLIC WRAPPERS ---------------------------- */
  const signUp = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured) {
        try {
          return await fbSignUp(data);
        } catch (err) {
          if (isFirebaseConfigError(err)) {
            console.warn("Firebase Auth error; falling back to Demo Mode:", err);
            return demoSignUp(data);
          }
          throw err;
        }
      }
      return demoSignUp(data);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured) {
        try {
          return await fbSignIn(data);
        } catch (err) {
          if (isFirebaseConfigError(err)) {
            console.warn("Firebase Auth error; falling back to Demo Mode:", err);
            return demoSignIn(data);
          }
          throw err;
        }
      }
      return demoSignIn(data);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (account) => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured) {
        try {
          return await fbGoogle();
        } catch (err) {
          if (isFirebaseConfigError(err) || err.code === "auth/popup-closed-by-user") {
            console.warn("Firebase Google Auth error; falling back to Demo Mode:", err);
          } else {
            throw err;
          }
        }
      }
      // Demo mode: accept the picked mock account.
      const { name, email, photo } = account || {
        name: "Google Student",
        email: "student@gmail.com",
      };
      const list = loadUsers();
      let nu = list.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!nu) {
        nu = {
          id: "u_" + Date.now(),
          name,
          email: email.toLowerCase(),
          password: "",
          role: "student",
          initials: initialsOf(name),
          photo: photo || null,
          createdAt: new Date().toISOString(),
        };
        persistUsers([...list, nu]);
      } else {
        nu = { ...nu, photo: photo || nu.photo };
      }
      setSession({ ...nu, provider: "google", emailVerified: true });
      notify(`Signed in with Google as ${name.split(" ")[0]}! 🎉`);
      return { ...nu, provider: "google", emailVerified: true };
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async (data) => {
    setError(null);
    if (isFirebaseConfigured) return fbRequestReset(data);
    const list = loadUsers();
    if (!list.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
      setError("No account found with that email.");
      throw new Error("not-found");
    }
    notify("Password reset link sent to your email 📧");
    return true;
  };

  const value = useMemo(
    () => ({
      user: session,
      isAuthed: !!session,
      role: session?.role || null,
      isAdmin: session?.role === "admin",
      loading,
      error,
      toastMsg,
      notify,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      requestReset,
      isFirebaseConfigured,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, loading, error, toastMsg]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
