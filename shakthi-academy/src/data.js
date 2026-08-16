// Central dataset for KEN IAS Academy.
// In production these are managed via Firebase Firestore + Storage.

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const CATEGORIES = [
  // ----- UPSC (KEN IAS Primary Focus) -----
  { id: "upsc-cse", name: "UPSC Civil Services (IAS/IPS)", group: "UPSC", icon: "🏛", color: "#6D28D9", gradient: "from-violet-600 to-purple-700", materials: 0 },
  { id: "upsc-prelims", name: "UPSC Prelims General Studies", group: "UPSC", icon: "📑", color: "#7C3AED", gradient: "from-purple-600 to-indigo-600", materials: 0 },
  { id: "upsc-csat", name: "UPSC CSAT Paper II", group: "UPSC", icon: "🧮", color: "#8B5CF6", gradient: "from-indigo-500 to-violet-600", materials: 0 },

  // ----- TNPSC -----
  { id: "tnpsc-g1", name: "TNPSC Group I", group: "TNPSC", icon: "📖", color: "#059669", gradient: "from-emerald-600 to-teal-600", materials: 0 },
  { id: "tnpsc-g2", name: "TNPSC Group II / IIA", group: "TNPSC", icon: "📖", color: "#10B981", gradient: "from-emerald-500 to-teal-500", materials: 0 },
  { id: "tnpsc-g4", name: "TNPSC Group IV & VAO", group: "TNPSC", icon: "📖", color: "#10B981", gradient: "from-emerald-500 to-teal-500", materials: 0 },

  // ----- Banking (IBPS / SBI) -----
  { id: "sbi-po", name: "SBI PO / Clerk", group: "Banking", icon: "🏦", color: "#0284C7", gradient: "from-sky-600 to-blue-600", materials: 0 },
  { id: "ibps-po", name: "IBPS PO / Clerk", group: "Banking", icon: "🏦", color: "#0EA5E9", gradient: "from-sky-500 to-cyan-500", materials: 0 },

  // ----- SSC & Railway -----
  { id: "ssc-cgl", name: "SSC CGL / CHSL", group: "SSC & Railway", icon: "🏛", color: "#EF4444", gradient: "from-rose-500 to-red-500", materials: 0 },
  { id: "railway-ntpc", name: "Railway NTPC & Group D", group: "SSC & Railway", icon: "🚆", color: "#F59E0B", gradient: "from-amber-500 to-orange-500", materials: 0 },

  // ----- General Subjects -----
  { id: "aptitude", name: "Quantitative Aptitude", group: "Common Subjects", icon: "🧮", color: "#8B5CF6", gradient: "from-violet-500 to-purple-500", materials: 0 },
  { id: "reasoning", name: "Logical Reasoning", group: "Common Subjects", icon: "🧠", color: "#EC4899", gradient: "from-pink-500 to-fuchsia-500", materials: 0 },
  { id: "english", name: "General English", group: "Common Subjects", icon: "🇬🇧", color: "#14B8A6", gradient: "from-teal-500 to-emerald-500", materials: 0 },
  { id: "current-affairs", name: "Current Affairs & GK", group: "Common Subjects", icon: "📰", color: "#6366F1", gradient: "from-indigo-500 to-blue-500", materials: 0 },
];

// Ordered exam groups for the category grid.
export const CATEGORY_GROUPS = ["UPSC", "TNPSC", "Banking", "SSC & Railway", "Common Subjects"];

// Fresh start — zero initial uploads. Admin uploads will populate here.
export const UPLOADS = [];

// Pre-loaded exam mock tests with authentic past 5-year PYQ questions
export const MOCK_TESTS = [
  {
    id: "test_upsc_1",
    title: "UPSC Prelims GS Paper I Mock (2020-2024 Trends)",
    category: "UPSC Civil Services (IAS/IPS)",
    color: "#6D28D9",
    questions: 4,
    time: "20 min",
    durationMinutes: 20,
    taken: 890,
    questionsList: [
      {
        id: "uq1",
        section: "Indian Economy",
        question: "With reference to the Indian economy, consider the following statements regarding 'Repo Rate':\n1. It is the rate at which RBI lends money to commercial banks against government securities.\n2. An increase in Repo Rate helps in curbing inflation.\nWhich of the statements given above is/are correct?",
        options: ["1 only", "2 only", "Both 1 and 2", "Neither 1 nor 2"],
        correctAnswerIndex: 2,
        explanation: "Both statements are correct. Repo rate increases cost of borrowing to restrain inflation.",
      },
      {
        id: "uq2",
        section: "Polity & Constitution",
        question: "The 'Preamble' to the Constitution of India is:",
        options: [
          "A part of the Constitution but has no legal effect independently of other parts.",
          "Not a part of the Constitution and has no legal effect at all.",
          "A part of the Constitution and has the same legal effect as any other part.",
          "Not a part of the Constitution but can be amended separately.",
        ],
        correctAnswerIndex: 0,
        explanation: "Preamble is an integral part of the Constitution but non-justiciable independently.",
      },
      {
        id: "uq3",
        section: "CSAT",
        question: "A person travels 12 km due North, then 5 km due East, and finally 12 km due South. How far is he from his starting point?",
        options: ["5 km", "12 km", "17 km", "29 km"],
        correctAnswerIndex: 0,
        explanation: "North and South movements cancel. The distance from origin is 5 km East.",
      },
      {
        id: "uq4",
        section: "Ancient History",
        question: "Which one of the following Indus Valley Civilisation sites is known for its unique water management system and reservoir architecture?",
        options: ["Lothal", "Dholavira", "Kalibangan", "Rakhigarhi"],
        correctAnswerIndex: 1,
        explanation: "Dholavira in Gujarat is famous for its sophisticated water reservoirs.",
      },
    ],
  },
];

// Initial mock test history
export const MOCK_TESTS_HISTORY = [
  { title: "Banking Prelims Speed Mock #1", score: "8.75 / 10", percent: 88, date: "Yesterday", timeSpentSeconds: 1120 },
  { title: "UPSC CSAT Aptitude Quiz", score: "7 / 10", percent: 70, date: "3 days ago", timeSpentSeconds: 840 },
];

// Fresh start — zero notifications.
export const NOTIFICATIONS = [];

// Fresh start — zero course progress.
export const COURSE_PROGRESS = [];

export const USER = {
  name: "New Student",
  role: "Student",
  email: "student@kenias.academy",
  initials: "NS",
  enrolled: 0,
  videosWatched: 0,
  testsCompleted: 0,
  streak: 0,
};

export const ADMIN_ANALYTICS = [
  { label: "Total Students", value: "0", delta: "New platform", up: true, color: "#6D28D9", icon: "👥" },
  { label: "Materials Uploaded", value: "0", delta: "Ready for uploads", up: true, color: "#0EA5E9", icon: "📄" },
  { label: "Videos Published", value: "0", delta: "Ready for videos", up: true, color: "#EC4899", icon: "🎥" },
  { label: "Mock Tests Taken", value: "0", delta: "Ready for tests", up: true, color: "#10B981", icon: "📝" },
];
