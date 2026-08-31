import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import { RequireAuth, RequireAdmin, PublicOnly } from "./components/Guards.jsx";
import { LoginPage, SignupPage, ForgotPasswordPage, MobileLoginPage } from "./pages/AuthPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import { CoursesPage, VideosPage, MaterialsPage } from "./pages/SectionPages.jsx";
import MockTestsPage from "./pages/MockTestsPage.jsx";
import FreeMocksPage from "./pages/FreeMocksPage.jsx";
import DailyPracticePage from "./pages/DailyPracticePage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import UploadPage from "./pages/admin/UploadPage.jsx";
import { CreateMockTestPage, ManageStudentsPage, AnnouncementsPage, ManageCoursesPage, PlansPage, AdmissionsPage } from "./pages/admin/AdminManagePages.jsx";
import AdminAccountPage from "./pages/admin/AdminAccountPage.jsx";
import { AdmissionModal } from "./components/AdmissionModal.jsx";

import { NotFoundPage } from "./pages/ErrorPages.jsx";

import { PrivacyPolicyPage, TermsOfServicePage, CookiePolicyPage, RefundPolicyPage, ContactSupportPage } from "./pages/LegalPages.jsx";

import { PricingPage, PaymentSuccessPage, PaymentFailedPage } from "./pages/BillingPages.jsx";

export default function App() {
  return (
    <>
      <AdmissionModal />
      <Routes>
      {/* Public auth screens (redirect away if signed in) */}
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/mobile-login" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/login" replace />} />

      {/* Student (Publicly accessible dashboard) */}
      <Route element={<Layout />}>
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/mock-tests" element={<MockTestsPage />} />
        <Route path="/free-mocks" element={<FreeMocksPage />} />
        <Route path="/daily-practice" element={<DailyPracticePage />} />
        
        {/* Billing & Payment Lifecycle */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/payment-success" element={<RequireAuth><PaymentSuccessPage /></RequireAuth>} />
        <Route path="/payment-failed" element={<RequireAuth><PaymentFailedPage /></RequireAuth>} />

        {/* Legal & Trust Pages */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="/refund" element={<RefundPolicyPage />} />
        <Route path="/contact" element={<ContactSupportPage />} />

        {/* Protected specific routes */}
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      </Route>

      {/* Admin (protected + admin role only) */}
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/upload" element={<UploadPage />} />
        <Route path="/admin/mock-test" element={<CreateMockTestPage />} />
        <Route path="/admin/free-mock-test" element={<CreateMockTestPage isFreeByDefault={true} />} />
        <Route path="/admin/students" element={<ManageStudentsPage />} />
        <Route path="/admin/admissions" element={<AdmissionsPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/courses" element={<ManageCoursesPage />} />
        <Route path="/admin/plans" element={<PlansPage />} />
        <Route path="/admin/account" element={<AdminAccountPage />} />
      </Route>

      {/* UX Error States */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
