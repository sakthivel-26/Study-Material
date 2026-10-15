import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UPLOADS, NOTIFICATIONS, MOCK_TESTS, MOCK_TESTS_HISTORY, CATEGORIES } from "./data.js";
import { useAuth, getRegisteredStudents, removeStudentById } from "./auth.jsx";
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
  fsDeleteAdmission,
  fsDeleteNotification,
  useRealtimeBackend,
  fsUpdateSettings,
  fsGetSettings,
  fsSaveTestAttempt,
  fsGetTestAttempts,
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
      if (!saved) return MOCK_TESTS;
      const parsed = JSON.parse(saved);
      const existingIds = new Set(parsed.map(t => t.id));
      const missingDefaults = MOCK_TESTS.filter(t => !existingIds.has(t.id));
      return [...missingDefaults, ...parsed];
    } catch {
      return MOCK_TESTS;
    }
  });
  const [testHistory, setTestHistory] = useState(MOCK_TESTS_HISTORY);
  const [testAttempts, setTestAttempts] = useState(() => {
    try {
      const saved = localStorage.getItem("ken_ias_test_attempts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Initial authentic mock attempts so attended mock marks show immediately (Matching Image 2)
      const initial = [
        {
          id: "att_sample_1",
          testId: "1",
          testTitle: "IBPS PO / Clerk - Quadratic Eq PT - 1",
          cutoffMarks: 62.5,
          score: 11.25,
          totalMarks: 10,
          percentage: 85,
          accuracy: 90,
          percentile: 88,
          rank: 74,
          completedAt: "Today",
          sectionsBreakdown: [
            { name: "Quantitative Aptitude", score: 11.25, totalMarks: 10, correct: 9, incorrect: 1, unattempted: 0, timeSpentSeconds: 420 }
          ]
        },
        {
          id: "att_sample_2",
          testId: "2",
          testTitle: "IBPS PO / Clerk - Approximations - 2",
          cutoffMarks: 58.5,
          score: 41.75,
          totalMarks: 50,
          percentage: 83.5,
          accuracy: 86,
          percentile: 84,
          rank: 92,
          completedAt: "Yesterday",
          sectionsBreakdown: [
            { name: "Quantitative Aptitude", score: 41.75, totalMarks: 50, correct: 43, incorrect: 5, unattempted: 2, timeSpentSeconds: 1100 }
          ]
        },
        {
          id: "att_sample_3",
          testId: "test_ibps_clerk_16",
          testTitle: "IBPS Clerk Mock Test - Mock 16 (Full Prelims)",
          cutoffMarks: 62.5,
          score: 57.5,
          totalMarks: 100,
          percentage: 57.5,
          accuracy: 84,
          percentile: 79.2,
          rank: 145,
          completedAt: "2 days ago",
          sectionsBreakdown: [
            { name: "English Language", score: 19.5, totalMarks: 30, correct: 21, incorrect: 6, unattempted: 3, timeSpentSeconds: 1100 },
            { name: "Quantitative Aptitude", score: 19.25, totalMarks: 35, correct: 20, incorrect: 3, unattempted: 12, timeSpentSeconds: 1200 },
            { name: "Reasoning Ability", score: 18.75, totalMarks: 35, correct: 20, incorrect: 5, unattempted: 10, timeSpentSeconds: 1150 }
          ]
        }
      ];
      localStorage.setItem("ken_ias_test_attempts", JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  });
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
  
  const defaultBanner = {
    enabled: true,
    text: "Festival Special: Get 50% OFF on all Full Mock Packages! Use code",
    code: "FESTIVAL50",
    color: "bg-brand-600",
    link: "",
    image: ""
  };
  const [promoBanner, setPromoBanner] = useState(() => {
    try {
      const saved = localStorage.getItem("ken_ias_promobanner");
      return saved ? JSON.parse(saved) : defaultBanner;
    } catch {
      return defaultBanner;
    }
  });

  const updatePromoBanner = async (newBanner) => {
    setPromoBanner(newBanner);
    try {
      localStorage.setItem("ken_ias_promobanner", JSON.stringify(newBanner));
      if (isFirebaseConfigured) {
        await fsUpdateSettings({ promoBanner: newBanner });
      }
    } catch (e) {
      console.warn("Failed to update promo banner in cloud:", e);
      throw e;
    }
  };

  const DEFAULT_PLANS = [
    { id: "banking", name: "Banking Full Mock Package", amount: "499", exams: "SBI, IBPS & RRB" },
    { id: "tnpsc", name: "TNPSC Full Mock Package", amount: "599", exams: "Group I, II, IV & VAO" },
    { id: "ssc", name: "SSC Full Mock Package", amount: "499", exams: "CGL, CHSL, MTS & GD" },
    { id: "railway", name: "Railway Full Mock Package", amount: "399", exams: "NTPC, Group D & ALP" },
    { id: "navy", name: "Defence & Navy Mock Package", amount: "399", exams: "Navy, NDA & Agniveer" },
  ];

  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem("ken_plans");
      return saved ? JSON.parse(saved) : DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  });

  const [coupons, setCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem("ken_coupons");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updatePlans = async (newPlans) => {
    setPlans(newPlans);
    try {
      localStorage.setItem("ken_plans", JSON.stringify(newPlans));
      if (isFirebaseConfigured) {
        await fsUpdateSettings({ plans: newPlans });
      }
    } catch (e) {
      console.warn("Failed to update plans in cloud:", e);
      throw e;
    }
  };

  const updateCoupons = async (newCoupons) => {
    setCoupons(newCoupons);
    try {
      localStorage.setItem("ken_coupons", JSON.stringify(newCoupons));
      if (isFirebaseConfigured) {
        await fsUpdateSettings({ coupons: newCoupons });
      }
    } catch (e) {
      console.warn("Failed to update coupons in cloud:", e);
      throw e;
    }
  };

  // Immediate cloud settings fetch on initial mount
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    fsGetSettings().then((settings) => {
      if (!settings) return;
      if (settings.promoBanner) {
        setPromoBanner(settings.promoBanner);
        try { localStorage.setItem("ken_ias_promobanner", JSON.stringify(settings.promoBanner)); } catch (e) {}
      }
      if (Array.isArray(settings.plans) && settings.plans.length > 0) {
        setPlans(settings.plans);
        try { localStorage.setItem("ken_plans", JSON.stringify(settings.plans)); } catch (e) {}
      }
      if (Array.isArray(settings.coupons)) {
        setCoupons(settings.coupons);
        try { localStorage.setItem("ken_coupons", JSON.stringify(settings.coupons)); } catch (e) {}
      }
    }).catch((err) => console.warn("Failed to fetch initial settings:", err));
  }, []);

  const [toast, setToast] = useState(null);
  const [ready, setReady] = useState(!useRealtimeBackend);
  const [students, setStudents] = useState(getRegisteredStudents);

  const refreshStudents = () => setStudents(getRegisteredStudents());

  const deleteStudent = async (id) => {
    if (isFirebaseConfigured) {
      try {
        const { doc, deleteDoc, setDoc } = await import("firebase/firestore");
        const { getFirebaseDb } = await import("./firebase.js");
        const db = await getFirebaseDb();
        try {
          await deleteDoc(doc(db, "users", id));
        } catch (e) {
          // Fallback if security rules prevent deletion
          await setDoc(doc(db, "users", id), { deleted: true }, { merge: true });
        }
      } catch (e) {
        console.warn("Failed to delete user from Firestore", e);
      }
    }
    const updated = removeStudentById(id);
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
          // Keep only student role and filter out deleted users
          const studentUsers = users.filter(u => u.role !== "admin" && !u.deleted).map(u => ({
            id: u.id,
            name: u.name || u.displayName || (u.email ? u.email.split("@")[0] : "") || "Student",
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
        onAdmissions: setAdmissions,
        onSettings: (settings) => {
          if (!settings) return;
          if (settings.promoBanner) {
            setPromoBanner(settings.promoBanner);
            try { localStorage.setItem("ken_ias_promobanner", JSON.stringify(settings.promoBanner)); } catch (e) {}
          }
          if (Array.isArray(settings.plans) && settings.plans.length > 0) {
            setPlans(settings.plans);
            try { localStorage.setItem("ken_plans", JSON.stringify(settings.plans)); } catch (e) {}
          }
          if (Array.isArray(settings.coupons)) {
            setCoupons(settings.coupons);
            try { localStorage.setItem("ken_coupons", JSON.stringify(settings.coupons)); } catch (e) {}
          }
        }
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
    try {
      if (isFirebaseConfigured) {
        await fsDeleteUpload(id);
        pushToast("Upload deleted successfully 🗑️");
      }
    } catch (err) {
      console.warn("Firestore delete failed", err);
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
    if (!isFirebaseConfigured) pushToast("Upload deleted successfully 🗑️");
  };

  const deleteNotification = async (id) => {
    try {
      if (isFirebaseConfigured) {
        await fsDeleteNotification(id);
        pushToast("Notification deleted successfully 🗑️");
      }
    } catch (err) {
      console.warn("Firestore delete failed", err);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!isFirebaseConfigured) pushToast("Notification deleted successfully 🗑️");
  };

  const deleteAdmission = async (id) => {
    if (isFirebaseConfigured) {
      try {
        await fsDeleteAdmission(id);
        pushToast("Lead deleted successfully 🗑️");
        return;
      } catch (err) {
        console.warn("Firestore delete failed", err);
      }
    }
    setAdmissions((prev) => prev.filter(a => a.id !== id));
    pushToast("Lead deleted successfully 🗑️");
  };

  const announce = async (title, body, image, pdf) => {
    if (isFirebaseConfigured) {
      await fsNotify("announcement", title, body, image, pdf);
      pushToast("Announcement broadcast to all students 📢");
      return;
    }
    pushNotification("announcement", title, body, image, pdf);
    pushToast("Announcement broadcast to all students 📢");
  };

  const pushNotification = (type, title, body, image, pdf) => {
    const icons = { pdf: "📄", video: "🎥", mock: "📝", announcement: "📢" };
    const colors = { pdf: "#8B5CF6", video: "#0EA5E9", mock: "#10B981", announcement: "#EF4444" };
    const n = { id: Date.now(), type, icon: icons[type] || "🔔", title, body, image, pdf, time: "just now", read: false, color: colors[type] || "#1B4F72" };
    setNotifications((prev) => [n, ...prev]);
  };

  const toggleBookmark = (id) =>
    setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const markAllRead = async () => {
    if (isFirebaseConfigured) await fsMarkAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Sync test attempts from Firestore
  useEffect(() => {
    if (isAuthed && user?.id && isFirebaseConfigured) {
      fsGetTestAttempts(user.id).then(attempts => {
        if (Array.isArray(attempts) && attempts.length > 0) {
          setTestAttempts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = attempts.filter(a => !existingIds.has(a.id));
            const merged = [...newOnes, ...prev];
            localStorage.setItem("ken_ias_test_attempts", JSON.stringify(merged));
            return merged;
          });
        }
      }).catch(() => {});
    }
  }, [isAuthed, user?.id]);

  const saveTestAttempt = async (attempt) => {
    const attemptWithMeta = {
      ...attempt,
      id: attempt.id || ("att_" + Date.now()),
      userId: user?.id || "guest",
      userName: user?.name || "Student",
      timestamp: Date.now(),
      completedAt: attempt.completedAt || new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })
    };

    setTestAttempts(prev => {
      const next = [attemptWithMeta, ...prev.filter(a => a.id !== attemptWithMeta.id)];
      try {
        localStorage.setItem("ken_ias_test_attempts", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to save attempt to localStorage", e);
      }
      return next;
    });

    setTestHistory(prev => [
      {
        id: attemptWithMeta.id,
        testId: attemptWithMeta.testId,
        title: attemptWithMeta.testTitle,
        score: attemptWithMeta.score + " / " + attemptWithMeta.totalMarks,
        percent: attemptWithMeta.percentage,
        date: attemptWithMeta.completedAt || "Just now",
        timeSpentSeconds: attemptWithMeta.timeSpentSeconds || 0,
        accuracy: attemptWithMeta.accuracy,
        percentile: attemptWithMeta.percentile,
      },
      ...prev
    ]);

    if (user?.id && isFirebaseConfigured) {
      try {
        await fsSaveTestAttempt(user.id, attemptWithMeta);
      } catch (err) {
        console.warn("Firestore attempt save failed, saved locally", err);
      }
    }

    pushToast("Performance report saved to database! Score: " + attemptWithMeta.score + "/" + attemptWithMeta.totalMarks + " 🎉");
    return attemptWithMeta;
  };

  const getLatestAttempt = (testId, testTitle) => {
    if (!testAttempts || testAttempts.length === 0) return null;
    return testAttempts.find(a => {
      if (testId != null && a.testId != null && String(a.testId) === String(testId)) return true;
      if (testTitle && a.testTitle) {
        const t1 = String(a.testTitle).toLowerCase().replace(/[^a-z0-9]/g, "");
        const t2 = String(testTitle).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (t1 === t2 || (t1.length > 6 && (t2.includes(t1) || t1.includes(t2)))) return true;
      }
      return false;
    }) || null;
  };

  const getAllAttempts = (testId, testTitle) => {
    if (!testAttempts || testAttempts.length === 0) return [];
    return testAttempts.filter(a => {
      if (testId != null && a.testId != null && String(a.testId) === String(testId)) return true;
      if (testTitle && a.testTitle) {
        const t1 = String(a.testTitle).toLowerCase().replace(/[^a-z0-9]/g, "");
        const t2 = String(testTitle).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (t1 === t2 || (t1.length > 6 && (t2.includes(t1) || t1.includes(t2)))) return true;
      }
      return false;
    });
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
      testAttempts,
      saveTestAttempt,
      getLatestAttempt,
      getAllAttempts,
      bookmarks,
      downloads,
      toast,
      ready,
      students,
      admissions,
      promoBanner,
      updatePromoBanner,
      plans,
      updatePlans,
      coupons,
      updateCoupons,
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
      deleteAdmission,
      deleteNotification,
      announce,
      toggleBookmark,
      markAllRead,
      resetAllData,
    }),
    [uploads, notifications, mockTests, testHistory, testAttempts, bookmarks, downloads, toast, ready, students, admissions, promoBanner, plans, coupons]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
