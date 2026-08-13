import { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Gem, ShieldCheck, ArrowRight, Loader2, KeyRound } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input on page load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setPin(value);
    if (value.length === 5) {
      handleLoginSubmit(value);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(pin);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 px-4 py-8 md:px-6 cursor-pointer"
    >
      {/* Background Decorative Lighting */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-yellow-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md cursor-default" onClick={(e) => e.stopPropagation()}>
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
        <div className="rounded-3xl border border-amber-500/20 bg-slate-900/90 p-8 backdrop-blur-xl shadow-2xl shadow-black/80 sm:p-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-black text-amber-300">
              <KeyRound size={15} />
              ENTER SECURITY PIN
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Type Security PIN on keyboard to unlock
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Hidden Input capturing physical keyboard typing */}
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handleInputChange}
              className="sr-only"
              autoFocus
              maxLength={5}
              autoComplete="off"
            />

            {/* Visual PIN Indicators (Interactive Box Click Focuses Input) */}
            <div
              onClick={() => inputRef.current?.focus()}
              className="flex justify-center gap-3 cursor-pointer py-2"
            >
              {[0, 1, 2, 3, 4].map((index) => {
                const isFilled = index < pin.length;
                const isCurrent = index === pin.length;
                return (
                  <div
                    key={`pin-dot-${index}`}
                    className={`flex h-16 w-14 items-center justify-center rounded-2xl border-2 text-3xl font-black transition-all duration-300 ${
                      isFilled
                        ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/20 scale-105"
                        : isCurrent
                        ? "border-amber-500/60 bg-slate-950/80 text-amber-400 ring-4 ring-amber-500/20"
                        : "border-slate-800 bg-slate-950/60 text-slate-600"
                    }`}
                  >
                    {isFilled ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-600/30 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
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
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          PARASMANI BILLING & ESTIMATE SYSTEM
        </p>
      </div>
    </div>
  );
};

export default Login;
