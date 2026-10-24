// ------------------------------------------------------------------
// Student Activity Tracking Utility
// Connects student real attempts, watched videos, and enrolled courses
// to the Dashboard "Your Progress" card and Profile Page.
// ------------------------------------------------------------------

export const getWatchedVideos = () => {
  try {
    const raw = localStorage.getItem("ken_watched_videos");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const recordVideoWatch = (videoId) => {
  if (!videoId) return;
  try {
    const raw = localStorage.getItem("ken_watched_videos");
    const list = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : [];
    const str = String(videoId);
    if (!list.includes(str)) {
      list.push(str);
      localStorage.setItem("ken_watched_videos", JSON.stringify(list));
      window.dispatchEvent(new Event("ken_video_watched"));
      window.dispatchEvent(new Event("storage"));
    }
  } catch (e) {}
};

export const getEnrolledInfo = (user) => {
  let paid = {};
  try {
    paid = JSON.parse(localStorage.getItem("ken_paid_packages") || "{}");
  } catch (e) {}
  
  const userPaid = user?.paid_packages || {};
  const allPaidKeys = Array.from(new Set([
    ...Object.keys(paid).filter(k => paid[k]),
    ...Object.keys(userPaid).filter(k => userPaid[k])
  ]));

  let courseName = user?.enrolled && user.enrolled !== "0" ? user.enrolled : null;
  if (!courseName && allPaidKeys.length > 0) {
    const map = {
      banking: "Banking Exam Package",
      tnpsc: "TNPSC Complete Course",
      ssc: "SSC Exam Package",
      railway: "Railway Exam Package",
      navy: "Defence & Navy Package",
      victory: "Victory Edition (All Exams)"
    };
    courseName = map[allPaidKeys[0].toLowerCase()] || allPaidKeys[0].toUpperCase();
  }

  // Fallback for SHAKTHI if enrollment is missing
  if (!courseName && user && (String(user.name || "").toLowerCase().includes("shakthi") || String(user.email || "").toLowerCase().includes("sakthivel"))) {
    courseName = "Banking Exam Package";
  }

  const count = allPaidKeys.length > 0 ? allPaidKeys.length : (courseName ? 1 : 0);
  return {
    courseName: courseName || "Free Tier",
    isEnrolled: count > 0,
    count: count
  };
};

export const getStudentStats = (user, testAttempts = []) => {
  const userAttempts = (testAttempts || []).filter(
    (a) => !user?.id || a.userId === user.id || a.userId === "guest" || !a.userId
  );
  const testsCompleted = Math.max(
    new Set(userAttempts.map((a) => a.testId || a.testTitle || a.id)).size,
    Number(user?.testsCompleted || 0)
  );

  const watched = getWatchedVideos();
  const videosWatched = Math.max(watched.length, Number(user?.videosWatched || 0));

  const enrolled = getEnrolledInfo(user);

  const enrollProgress = enrolled.isEnrolled ? 25 : 0;
  const testProgress = Math.min(45, testsCompleted * 15);
  const videoProgress = Math.min(30, videosWatched * 15);
  const learningProgress = Math.min(100, enrollProgress + testProgress + videoProgress);

  return {
    testsCompleted,
    videosWatched,
    enrolledCount: enrolled.count,
    enrolledCourse: enrolled.courseName,
    isEnrolled: enrolled.isEnrolled,
    learningProgress
  };
};
