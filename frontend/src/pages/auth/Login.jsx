import { useState, useContext } from "react";

import { AuthContext } from "../../context/AuthContext";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { Gem, User, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(formData);
      toast.success("Authentication Successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-[#fffdf5] to-yellow-100 px-4 py-10 md:px-6">
      <div className="relative w-full max-w-md px-4 py-8 sm:px-8 sm:py-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-12">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-amber-900 via-amber-700 to-yellow-500 shadow-2xl shadow-amber-700/20 transition-transform duration-500 group hover:scale-110">
            <Gem size={40} className="text-amber-50" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            JEWEL<span className="text-amber-700">FLOW</span>
          </h1>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.35em] text-amber-800">Fine Jewellery Billing Suite</p>
        </div>

        {/* Authentication Console */}
        <div className="premium-card p-12 backdrop-blur-sm bg-white/90">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Portal</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">Sign in to manage billing and invoices</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="text"
                  name="email"
                  placeholder="admin"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Remember Me</span>
              </div>
              <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">Forgot Password</button>
            </div>

            <button
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <ShieldCheck size={22} />
                  Sign In
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>


        </div>

        <p className="mt-12 text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
          Jewellery Inventory & Billing Software
        </p>
      </div>
    </div>
  );
};

export default Login;
