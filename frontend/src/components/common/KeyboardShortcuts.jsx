import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Keyboard, X } from "lucide-react";

const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // 1. Help modal toggle: Alt + H or Shift + ? (if not typing in input)
      if (
        (e.altKey && e.key.toLowerCase() === "h") ||
        (e.key === "?" &&
          document.activeElement.tagName !== "INPUT" &&
          document.activeElement.tagName !== "SELECT" &&
          document.activeElement.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape key closes modal
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        return;
      }

      // 2. Global Navigation: Alt + [1-8]
      if (e.altKey && !isNaN(e.key) && e.key !== "0") {
        const index = parseInt(e.key, 10);
        const paths = {
          1: "/dashboard",
          2: "/farmers",
          3: "/products",
          4: "/categories",
          5: "/billing",
          6: "/invoices",
          7: "/reports",
          8: "/settings",
        };

        if (paths[index]) {
          e.preventDefault();
          navigate(paths[index]);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [navigate, isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 print:hidden"
        title="Keyboard Shortcuts (Alt + H)"
      >
        <Keyboard size={22} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:hidden">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Keyboard size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-950">Keyboard Shortcuts</h3>
            <p className="text-xs font-semibold text-slate-500">
              Operate the software at lightning speed without a mouse
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Navigation */}
          <div>
            <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Global Navigation
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { keys: "Alt + 1", desc: "Dashboard" },
                { keys: "Alt + 2", desc: "Customers / Farmers" },
                { keys: "Alt + 3", desc: "Product Master" },
                { keys: "Alt + 4", desc: "Categories" },
                { keys: "Alt + 5", desc: "Create Bill / Invoicing" },
                { keys: "Alt + 6", desc: "Invoices & Orders List" },
                { keys: "Alt + 7", desc: "Reports" },
                { keys: "Alt + 8", desc: "Settings" },
              ].map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5"
                >
                  <span className="font-semibold text-slate-600">{shortcut.desc}</span>
                  <kbd className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 shadow-sm">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Invoicing Specific */}
          <div>
            <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Billing & Invoicing Page (Alt+5)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { keys: "Alt + A", desc: "Add product item row" },
                { keys: "Alt + G", desc: "Select GST Invoice" },
                { keys: "Alt + O", desc: "Select Non-GST Order" },
                { keys: "Alt + F", desc: "Focus Customer Dropdown" },
                { keys: "Ctrl + Enter", desc: "Save / Create Bill" },
                { keys: "Enter", desc: "Next input field navigation" },
              ].map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5"
                >
                  <span className="font-semibold text-slate-600">{shortcut.desc}</span>
                  <kbd className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 shadow-sm">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Press <kbd className="font-mono">Esc</kbd> or <kbd className="font-mono">Alt + H</kbd> to close
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
