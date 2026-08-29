import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home, WifiOff, ShieldAlert, ArrowLeft, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "../components/ui.jsx";

// Base template for all error screens to maintain consistency
function ErrorLayout({ icon: Icon, title, description, primaryAction, secondaryAction }) {
  return (
    <div className="min-h-screen bg-appbg flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center mb-6">
          <Icon size={40} />
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-3">{title}</h1>
        <p className="text-ink-muted mb-8 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="btn-primary py-3 px-6 flex items-center justify-center"
            >
              {primaryAction.icon && <primaryAction.icon size={18} className="mr-2" />}
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn-outline py-3 px-6 flex items-center justify-center"
            >
              {secondaryAction.icon && <secondaryAction.icon size={18} className="mr-2" />}
              {secondaryAction.label}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ErrorLayout
      icon={AlertTriangle}
      title="Page not found"
      description="Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable."
      primaryAction={{
        label: "Back to Home",
        icon: Home,
        onClick: () => navigate("/", { replace: true })
      }}
      secondaryAction={{
        label: "Go Back",
        icon: ArrowLeft,
        onClick: () => navigate(-1)
      }}
    />
  );
}

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <ErrorLayout
      icon={ShieldAlert}
      title="Access restricted"
      description="You do not have permission to view this page. If you believe this is an error, please contact support or switch to a different account."
      primaryAction={{
        label: "Back to Dashboard",
        icon: Home,
        onClick: () => navigate("/", { replace: true })
      }}
    />
  );
}

export function OfflinePage({ onRetry }) {
  return (
    <ErrorLayout
      icon={WifiOff}
      title="You're offline"
      description="It looks like you've lost your internet connection. Please check your network settings and try again."
      primaryAction={{
        label: "Try Again",
        icon: null,
        onClick: onRetry || (() => window.location.reload())
      }}
    />
  );
}

export function MaintenancePage() {
  return (
    <ErrorLayout
      icon={Wrench}
      title="We'll be back soon!"
      description="Ken Academy is currently undergoing scheduled maintenance to bring you a better experience. We should be back shortly."
      primaryAction={{
        label: "Refresh Page",
        icon: null,
        onClick: () => window.location.reload()
      }}
    />
  );
}
