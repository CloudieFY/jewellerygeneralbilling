import { useState, useEffect, useContext } from "react";
import { ShieldCheck, UserCog, Trash2, Plus, Lock, Mail, Key, X } from "lucide-react";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";

const Users = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "operator",
  });

  const isAdmin = currentUser?.role === "admin";

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const { data } = await API.get("/auth/users");
      setUsers(data.users || []);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const { data } = await API.post("/auth/users", formData);
      toast.success(data.message || "User created successfully");
      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "operator",
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser?._id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await API.delete(`/auth/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading user access control...
      </div>
    );
  }

  // Operator view (Access restricted)
  if (!isAdmin) {
    return (
      <div className="space-y-8 pb-12">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Users
          </p>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            User Access
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* User Profile */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UserCog size={22} />
            </div>
            <h2 className="text-xl font-black text-slate-950">
              {currentUser?.name || "Operator User"}
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {currentUser?.email}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                Operator Role
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                <ShieldCheck size={16} />
                Active
              </span>
            </div>
          </div>

          {/* Locked Notice */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 shadow-inner">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900">User Management Locked</h3>
            <p className="mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
              Only Administrator accounts can manage users, add new credentials, or change system access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Admin view (Full access)
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Access Control
          </p>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            User Management
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Create user credentials, set access roles, and monitor who can log into the billing system.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
        >
          <Plus size={20} />
          Create New User
        </button>
      </div>

      {/* Users List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Name", "Email / Login ID", "Role", "Created At", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 ${
                      heading === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((item) => (
                <tr key={item._id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                        {item.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <p className="font-bold text-slate-950">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                    {item.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                        item.role === "admin"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item._id !== currentUser?._id ? (
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Current Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h2 className="mb-2 text-xl font-black text-slate-950">Add Credentials</h2>
            <p className="mb-6 text-xs font-semibold text-slate-500">
              Create a login identity for employees or secondary users.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-600">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Employee Name"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-600">
                  Email / Login ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-600">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="operator">Operator (Create/Edit only)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
