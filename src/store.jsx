import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UPLOADS, NOTIFICATIONS, MOCK_TESTS, MOCK_TESTS_HISTORY, CATEGORIES } from "./data.js";
import { useAuth, getRegisteredStudents, removeStudentByEmail } from "./auth.jsx";
import { isFirebaseConfigured } from "./firebase.js";
import {
  subscribeBackend,
  fsAddUpload,
  fsAddMockTest,
  fsNotify,
  fsMarkAllRead,
  fsDeleteMockTest,
  fsUpdateMockTest,
  fsDeleteUpload,
  useRealtimeBackend,
} from "./backend.js";


// ------------------------------------------------------------------
// Global store bridging the Admin panel and Student dashboard.
// ------------------------------------------------------------------

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const { isAuthed, user } = useAuth();
  const [uploads, setUploads] = useState(() => {
    if (useRealtimeBackend) return [];
    try {
      const saved = localStorage.getItem("ken_ias_uploads");
      return saved ? JSON.parse(saved) : UPLOADS;
    } catch {
      return UPLOADS;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    if (useRealtimeBackend) return [];
    try {
      const saved = localStorage.getItem("ken_ias_notifications");
      return saved ? JSON.parse(saved) : NOTIFICATIONS;
    } catch {
      return NOTIFICATIONS;
    }
  });

  const [mockTests, setMockTests] = useState(() => {
    if (useRealtimeBackend) return [];
    try {
      const saved = localStorage.getItem("ken_ias_mocktests");
      return saved ? JSON.parse(saved) : MOCK_TESTS;
    } catch {
      return MOCK_TESTS;
    }
  });
  const [testHistory, setTestHistory] = useState(MOCK_TESTS_HISTORY);
  const [bookmarks, setBookmarks] = useState([]);
  const [downloads, setDownloads] = useState(() => {
    try {
      const saved = localStorage.getItem("ken_ias_downloads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [admissions, setAdmissions] = useState([]);

  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(!useRealtimeBackend);
  const [students, setStudents] = useState(getRegisteredStudents);

  const refreshStudents = () => setStudents(getRegisteredStudents());

  const deleteStudent = (email) => {
    const updated = removeStudentByEmail(email);
    setStudents(updated);
    pushToast("Student account removed");
  };

  // Sync registered students live across auth changes
  useEffect(() => {
    const handleUpdate = () => setStudents(getRegisteredStudents());
    window.addEventListener("shakthi_users_updated", handleUpdate);
    return () => window.removeEventListener("shakthi_users_updated", handleUpdate);
  }, []);

  // Save data to localStorage in demo mode
  useEffect(() => {
    if (!useRealtimeBackend) {
      try {
        localStorage.setItem("ken_ias_uploads", JSON.stringify(uploads));
        localStorage.setItem("ken_ias_notifications", JSON.stringify(notifications));
        localStorage.setItem("ken_ias_mocktests", JSON.stringify(mockTests));
      } catch (err) {
        console.warn("Could not save to localStorage", err);
      }
    }
  }, [uploads, notifications, mockTests]);

  // Save downloads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ken_ias_downloads", JSON.stringify(downloads));
    } catch (err) {
      console.warn("Could not save downloads to localStorage", err);
    }
  }, [downloads]);

  // Purge old legacy Storage keys on startup
  useEffect(() => {
    try {
      localStorage.removeItem("shakthi_session");
      localStorage.removeItem("shakthi_users");
    } catch {
      /* ignore */
    }
  }, []);

  // Real-time Firestore subscription (realtime mode only).
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsub = () => {};
    (async () => {
      unsub = await subscribeBackend(user, {
        onUploads: setUploads,
        onTests: setMockTests,
        onNotifications: setNotifications,
        onStudents: (users) => {
          // Keep only student role
          const studentUsers = users.filter(u => u.role !== "admin").map(u => ({
            id: u.id,
            name: u.name,
            email: u.email || "",
            phone: u.phone || "",
            access: u.paid_packages ? Object.keys(u.paid_packages) : "payment_required",
            joined: new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          }));
          setStudents(studentUsers);
        },
        onAdmissions: setAdmissions
      });
      setReady(true);
    })();
    return () => unsub();
  }, [isAuthed]);

  const pushToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const addDownloadRecord = (item) => {
    setDownloads((prev) => {
      if (prev.some((d) => d.id === item.id)) return prev;
      return [item, ...prev];
    });
    setUploads((prev) =>
      prev.map((u) => (u.id === item.id ? { ...u, downloads: (u.downloads || 0) + 1 } : u))
    );
  };

  const addUpload = async (item) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const uploadTimeString = item.date || `${formattedDate}, ${formattedTime}`;

    const payloadWithTime = {
      ...item,
      date: uploadTimeString,
      uploadTime: item.uploadTime || formattedTime,
      uploadedAt: item.uploadedAt || Date.now(),
    };

    if (isFirebaseConfigured) {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firestore write timeout")), 2500)
        );
        const full = await Promise.race([fsAddUpload(payloadWithTime), timeout]);
        fsNotify(
          item.type === "video" ? "video" : "pdf",
          item.type === "video" ? "New Video Uploaded" : "New PDF Uploaded",
          `“${item.title}” is now available in ${item.category}.`
        ).catch(() => {});
        pushToast("Published & synced to all students 🎉");
        return full;
      } catch (err) {
        console.warn("Firestore save timed out or unconfigured. Saving locally.", err);
      }
    }

    // Demo / fallback mode
    const full = { ...payloadWithTime, id: Date.now() };
    setUploads((prev) => [full, ...prev]);
    if (item.type === "video") {
      pushNotification("video", "New Video Uploaded", `“${item.title}” added to ${item.category}.`);
    } else {
      pushNotification("pdf", "New PDF Uploaded", `“${item.title}” is now available in ${item.category}.`);
    }
    pushToast("Material published & notification sent to all students 🎉");
    return full;
  };

  const addMockTest = async (test) => {
    const title = test.isFree ? "New Free Mock Test Available" : "New Mock Test Available";
    if (isFirebaseConfigured) {
      try {
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Firestore write timeout")), 2500)
        );
        const full = await Promise.race([fsAddMockTest(test), timeout]);
        fsNotify("mock", title, `“${test.title}” is live now.`).catch(() => {});
        pushToast("Mock test created & students notified 📝");
        return full;
      } catch (err) {
        console.warn("Firestore save timed out or unconfigured. Saving locally.", err);
      }
    }
    const full = { ...test, id: test.id || Date.now() };
    setMockTests((prev) => [full, ...prev]);
    pushNotification("mock", title, `“${test.title}” is live now.`);
    pushToast("Mock test created & students notified 📝");
    return full;
  };

  const updateMockTest = async (id, updatedTest) => {
    if (isFirebaseConfigured) {
      try {
        await fsUpdateMockTest(id, updatedTest);
      } catch (err) {
        console.warn("Firestore update failed", err);
      }
    }
    setMockTests((prev) => prev.map(t => t.id === id ? { ...t, ...updatedTest } : t));
    pushToast("Mock test updated successfully ✅");
    return updatedTest;
  };

  const deleteMockTest = async (id) => {
    if (isFirebaseConfigured) {
      try {
        await fsDeleteMockTest(id);
        pushToast("Mock test deleted successfully 🗑️");
        return;
      } catch (err) {
        console.warn("Firestore delete failed", err);
      }
    }
    setMockTests((prev) => prev.filter(t => t.id !== id));
    pushToast("Mock test deleted successfully 🗑️");
  };

  const deleteUpload = async (id) => {
    if (isFirebaseConfigured) {
      try {
        await fsDeleteUpload(id);
        pushToast("Upload deleted successfully 🗑️");
        return;
      } catch (err) {
        console.warn("Firestore delete failed", err);
      }
    }
    setUploads((prev) => prev.filter(u => u.id !== id));
    pushToast("Upload deleted successfully 🗑️");
  };

  const announce = async (title, body) => {
    if (isFirebaseConfigured) {
      await fsNotify("announcement", title, body);
      pushToast("Announcement broadcast to all students 📢");
      return;
    }
    pushNotification("announcement", title, body);
    pushToast("Announcement broadcast to all students 📢");
  };

  const pushNotification = (type, title, body) => {
    const icons = { pdf: "📄", video: "🎥", mock: "📝", announcement: "📢" };
    const colors = { pdf: "#8B5CF6", video: "#0EA5E9", mock: "#10B981", announcement: "#EF4444" };
    const n = { id: Date.now(), type, icon: icons[type] || "🔔", title, body, time: "just now", read: false, color: colors[type] || "#1B4F72" };
    setNotifications((prev) => [n, ...prev]);
  };

  const toggleBookmark = (id) =>
    setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const markAllRead = async () => {
    if (isFirebaseConfigured) await fsMarkAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetAllData = () => {
    setUploads(useRealtimeBackend ? [] : UPLOADS);
    setNotifications(useRealtimeBackend ? [] : NOTIFICATIONS);
    setMockTests(useRealtimeBackend ? [] : MOCK_TESTS);
    setTestHistory(MOCK_TESTS_HISTORY);
    setBookmarks([]);
    setDownloads([]);
    try {
      localStorage.removeItem("ken_ias_uploads");
      localStorage.removeItem("ken_ias_downloads");
    } catch {
      /* ignore */
    }
    pushToast("All data has been reset ✓");
  };

  const validNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.type === "mock") {
        const match = n.body.match(/“(.+?)”/);
        if (match) {
          const title = match[1];
          return mockTests.some(m => m.title === title);
        }
      }
      return true;
    });
  }, [notifications, mockTests]);

  const value = useMemo(
    () => ({
      uploads,
      notifications: validNotifications,
      mockTests,
      testHistory,
      bookmarks,
      downloads,
      toast,
      ready,
      students,
      admissions,
      deleteStudent,
      refreshStudents,
      addDownloadRecord,
      pushToast,
      pushNotification,
      addUpload,
      addMockTest,
      updateMockTest,
      deleteMockTest,
      deleteUpload,
      announce,
      toggleBookmark,
      markAllRead,
      resetAllData,
    }),
    [uploads, notifications, mockTests, testHistory, bookmarks, downloads, toast, ready, students, admissions]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
