import { useEffect, useState } from "react";
import {
  Building2,
  Home,
  Phone,
  Save,
  User,
} from "lucide-react";

const CustomerForm = ({ initialData = {}, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    village: "",
    city: "",
    address: "",
    gstNumber: "",
  });

  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    // Sync form fields when edit data is loaded from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: initialData.name || "",
      mobileNumber: initialData.mobileNumber || "",
      village: initialData.village || "",
      city: initialData.city || "",
      address: initialData.address || "",
      gstNumber: initialData.gstNumber || "",
    });
  }, [initialData]);

  const handleChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const labelClasses =
    "mb-2 block text-xs font-black uppercase tracking-widest text-slate-600";
  const iconClasses =
    "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2 className="text-xl font-black text-slate-950">Customer Details</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Keep only the essential customer information needed for billing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className={labelClasses}>Customer Name</label>
          <div className="relative">
            <User className={iconClasses} size={18} />
            <input
              type="text"
              name="name"
              placeholder="Customer name"
              value={formData.name}
              onChange={handleChange}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Mobile</label>
          <div className="relative">
            <Phone className={iconClasses} size={18} />
            <input
              type="text"
              name="mobileNumber"
              placeholder="+91 XXXXX XXXXX"
              value={formData.mobileNumber}
              onChange={handleChange}
              className="input-field pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Area</label>
          <div className="relative">
            <Home className={iconClasses} size={18} />
            <input
              type="text"
              name="village"
              placeholder="Area or city"
              value={formData.village}
              onChange={handleChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>City</label>
          <div className="relative">
            <Building2 className={iconClasses} size={18} />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div>
          <label className={labelClasses}>GSTIN Optional</label>
          <input
            type="text"
            name="gstNumber"
            placeholder="Customer GSTIN"
            value={formData.gstNumber}
            onChange={handleChange}
            className="input-field uppercase"
          />
        </div>

      </div>

      <div>
        <label className={labelClasses}>Address</label>
        <textarea
          name="address"
          placeholder="Complete customer address"
          value={formData.address}
          onChange={handleChange}
          className="input-field min-h-28 resize-none"
        />
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
        >
          <Save size={20} />
          {loading ? "Saving..." : "Save Customer"}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
