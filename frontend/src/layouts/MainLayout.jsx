import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import KeyboardShortcuts from "../components/common/KeyboardShortcuts";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
        )}

        <main className="flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 md:ml-[280px]">
          <div className="min-w-0 flex-1 space-y-8 p-4 md:p-8">
            <div className="flex items-center justify-between gap-4 md:hidden">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                <Menu size={20} />
              </button>
              <div className="text-lg font-black text-slate-900">⚡ Cloudify</div>
            </div>

            <Navbar />

            <div>{children}</div>
          </div>

          <footer className="flex flex-col gap-4 border-t border-slate-100 bg-white/70 px-4 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 md:flex-row md:items-center md:justify-between md:px-8">
            <span>Copyright 2026 Cloudify — General Billing Software</span>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="transition-colors hover:text-blue-600">
                Privacy
              </a>
              <a href="#" className="transition-colors hover:text-blue-600">
                Terms
              </a>
              <a href="#" className="transition-colors hover:text-blue-600">
                Support
              </a>
            </div>
          </footer>
        </main>
      </div>
      <KeyboardShortcuts />
    </div>
  );
};

export default MainLayout;
