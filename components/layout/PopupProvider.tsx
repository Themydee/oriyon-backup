"use client";

import React, { useState, useEffect } from "react";

let popupInstance: {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
} | null = null;

export const setPopupInstance = (instance: typeof popupInstance) => {
  popupInstance = instance;
};

export const popup = {
  alert: (message: string) => {
    if (popupInstance) return popupInstance.alert(message);
    if (typeof window !== "undefined") {
      window.alert(message);
    }
    return Promise.resolve();
  },
  confirm: (message: string) => {
    if (popupInstance) return popupInstance.confirm(message);
    if (typeof window !== "undefined") {
      const res = window.confirm(message);
      return Promise.resolve(res);
    }
    return Promise.resolve(false);
  }
};

export default function PopupProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    message: string;
    resolve: (value: any) => void;
  } | null>(null);

  useEffect(() => {
    setPopupInstance({
      alert: (message: string) => {
        return new Promise<void>((resolve) => {
          setDialog({ isOpen: true, type: "alert", message, resolve });
        });
      },
      confirm: (message: string) => {
        return new Promise<boolean>((resolve) => {
          setDialog({ isOpen: true, type: "confirm", message, resolve });
        });
      }
    });

    return () => {
      setPopupInstance(null);
    };
  }, []);

  const handleClose = (value: boolean) => {
    if (dialog) {
      dialog.resolve(value);
      setDialog(null);
    }
  };

  return (
    <>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-[#0a0f1a] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-6 text-center space-y-4">
              {dialog.type === "alert" ? (
                <div className="w-12 h-12 bg-green-500/10 border border-green-600/30 text-green-400 rounded-full flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
              ) : (
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-600/30 text-amber-400 rounded-full flex items-center justify-center text-xl mx-auto">
                  ⚠️
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-base">
                  {dialog.type === "alert" ? "Notification" : "Confirmation"}
                </h3>
                <p className="text-xs text-slate-400 mt-2 px-1 leading-relaxed font-medium">
                  {dialog.message}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                {dialog.type === "confirm" ? (
                  <>
                    <button
                      onClick={() => handleClose(false)}
                      className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition min-w-[80px]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleClose(true)}
                      className="px-5 py-2 bg-green-600 hover:bg-green-550 text-white text-xs font-bold rounded-xl transition min-w-[80px]"
                    >
                      Confirm
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleClose(true)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-550 text-white text-xs font-bold rounded-xl transition min-w-[90px]"
                  >
                    OK
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
