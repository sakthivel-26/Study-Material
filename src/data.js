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
  // ----- TNPSC -----

  // ----- TNPSC -----
  { id: "tnpsc-g1", name: "TNPSC Group I", group: "TNPSC", icon: "📖", color: "#059669", gradient: "from-emerald-600 to-teal-600", materials: 0 },
  { id: "tnpsc-g2", name: "TNPSC Group II / IIA", group: "TNPSC", icon: "📖", color: "#10B981", gradient: "from-emerald-500 to-teal-500", materials: 0 },
  { id: "tnpsc-g4", name: "TNPSC Group IV & VAO", group: "TNPSC", icon: "📖", color: "#10B981", gradient: "from-emerald-500 to-teal-500", materials: 0 },

  // ----- Banking (IBPS / SBI) -----
  { id: "sbi-po", name: "SBI PO / Clerk", group: "Banking", icon: "🏦", color: "#0284C7", gradient: "from-sky-600 to-blue-600", materials: 0 },
  { id: "ibps-po", name: "IBPS PO / Clerk", group: "Banking", icon: "🏦", color: "#0EA5E9", gradient: "from-sky-500 to-cyan-500", materials: 0 },

  // ----- SSC & Railway -----
  { id: "ssc-cgl", name: "SSC CGL / CHSL", group: "SSC", icon: "🏛", color: "#EF4444", gradient: "from-rose-500 to-red-500", materials: 0 },
  { id: "railway-ntpc", name: "Railway NTPC & Group D", group: "Railway", icon: "🚆", color: "#F59E0B", gradient: "from-amber-500 to-orange-500", materials: 0 },

  // ----- Defence -----
  { id: "defence-nda", name: "Defence & NDA", group: "Defence", icon: "🎖", color: "#4B5563", gradient: "from-gray-600 to-gray-800", materials: 0 },

  // ----- General Subjects -----
  { id: "aptitude", name: "Quantitative Aptitude", group: "Common Subjects", icon: "🧮", color: "#8B5CF6", gradient: "from-violet-500 to-purple-500", materials: 0 },
  { id: "reasoning", name: "Logical Reasoning", group: "Common Subjects", icon: "🧠", color: "#EC4899", gradient: "from-pink-500 to-fuchsia-500", materials: 0 },
  { id: "english", name: "General English", group: "Common Subjects", icon: "🇬🇧", color: "#14B8A6", gradient: "from-teal-500 to-emerald-500", materials: 0 },
  { id: "current-affairs", name: "Current Affairs & GK", group: "Common Subjects", icon: "📰", color: "#6366F1", gradient: "from-indigo-500 to-blue-500", materials: 0 },
];

// Ordered exam groups for the category grid.
export const CATEGORY_GROUPS = ["Banking", "SSC", "Railway", "TNPSC", "Defence", "Common Subjects"];

export const BANK_TOPICS = {
  "Quant": [
    "Data Interpretation",
    "Simplification",
    "Algebra (includes word problems like ages)",
    "Number System",
    "Series and sequence",
    "Distance time",
    "Average mixture",
    "Profit loss",
    "Mensuration",
    "Mathematical Inequality",
    "Compound interest",
    "problem on ages",
    "Time and work",
    "Percentages",
    "Ratio Proportion"
  ],
  "Reasoning": [
    "Order and ranking",
    "Input Output",
    "Pattern",
    "Syllogism",
    "Direction and distance",
    "Seating arrangements",
    "Verbal Reasoning",
    "Scheduling",
    "Blood relation",
    "Data sufficiency - Reasoning",
    "General LR problem",
    "Coding decoding"
  ],
  "Verbal": [
    "RC",
    "Parajumble",
    "Vocab",
    "Cloze: complex",
    "Grammar"
  ],
  "General Awareness": [
    "GK + Current Affairs + Banking Awareness"
  ]
};

export const TNPSC_TOPICS = {
  "General Tamil / General English": [
    "Grammar",
    "Literature",
    "Author profiles"
  ],
  "Unit 1: General Science": [
    "Physics", "Chemistry", "Botany", "Zoology", "Health and Nutrition"
  ],
  "Unit 2: Current Affairs": [
    "State, national, and international events",
    "Science and tech updates",
    "Awards and sports"
  ],
  "Unit 3: Geography": [
    "India and Tamil Nadu location",
    "Physical features, monsoon, weather",
    "Water resources, soil, minerals, agriculture"
  ],
  "Unit 4: History and Culture": [
    "Indus Valley Civilization, Gupta",
    "Delhi Sultanate, Mughals, Marathas",
    "South Indian history"
  ],
  "Unit 5: Indian Polity": [
    "Constitution, Preamble",
    "Fundamental rights and duties",
    "Parliament, judiciary",
    "Local governments and panchayatraj"
  ],
  "Unit 6: Indian Economy": [
    "Five-year plans, planning commission",
    "Land reforms, agriculture, industry",
    "Fiscal/monetary policy"
  ],
  "Unit 7: Indian National Movement": [
    "National renaissance, early uprising",
    "Freedom struggle",
    "Leaders like Gandhi, Nehru, and Subhash Chandra Bose"
  ],
  "Unit 8: History, Culture, Heritage of TN": [
    "Tamil society, Sangam literature, Thirukkural",
    "Justice party, self-respect movement",
    "Leaders like Periyar and Anna"
  ],
  "Unit 9: Development Administration in TN": [
    "Human development indices, social justice",
    "Education, health systems",
    "State welfare schemes"
  ],
  "Unit 10: Aptitude and Mental Ability": [
    "Simplification, percentage",
    "HCF/LCM, ratio/proportion",
    "Simple/compound interest",
    "Area, volume",
    "Logical reasoning"
  ]
};

