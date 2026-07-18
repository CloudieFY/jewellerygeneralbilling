import { useState, useContext } from "react";

import { AuthContext } from "../../context/AuthContext";

import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { FileText, Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-4 py-10 md:px-6">
      <div className="relative w-full max-w-md px-4 py-8 sm:px-8 sm:py-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 group hover:scale-110 transition-transform duration-500">
            <FileText size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            BILL<span className="text-blue-600">FLOW</span>
          </h1>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2">Billing & Invoicing Platform</p>
        </div>

        {/* Authentication Console */}
        <div className="premium-card p-12 backdrop-blur-sm bg-white/90">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Portal</h2>
            <p className="text-slate-600 text-sm font-medium mt-1">Sign in to manage billing and invoices</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="admin@yourcompany.com"
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
          Flex Printing Billing Software
        </p>
      </div>
    </div>
  );
};

export default Login;
