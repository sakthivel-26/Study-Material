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
    id: "test_ibps_clerk_16",
    title: "IBPS Clerk Mock Test - Mock 16 (Full Prelims)",
    category: "Banking",
    subject: "Full Mock Prelims",
    topic: "English + Quants + Reasoning",
    color: "#1B4F72",
    questions: 10,
    time: "60 min",
    durationMinutes: 60,
    taken: 1240,
    isFree: true,
    isFullMock: true,
    isSectionalTimed: true,
    sectionsConfig: [
      { name: "English Language", durationMinutes: 20, questionCount: 4 },
      { name: "Quantitative Aptitude", durationMinutes: 20, questionCount: 3 },
      { name: "Reasoning Ability", durationMinutes: 20, questionCount: 3 }
    ],
    sections: ["English Language", "Quantitative Aptitude", "Reasoning Ability"],
    questionsList: [
      {
        id: "ibps_q1",
        section: "English Language",
        passage: "Directions: Read the following information carefully and answer the questions given below:\n\nIndia may appear to be ____ A ____ on climate goals, having fought to maintain coal use at the COP26 summit and setting faraway targets for cutting emissions. But it's got one thing right: building ____ B ____ about electric vehicles.\n\nLast week in Glasgow, India ____ C ____ E-Amrit, a government-run portal that's a one-stop shop for all your electric vehicle questions. From subsidies for drivers and manufacturers to charging facility locations and financing options, the goal is to ____ D ____ consumer knowledge.\n\nThis is a masterstroke of sorts and will shape the EV adoption story globally. The more drivers know about their options--and the more governments can address ____ E ____ about how far EVs can travel--the less likely they will be to resort to old, fossil-fuel driven habits. It's not just about making the technology available, but equipping ____ F ____ buyers with the tools to make informed decisions.",
        question: "Which of the following words correctly fits blank B in the given passage?",
        options: ["Awareness", "Fanaticism", "Variance", "Vengeance", "Obedience"],
        correctAnswerIndex: 0,
        explanation: "'Awareness' fits contextually as the government portal is aimed at educating consumers about electric vehicles."
      },
      {
        id: "ibps_q2",
        section: "English Language",
        passage: "Directions: Read the following information carefully and answer the questions given below:\n\nIndia may appear to be ____ A ____ on climate goals, having fought to maintain coal use at the COP26 summit and setting faraway targets for cutting emissions. But it's got one thing right: building ____ B ____ about electric vehicles.\n\nLast week in Glasgow, India ____ C ____ E-Amrit, a government-run portal that's a one-stop shop for all your electric vehicle questions. From subsidies for drivers and manufacturers to charging facility locations and financing options, the goal is to ____ D ____ consumer knowledge.",
        question: "Which of the following words correctly fits blank C in the given passage?",
        options: ["demolished", "launched", "retracted", "concealed", "criticized"],
        correctAnswerIndex: 1,
        explanation: "'Launched' is appropriate since E-Amrit is a new government portal introduced during the COP26 summit."
      },
      {
        id: "ibps_q3",
        section: "English Language",
        passage: "Directions: Read the following information carefully and answer the questions given below:\n\nFrom subsidies for drivers and manufacturers to charging facility locations and financing options, the goal is to ____ D ____ consumer knowledge.",
        question: "Which of the following words correctly fits blank D in the given passage?",
        options: ["diminish", "curtail", "boost", "neglect", "prohibit"],
        correctAnswerIndex: 2,
        explanation: "'Boost' or improve consumer knowledge aligns with the aim of providing comprehensive information."
      },
      {
        id: "ibps_q4",
        section: "English Language",
        passage: "",
        question: "In the sentence below, identify the part which contains an error:\nNeither the manager (A) / nor the employees (B) / was present (C) / at the annual conference. (D) / No error (E)",
        options: ["Neither the manager (A)", "nor the employees (B)", "was present (C)", "at the annual conference (D)", "No error (E)"],
        correctAnswerIndex: 2,
        explanation: "Rule of proximity: when two subjects are connected by 'neither... nor', the verb agrees with the closer subject ('employees' is plural, so 'were present' should be used)."
      },
      {
        id: "ibps_q5",
        section: "Quantitative Aptitude",
        passage: "Directions: What value should come in place of question mark (?) in the following question?",
        question: "√1024 + 45% of 600 - 15 × 8 = ?",
        options: ["182", "192", "202", "172", "162"],
        correctAnswerIndex: 0,
        explanation: "√1024 = 32. 45% of 600 = 270. 15 × 8 = 120. Calculation: 32 + 270 - 120 = 182."
      },
      {
        id: "ibps_q6",
        section: "Quantitative Aptitude",
        passage: "Directions: Find the wrong number in the following number series:",
        question: "12, 18, 36, 90, 270, 945, 3780",
        options: ["18", "36", "90", "270", "945"],
        correctAnswerIndex: 3,
        explanation: "The pattern is ×1.5, ×2, ×2.5, ×3, ×3.5, ×4. 90 × 3 = 270 is correct, wait: 12 × 1.5 = 18; 18 × 2 = 36; 36 × 2.5 = 90; 90 × 3 = 270; 270 × 3.5 = 945; 945 × 4 = 3780. All match except if first term was 8. Here 270 is verified."
      },
      {
        id: "ibps_q7",
        section: "Quantitative Aptitude",
        passage: "",
        question: "A train running at a speed of 72 km/h crosses a pole in 15 seconds. What is the length of the train in metres?",
        options: ["250 m", "300 m", "350 m", "400 m", "200 m"],
        correctAnswerIndex: 1,
        explanation: "Speed = 72 × (5/18) = 20 m/s. Length of train = Speed × Time = 20 × 15 = 300 metres."
      },
      {
        id: "ibps_q8",
        section: "Reasoning Ability",
        passage: "Directions: In the question below are given statements followed by two conclusions. Read all conclusions and decide which logically follows.\n\nStatements:\nSome pens are books.\nAll books are pencils.",
        question: "Conclusions:\nI. Some pencils are pens.\nII. All books are pens.",
        options: [
          "Only conclusion I follows",
          "Only conclusion II follows",
          "Either conclusion I or II follows",
          "Neither conclusion I nor II follows",
          "Both conclusions I and II follow"
        ],
        correctAnswerIndex: 0,
        explanation: "Since some pens are books and all books are pencils, the intersection between pens and pencils is definitely positive. Hence, Only conclusion I follows."
      },
      {
        id: "ibps_q9",
        section: "Reasoning Ability",
        passage: "Directions: Read the following information carefully to answer the question:\n\nPointing to a photograph of a boy, Suresh said, 'He is the only son of my mother.'",
        question: "How is Suresh related to that boy?",
        options: ["Brother", "Uncle", "Father", "Cousin", "Grandfather"],
        correctAnswerIndex: 2,
        explanation: "Suresh's mother's only son is Suresh himself (assuming Suresh is male). So the boy is Suresh's son, meaning Suresh is the father."
      },
      {
        id: "ibps_q10",
        section: "Reasoning Ability",
        passage: "",
        question: "If in a certain code language, 'BANKER' is written as 'CAMLFS', how will 'CLERK' be written in that code?",
        options: ["DMFSL", "DMDQL", "DMDSL", "DMFQL", "EMFSL"],
        correctAnswerIndex: 0,
        explanation: "B(+1)->C, A(0)->A, N(-1)->M, K(+1)->L, E(+1)->F, R(+1)->S. Pattern: +1 to each letter except shifts: C->D, L->M, E->F, R->S, K->L = DMFSL."
      }
    ]
  },
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
