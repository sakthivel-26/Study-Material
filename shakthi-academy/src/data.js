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
    id: "test_ibps_po_1",
    title: "IBPS PO Prelims 2024 Full Mock (Past 5-Yr PYQ Pattern)",
    category: "SBI PO / Clerk",
    color: "#0284C7",
    questions: 7,
    time: "30 min",
    durationMinutes: 30,
    taken: 1420,
    questionsList: [
      {
        id: "q1",
        section: "Quantitative Aptitude",
        question: "A train running at 72 km/h crosses a platform of length 250 m in 25 seconds. What is the length of the train?",
        options: ["200 m", "250 m", "300 m", "350 m", "150 m"],
        correctAnswerIndex: 1,
        explanation: "Speed = 72 km/h = 72 * (5/18) = 20 m/s. Total Distance = 20 * 25 = 500 m. Length of Train = 500 - 250 = 250 m.",
      },
      {
        id: "q2",
        section: "Quantitative Aptitude",
        question: "A sum of ₹12,000 earns ₹3,972 as compound interest in 2 years compounded annually. Find the rate of interest per annum.",
        options: ["12%", "15%", "18%", "20%", "10%"],
        correctAnswerIndex: 1,
        explanation: "Amount = 12000 + 3972 = ₹15,972. A = P(1 + R/100)^2 => (1 + R/100)^2 = 15972/12000 = 1.331. For 15%, 1.15^2 = 1.3225 ≈ ₹15,870. Rate = 15%.",
      },
      {
        id: "q3",
        section: "Logical Reasoning",
        question: "In a certain code language, 'PREMONITION' is written as '6853172914'. How is 'MONITOR' written in that code?",
        options: ["3172918", "3172981", "3712918", "3179218", "1372918"],
        correctAnswerIndex: 0,
        explanation: "Letter mapping: M->3, O->1, N->7, I->2, T->9, O->1, R->8. MONITOR = 3172918.",
      },
      {
        id: "q4",
        section: "English Language",
        question: "Identify the grammatically correct sentence from the options below:",
        options: [
          "Neither the principal nor the teachers was present at the meeting.",
          "Neither the principal nor the teachers were present at the meeting.",
          "Neither the principal or the teachers were present at the meeting.",
          "Neither the principal nor the teachers are present in the meeting yesterday.",
          "Neither principal nor teachers was present.",
        ],
        correctAnswerIndex: 1,
        explanation: "Verb agrees with the subject closest to it ('teachers' -> 'were').",
      },
      {
        id: "q5",
        section: "General Awareness",
        question: "Which institution regulates the Capital Markets and Stock Exchanges in India?",
        options: ["Reserve Bank of India (RBI)", "NABARD", "Securities and Exchange Board of India (SEBI)", "IRDAI", "PFRDA"],
        correctAnswerIndex: 2,
        explanation: "SEBI regulates the securities and capital markets in India.",
      },
      {
        id: "q6",
        section: "Quantitative Aptitude",
        question: "A and B can complete a piece of work in 12 days and 16 days respectively. They worked together for 4 days and then A left. In how many more days will B finish the remaining work?",
        options: ["5.33 days", "6.67 days", "7.33 days", "8 days", "4.67 days"],
        correctAnswerIndex: 1,
        explanation: "Work done in 4 days = 4 * (1/12 + 1/16) = 7/12. Remaining = 5/12. Time for B = (5/12) / (1/16) = 20/3 = 6.67 days.",
      },
      {
        id: "q7",
        section: "Logical Reasoning",
        question: "Point A is 10 m West of Point B. Point C is 6 m North of Point B. Point D is 10 m East of Point C. What is the shortest distance between Point A and Point D?",
        options: ["18.5 m", "20 m", "20.88 m", "22 m", "24 m"],
        correctAnswerIndex: 2,
        explanation: "Distance = √(20^2 + 6^2) = √436 ≈ 20.88 m.",
      },
    ],
  },
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
