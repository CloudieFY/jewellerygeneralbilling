import { User, ChevronDown } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="glass-panel sticky top-6 z-40 flex justify-end rounded-[2rem] px-4 py-4 shadow-premium sm:px-6 sm:py-5">
      <div className="flex w-full items-center justify-end gap-4 md:w-auto">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 tracking-tight">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Admin</p>
          </div>
          <div className="relative group cursor-pointer">
            <div className="w-11 h-11 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:shadow-md transition-all">
              {user?.name?.charAt(0) || <User size={20} />}
            </div>

            <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
