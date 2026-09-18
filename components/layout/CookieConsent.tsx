"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = "oriyon_cookie_consent";

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    // Check if consent has already been given
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Delay showing the banner slightly for better entry animation feel
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored cookie consent", e);
      }
    }
  }, []);

  useEffect(() => {
    // Listen for global request to open preferences (from footer or policies)
    const handleOpenRequest = () => {
      setShowPreferences(true);
      setIsOpen(true);
    };

    window.addEventListener("open-cookie-preferences", handleOpenRequest);
    return () => window.removeEventListener("open-cookie-preferences", handleOpenRequest);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    const allOn = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    savePreferences(allOn);
  };

  const handleRejectAll = () => {
    const essentialsOnly = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    savePreferences(essentialsOnly);
  };

  const handleSaveCustom = () => {
    savePreferences(preferences);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md lg:max-w-lg z-50 p-5 md:p-6 bg-[#061e1a]/95 backdrop-blur-md border border-teal-900/40 text-white rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom duration-500 font-sora text-left">
      {!showPreferences ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-[#00D1C1] text-sm font-bold tracking-wider uppercase flex items-center gap-2">
              <span>🍪</span> We Value Your Privacy
            </h3>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
              This website uses cookies to improve your experience and to support the functioning of our learning and registration platform. By clicking &quot;Accept All&quot;, you consent to our use of cookies. You may also &quot;Manage Preferences&quot; to control which cookies are active, or &quot;Reject Non-Essential&quot; cookies. For full details, see our{" "}
              <Link href="/cookies" className="text-[#00D1C1] underline hover:text-white transition">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => setShowPreferences(true)}
              className="flex-1 px-3 py-2.5 border border-gray-600 hover:border-[#00D1C1] text-xs font-semibold rounded-lg transition text-gray-300 hover:text-white cursor-pointer text-center"
            >
              Preferences
            </button>
            <button
              onClick={handleRejectAll}
              className="flex-1 px-3 py-2.5 border border-transparent hover:border-teal-900/40 text-xs font-semibold rounded-lg transition text-gray-300 hover:text-white cursor-pointer text-center"
            >
              Reject Extra
            </button>
            <button
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2.5 bg-[#00D1C1] hover:bg-[#00bdae] text-[#061e1a] text-xs font-bold rounded-lg transition shadow-md hover:shadow-lg cursor-pointer text-center"
            >
              Accept All
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-[#00D1C1]">🍪</span> Cookie Preferences
            </h3>
            <button
              onClick={() => setShowPreferences(false)}
              className="text-gray-400 hover:text-white text-xs transition cursor-pointer"
            >
              ← Back
            </button>
          </div>
          
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {/* Essential */}
            <div className="bg-[#0b2b25] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">Strictly Necessary</span>
                  <span className="text-[9px] bg-teal-900/50 text-[#00D1C1] border border-teal-800/40 rounded px-1.5 py-0.5 font-bold">
                    Always On
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Required for core website features, secure logins, registration form stability, and payment integrations.
                </p>
              </div>
            </div>

            {/* Functional */}
            <div className="bg-[#0b2b25] border border-white/5 rounded-xl p-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">Functional Cookies</span>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Remember options you choose (like language and specific preferences) to deliver a personalized experience.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) =>
                    setPreferences({ ...preferences, functional: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00D1C1]"></div>
              </label>
            </div>

            {/* Analytics */}
            <div className="bg-[#0b2b25] border border-white/5 rounded-xl p-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">Analytics Cookies</span>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Help us count visits and traffic sources to measure and improve our cooperative platform performance.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00D1C1]"></div>
              </label>
            </div>

            {/* Marketing */}
            <div className="bg-[#0b2b25] border border-white/5 rounded-xl p-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white">Third-Party & Marketing</span>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Support external widgets (like WhatsApp Live Chat), embedded media players, and secure payment processors.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00D1C1]"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2 border border-gray-600 hover:border-gray-400 text-xs font-semibold rounded-lg transition text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustom}
              className="px-5 py-2.5 bg-[#00D1C1] hover:bg-[#00bdae] text-[#061e1a] text-xs font-bold rounded-lg transition shadow-md hover:shadow-lg cursor-pointer"
            >
              Save Choices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
