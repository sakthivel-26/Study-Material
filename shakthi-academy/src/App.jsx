import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import { RequireAuth, RequireAdmin, PublicOnly } from "./components/Guards.jsx";
import { LoginPage, SignupPage, ForgotPasswordPage } from "./pages/AuthPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import { CoursesPage, VideosPage, MaterialsPage } from "./pages/SectionPages.jsx";
import MockTestsPage from "./pages/MockTestsPage.jsx";
import DailyPracticePage from "./pages/DailyPracticePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UploadPage from "./pages/admin/UploadPage.jsx";
import { CreateMockTestPage, ManageStudentsPage, AnnouncementsPage, AnalyticsPage, ManageCoursesPage } from "./pages/admin/AdminManagePages.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public auth screens (redirect away if signed in) */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />

      {/* Student (protected) */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/mock-tests" element={<MockTestsPage />} />
        <Route path="/daily-practice" element={<DailyPracticePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Admin (protected + admin role only) */}
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/upload" element={<UploadPage />} />
        <Route path="/admin/mock-test" element={<CreateMockTestPage />} />
        <Route path="/admin/students" element={<ManageStudentsPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/courses" element={<ManageCoursesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
