# 🎓 Shakthi Academy — How It Works

A complete tour of the running app. The app is **live in your preview** at the
sandboxed URL. Below is what you'll see at every step and where each piece of
logic lives in the code.

---

## 1️⃣ You start on the Login screen (`/login`)

Because every route is protected, unauthenticated visitors are redirected here.

- **Email + password** sign in, or
- **Continue with Google** → opens a Google-style "Choose an account" picker, or
- **Forgot password** flow.

**Demo accounts (pre-seeded, also one-tap buttons on the page):**

| Role   | Email                       | Password    | Lands on        |
|--------|-----------------------------|-------------|-----------------|
| Student| `arjun.kumar@gmail.com`     | `student123`| Student dashboard |
| Admin  | `admin@shakthi.academy`     | `admin123`  | `/admin` panel  |

> **How it's guarded:** `src/components/Guards.jsx` → `PublicOnly` bounces signed-in
> users away from auth pages; `RequireAuth` redirects guests to `/login`.
> **Where it lives:** `src/auth.jsx` (session stored in `localStorage`, role-aware),
> `src/pages/AuthPage.jsx`, `src/components/GoogleAuth.jsx`.

---

## 2️⃣ Student Dashboard (`/`)

A three-column responsive layout.

**Left sidebar** — Logo, 11 nav items (Dashboard, Courses, Videos, Study Materials,
Mock Tests, Daily Practice, Notifications, Downloads, Bookmarks, Profile, Settings)
with an animated active pill + "Install PWA" card.

**Top header** — hamburger (mobile), global search, notification bell with a live
**unread badge**, and your avatar → dropdown (Profile, Downloads, Settings,
Admin Panel *only if you're an admin*, Log out).

**Hero banner** — greets you by **first name** ("Welcome Back, {name} 👋"), with an
animated SVG illustration (books / graduation cap / laptop).

**Course categories** — 8 cards (Banking, Railway, TNPSC, SSC, Aptitude, Reasoning,
English, Computer Awareness), each with an icon + material count.

**Continue Learning** — horizontal cards with animated progress bars & Resume.

**Recent Uploads** — click any item to open a **preview modal**: PDFs render an
in-app document preview; videos load an **embedded YouTube player**. Bookmark /
download from there.

**Right sidebar** — Progress widget + Notifications card.

> **Code:** `src/components/Sidebar.jsx`, `Header.jsx`, `HeroBanner.jsx`,
> `CategoryGrid.jsx`, `ContinueLearning.jsx`, `RecentUploads.jsx`,
> `MediaModal.jsx`, `RightSidebar.jsx`, `src/pages/StudentDashboard.jsx`.

---

## 3️⃣ Sign in with Google (demo)

Clicking **"Continue with Google"** opens a simulated Google account chooser with
three mock profiles. Picking one either:

- **links** an existing account if the email already exists, or
- **creates a new student account** (name/email auto-provisioned).

A generated profile avatar is used, and the name flows into the header, profile
dropdown, profile page, and admin sidebar.

> **Where it lives:** `src/components/GoogleAuth.jsx`, `signInWithGoogle()` in
> `src/auth.jsx`. In production you replace that body with Firebase
> `signInWithPopup(auth, new GoogleAuthProvider())`.

---

## 4️⃣ The Admin Panel (`/admin`)

Only accessible to an **admin** account — a student trying `/admin` gets bounced
to `/`. (Open it by logging in as admin, or via Profile → Admin Panel.)

- **Dashboard** — stat cards (students, materials, videos, mock tests), an
  engagement bar chart, quick actions, recent uploads, mock-test analytics.
- **Upload Materials** (`/admin/upload?type=pdf`) — title, category, description,
  **drag-and-drop PDF**, thumbnail, **Preview**, **Save Draft**, **Publish**.
- **Add YouTube Video** (`/admin/upload?type=video`) — paste a YouTube link; the
  embedded player is generated automatically.
- **Create Mock Test**, **Manage Students** (searchable table), **Notifications**
  (broadcast announcements), **Analytics**, **Manage Courses**.

> **Code:** `src/components/AdminLayout.jsx`, `src/pages/admin/*`.

---

## 5️⃣ The live notification flow 🔔

The admin and student views share one store (`src/store.jsx`). The moment the
admin **publishes** anything:

- A **push-style notification** is prepended to the student's notification feed.
- The header **bell badge** increments.
- A success **toast** confirms the broadcast.

> **What triggers it:**
> - Publish PDF → "📄 New PDF Uploaded"
> - Publish video → "🎥 New Video Uploaded"
> - Create mock test → "📝 New Mock Test Available"
> - Announcement → "📢 Important Announcement"
>
> **Try it:** log in as **Admin**, publish a material, then (in another tab or after
> switching back to the student session) watch the student feed update. In
> production this maps to **Firebase Cloud Messaging (FCM)** — the store's
> `addUpload` / `addMockTest` / `announce` are the exact functions you'd rewire.

---

## 🗺 Full route map

| Route                  | Access        | Page                                  |
|------------------------|---------------|---------------------------------------|
| `/login`, `/signup`, `/forgot-password` | Public | Auth screens (Google included) |
| `/`                    | Student       | Dashboard                            |
| `/courses` `/videos` `/materials` `/mock-tests` `/daily-practice` `/notifications` `/downloads` `/bookmarks` `/profile` `/settings` | Student | Section pages |
| `/admin` and `/admin/*`| Admin only    | Admin control center                  |

**Router:** `src/App.jsx` · **Guards:** `src/components/Guards.jsx`
**State:** `src/store.jsx` (content + notifications) · **Auth:** `src/auth.jsx`
**Mock data:** `src/data.js`

---

## 🔌 Where Firebase plugs in

| Concern      | Today (demo)                            | Swap to                       |
|--------------|-----------------------------------------|-------------------------------|
| Auth         | `src/auth.jsx` localStorage + mock      | Firebase Authentication       |
| Database     | `src/store.jsx` in-memory state         | Firestore `onSnapshot`        |
| Storage      | local file input                        | Firebase Storage (PDFs/images)|
| Push         | in-app toast + feed                     | Firebase Cloud Messaging      |
| Backend      | (none — all client)                     | FastAPI on Render             |
