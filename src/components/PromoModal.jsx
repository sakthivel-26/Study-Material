import { useState, useEffect } from "react";
import { useApp } from "../store";
import { X } from "lucide-react";

export function PromoModal() {
  const { promoBanner } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!promoBanner?.enabled || !promoBanner?.image) {
      setShow(false);
      return;
    }

    // Check if dismissed in this session
    const dismissedBannerHash = sessionStorage.getItem("dismissed_promo");
    // We use a simple hash of the image URL or text to know if it's the same banner
    const currentHash = promoBanner.image;

    if (dismissedBannerHash !== currentHash) {
      // Small delay to allow the app to render first before popping up
      const t = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(t);
    }
  }, [promoBanner]);

  if (!show || !promoBanner?.image) return null;

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("dismissed_promo", promoBanner.image);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative max-w-2xl w-full mx-auto animate-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white text-black hover:bg-rose-500 hover:text-white rounded-full p-1.5 sm:p-2 shadow-xl border border-black/10 transition-colors z-10"
        >
          <X size={20} className="sm:w-6 sm:h-6" />
        </button>

        <div className="bg-transparent rounded-2xl overflow-hidden shadow-2xl relative">
          <img
            src={promoBanner.image}
            alt="Promotional Banner"
            className="w-full h-auto max-h-[85vh] object-contain bg-white/5"
            onClick={promoBanner.link ? () => window.open(promoBanner.link, '_blank') : undefined}
            style={{ cursor: promoBanner.link ? 'pointer' : 'default' }}
          />
          {promoBanner.code && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
               {/* Optional text overlay if we want to show the code */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
