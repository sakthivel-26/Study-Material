// Centralized sorting utility to ensure most recently uploaded mock tests are always at the top.

export function getTestTimestamp(t) {
  if (!t) return 0;
  
  // 1. Check createdAt (Firestore Timestamp, ISO String, or epoch number)
  if (t.createdAt) {
    if (typeof t.createdAt?.toMillis === "function") return t.createdAt.toMillis();
    if (typeof t.createdAt?.seconds === "number") return t.createdAt.seconds * 1000;
    if (typeof t.createdAt === "number") return t.createdAt;
    const ms = new Date(t.createdAt).getTime();
    if (!isNaN(ms) && ms > 0) return ms;
  }

  // 2. Check uploadedAt / timestamp / date
  if (t.uploadedAt) {
    if (typeof t.uploadedAt === "number") return t.uploadedAt;
    const ms = new Date(t.uploadedAt).getTime();
    if (!isNaN(ms) && ms > 0) return ms;
  }
  if (t.timestamp) {
    if (typeof t.timestamp === "number") return t.timestamp;
    const ms = new Date(t.timestamp).getTime();
    if (!isNaN(ms) && ms > 0) return ms;
  }

  // 3. Check for embedded timestamp in test ID (e.g., mock_manual_1729865608723, 1729865608723, test_17298...)
  if (t.id) {
    const match = String(t.id).match(/\d{10,13}/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > 1600000000000) return num;
    }
  }

  return 0;
}

export function sortTestsByRecent(tests = []) {
  if (!Array.isArray(tests)) return [];
  return [...tests].sort((a, b) => {
    const timeB = getTestTimestamp(b);
    const timeA = getTestTimestamp(a);
    if (timeB !== timeA) {
      return timeB - timeA; // Descending: newest first
    }
    // Secondary fallback: compare ID as string descending
    return String(b?.id || "").localeCompare(String(a?.id || ""));
  });
}
