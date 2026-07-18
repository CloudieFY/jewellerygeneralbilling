import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  X,
  Gem,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={21} /> },
  { name: "Customers", path: "/farmers", icon: <Users size={21} /> },
  { name: "Products", path: "/products", icon: <Boxes size={21} /> },
  { name: "Categories", path: "/categories", icon: <FolderTree size={21} /> },
  { name: "Create Bill", path: "/billing", icon: <ShoppingBag size={21} /> },
  { name: "Invoices & Orders", path: "/invoices", icon: <Receipt size={21} /> },
  { name: "Reports", path: "/reports", icon: <BarChart3 size={21} /> },
  { name: "Users", path: "/users", icon: <UserCog size={21} /> },
  { name: "Settings", path: "/settings", icon: <Settings size={21} /> },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-amber-800/30 bg-gradient-to-b from-amber-950 via-stone-950 to-amber-950 text-amber-50 shadow-2xl transition-transform duration-300 md:w-[280px] md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-700/30 p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fef3c7, #d97706)",
              boxShadow: "0 4px 18px rgba(245,158,11,0.3)",
            }}
          >
            <Gem size={23} className="text-amber-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-amber-50">
              JewelFlow
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
              Fine Jewellery Billing
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                isActive
                  ? "text-white shadow-lg"
                  : "text-amber-100/75 hover:bg-amber-100/10 hover:text-amber-200"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "linear-gradient(135deg, #92400e, #d97706)",
                    boxShadow: "0 5px 18px rgba(217,119,6,0.26)",
                  }
                : {}
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="border-t border-amber-700/30 p-4">
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-amber-100/70 transition hover:bg-red-950/40 hover:text-red-300"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
