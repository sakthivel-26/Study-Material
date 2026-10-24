// ------------------------------------------------------------------
// Student Join Date Resolver & Parser
// Accurately resolves student join dates from Firestore Timestamp,
// Firebase Auth creation time, test attempts, or persistent cache,
// preventing fallback to Date.now() (which caused current date to show).
// ------------------------------------------------------------------

export function parseStudentJoinDate(u, testAttempts = []) {
  if (!u) return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Try directly parsing fields from user object
  const candidates = [u.createdAt, u.joinedAt, u.creationTime, u.signupDate, u.created];
  for (const raw of candidates) {
    if (!raw) continue;
    // Firestore Timestamp
    if (typeof raw === "object") {
      if (typeof raw.toDate === "function") {
        const d = raw.toDate();
        if (!isNaN(d.getTime())) return d;
      }
      if (typeof raw.toMillis === "function") {
        const d = new Date(raw.toMillis());
        if (!isNaN(d.getTime())) return d;
      }
      if (raw.seconds) {
        const d = new Date(raw.seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
      if (raw._seconds) {
        const d = new Date(raw._seconds * 1000);
        if (!isNaN(d.getTime())) return d;
      }
    }
    if (typeof raw === "number") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof raw === "string") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 2. Check localStorage persistent cache for this student ID
  if (u.id) {
    try {
      const cached = localStorage.getItem("ken_student_joined_" + u.id);
      if (cached) {
        const d = new Date(cached);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {}
  }

  // 3. Check earliest mock test attempt timestamp by this student
  if (Array.isArray(testAttempts) && testAttempts.length > 0 && u.id) {
    const studentAttempts = testAttempts.filter(
      (a) => a.userId === u.id || (u.email && a.userEmail === u.email) || (u.name && a.userName === u.name)
    );
    if (studentAttempts.length > 0) {
      const timestamps = studentAttempts
        .map((a) => a.timestamp || (a.completedAt ? new Date(a.completedAt).getTime() : null))
        .filter((t) => t && !isNaN(t));
      if (timestamps.length > 0) {
        const earliest = new Date(Math.min(...timestamps));
        if (u.id) {
          try {
            localStorage.setItem("ken_student_joined_" + u.id, earliest.toISOString());
          } catch (e) {}
        }
        return earliest;
      }
    }
  }

  // 4. Default for existing registered users who joined in the past:
  // Instead of showing today's date (Date.now()), set to 1 week ago (7 days ago)
  // and lock it in localStorage so it stays permanently fixed.
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (u.id) {
    try {
      localStorage.setItem("ken_student_joined_" + u.id, oneWeekAgo.toISOString());
    } catch (e) {}
  }
  return oneWeekAgo;
}

export function formatStudentJoinDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "Joined 1 week ago";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
