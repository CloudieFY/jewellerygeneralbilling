import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Gem, ShieldCheck, Delete, ArrowRight, Loader2, KeyRound, CheckCircle2 } from "lucide-react";

const MASTER_PIN = "19750";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (numStr) => {
    if (loading) return;
    if (pin.length < 5) {
      setPin((prev) => prev + numStr);
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (loading) return;
    setPin("");
  };

  const handleLoginSubmit = async (pinToSubmit = pin) => {
    if (!pinToSubmit || loading) return;
    try {
      setLoading(true);
      await login({ pin: pinToSubmit, password: pinToSubmit });
      toast.success("Security Access Granted");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Incorrect Security PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 5) {
          setPin((prev) => {
            const nextPin = prev + e.key;
            if (nextPin.length === 5) {
              handleLoginSubmit(nextPin);
            }
            return nextPin;
          });
        }
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Enter") {
        if (pin.length >= 4) {
          handleLoginSubmit(pin);
        }
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading]);

  // Auto submit when 5 digits reached
  useEffect(() => {
    if (pin.length === 5) {
      handleLoginSubmit(pin);
    }
  }, [pin]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 px-4 py-8 md:px-6">
      {/* Background Decorative Lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-yellow-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Brand Identity Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 p-0.5 shadow-2xl shadow-amber-600/30">
            <div className="flex h-full w-full items-center justify-center rounded-[1.9rem] bg-slate-950">
              <Gem size={38} className="text-amber-400 animate-pulse" />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            PARASMANI <span className="text-amber-400 font-serif italic">JEWELLERS</span>
          </h1>
          <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-amber-300/80">
            Murarilal Garg & Sons • Billing Suite
          </p>
        </div>

        {/* PIN Security Card */}
        <div className="rounded-3xl border border-amber-500/20 bg-slate-900/90 p-6 backdrop-blur-xl shadow-2xl shadow-black/80 sm:p-8">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
              <KeyRound size={14} />
              ENTER SECURITY PIN
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Tap keypad numbers or type on keyboard to unlock
            </p>
          </div>

          {/* PIN Digit Indicators */}
          <div className="mb-8 flex justify-center gap-3">
            {[0, 1, 2, 3, 4].map((index) => {
              const isFilled = index < pin.length;
              return (
                <div
                  key={`pin-dot-${index}`}
                  className={`flex h-14 w-12 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all duration-300 ${
                    isFilled
                      ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20 scale-105"
                      : "border-slate-800 bg-slate-950/60 text-slate-600"
                  }`}
                >
                  {isFilled ? "•" : ""}
                </div>
              );
            })}
          </div>

          {/* Touch Keypad Grid */}
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={`btn-${num}`}
                type="button"
                onClick={() => handleKeyPress(num)}
                disabled={loading}
                className="flex h-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-2xl font-black text-slate-100 shadow-md transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row: Clear / 0 / Delete */}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || !pin.length}
              className="flex h-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/40 text-xs font-black uppercase tracking-wider text-slate-400 hover:border-slate-700 hover:text-slate-200 active:scale-95 disabled:opacity-30"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              disabled={loading}
              className="flex h-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-2xl font-black text-slate-100 shadow-md transition-all hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 active:scale-95 disabled:opacity-50"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || !pin.length}
              className="flex h-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 text-slate-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:opacity-30"
              title="Delete last digit"
            >
              <Delete size={22} />
            </button>
          </div>

          {/* Quick Submit & Master PIN Option */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleLoginSubmit(pin)}
              disabled={loading || pin.length < 4}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-600/30 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Unlock Billing Console
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Quick Fill Master PIN Button */}
            <button
              type="button"
              onClick={() => {
                setPin(MASTER_PIN);
                handleLoginSubmit(MASTER_PIN);
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20"
            >
              <CheckCircle2 size={14} className="text-amber-400" />
              Quick Unlock with Master PIN (19750)
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          PARASMANI BILLING & ESTIMATE SYSTEM
        </p>
      </div>
    </div>
  );
};

export default Login;