export const SSC_TOPICS = {
  "Quantitative Aptitude / Mathematics": [
    "Number Systems & Simplification (BODMAS)",
    "Percentage, Ratio & Proportion",
    "Profit, Loss and Discount",
    "Simple & Compound Interest",
    "Time, Speed and Distance / Time and Work",
    "Algebra, Geometry & Trigonometry (Advanced Math for SSC)"
  ],
  "General Intelligence and Reasoning": [
    "Analogies, Similarities & Differences",
    "Coding and Decoding",
    "Alphabetical and Number Series",
    "Syllogism & Logical Venn Diagrams",
    "Non-Verbal Reasoning (Paper Folding, Mirror Images)",
    "Blood Relations & Direction Sense"
  ],
  "General Awareness & General Science": [
    "Indian History, Polity, and Geography",
    "Static GK (National parks, dances, census, awards)",
    "Current Affairs (National and international events)",
    "General Science (Physics, Chemistry, and Life Sciences up to 10th standard for Railways)"
  ],
  "English Comprehension (Mainly SSC)": [
    "Spotting Errors & Sentence Improvement",
    "Synonyms, Antonyms & Idioms",
    "Cloze Test & Reading Comprehension",
    "Active/Passive Voice and Direct/Indirect Speech"
  ]
};

export const DEFENCE_TOPICS = {
  "Mathematics": [
    "Algebra: Sets, relations, functions, complex numbers",
    "Trigonometry: Angles, identities, height and distance",
    "Matrices and Determinants: Operations, adjoint, inverse",
    "Calculus: Limits, continuity, differentiation, integration",
    "Statistics and Probability: Frequency distributions, mean",
    "Vector Algebra & Coordinate Geometry: 2D and 3D geometry"
  ],
  "General Ability Test (GAT) - English & Science": [
    "English (Part A): Grammar, vocabulary, spotting errors",
    "Physics (Part B): Motion, force, gravitation, work",
    "Chemistry (Part B): Atomic structure, elements, compounds",
    "General Science & Biology (Part B): Living and non-living things"
  ],
  "General Ability Test (GAT) - GK & History": [
    "History & Freedom Movement (Part B): Ancient, medieval, modern",
    "Geography (Part B): Earth's crust, physical and Indian geography",
    "Current Affairs (Part B): National and international events, defense"
  ]
};

// Fresh start — zero initial uploads. Admin uploads will populate here.
export const UPLOADS = [];

// Pre-loaded exam mock tests with authentic past 5-year PYQ questions
export const MOCK_TESTS = [
  {
    id: "test_sbi_1",
    title: "SBI PO Prelims Number Series Practice",
    category: "SBI PO / Clerk",
    subject: "Logical Reasoning",
    topic: "Number Series",
    color: "#0284C7",
    questions: 4,
    time: "10 min",
    durationMinutes: 10,
    taken: 450,
    isFree: true,
    questionsList: [
      {
        id: "q1",
        section: "Logical Reasoning",
        question: "Find the next number in the series: 2, 6, 12, 20, 30, ?",
        options: ["40", "42", "44", "48"],
        correctAnswerIndex: 1,
        explanation: "The differences are 4, 6, 8, 10. The next difference is 12. So, 30 + 12 = 42.",
      },
      {
        id: "q2",
        section: "Logical Reasoning",
        question: "Find the next number in the series: 5, 11, 23, 47, ?",
        options: ["95", "90", "96", "94"],
        correctAnswerIndex: 0,
        explanation: "Each number is multiplied by 2 and 1 is added. So, 47 * 2 + 1 = 95.",
      },
      {
        id: "q3",
        section: "Logical Reasoning",
        question: "Find the missing number: 1, 4, 9, 16, 25, ?",
        options: ["36", "49", "64", "81"],
        correctAnswerIndex: 0,
        explanation: "These are squares of consecutive integers: 1^2, 2^2, 3^2, 4^2, 5^2. The next is 6^2 = 36.",
      },
      {
        id: "q4",
        section: "Logical Reasoning",
        question: "Find the missing number: 3, 9, 27, 81, ?",
        options: ["243", "162", "324", "100"],
        correctAnswerIndex: 0,
        explanation: "Each number is multiplied by 3. 81 * 3 = 243.",
      }
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
  { label: "Total Students", value: "0", delta: "New platform", up: true, color: "#1B4F72", icon: "👥" },
  { label: "Materials Uploaded", value: "0", delta: "Ready for uploads", up: true, color: "#0EA5E9", icon: "📄" },
  { label: "Videos Published", value: "0", delta: "Ready for videos", up: true, color: "#EC4899", icon: "🎥" },
  { label: "Mock Tests Taken", value: "0", delta: "Ready for tests", up: true, color: "#10B981", icon: "📝" },
];
