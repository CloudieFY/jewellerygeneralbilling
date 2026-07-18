import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../../services/api";

const Settings = () => {
  const [settings, setSettings] = useState({
    shopName: "Walia's Creative",
    shopAddress: "",
    shopMobile: "",
    shopEmail: "",
    gstNumber: "",
    gstPercentage: "",
    bankName: "",
    bankBranch: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    invoiceBusinessLine: "",
    invoiceTermOne: "",
    invoiceTermTwo: "",
    invoiceMarginTop: 8,
    invoiceMarginRight: 8,
    invoiceMarginBottom: 8,
    invoiceMarginLeft: 8,
    reminderDaysBeforeDue: "",
    overdueReminderEnabled: true,
    lowStockAlertEnabled: true,
    gstInvoicePrefix: "GST-INV",
    orderPrefix: "ORD",
    gstInvoiceCounter: 0,
    orderCounter: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      try {
        const { data } = await API.get("/settings");
        setSettings((prev) => ({
          ...prev,
          ...(data.settings || {}),
        }));
      } catch (error) {
        toast.error("Unable to load settings");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getSettings();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateSettings = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await API.put("/settings", settings);
      toast.success("Settings updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading settings...
      </div>
    );
  }

  const inputClass = "input-field";
  const labelClass =
    "mb-2 block text-xs font-black uppercase tracking-widest text-slate-600";

  return (
    <div className="max-w-5xl space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Settings
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Business Settings
        </h1>
        <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
          Configure business, GST, bank, and reminder details.
        </p>
      </div>

      <form
        onSubmit={updateSettings}
        className="space-y-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <section>
          <h2 className="mb-5 text-xl font-black text-slate-950">
            Business Details
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Business Name</label>
              <input
                type="text"
                name="shopName"
                value="Walia's Creative"
                disabled
                className={`${inputClass} cursor-not-allowed bg-slate-100 text-slate-500`}
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Company name is fixed on the invoice.
              </p>
            </div>
            <div>
              <label className={labelClass}>Business Phone</label>
              <input
                type="text"
                name="shopMobile"
                value={settings.shopMobile || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Business Email</label>
              <input
                type="email"
                name="shopEmail"
                value={settings.shopEmail || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Business Address</label>
              <input
                type="text"
                name="shopAddress"
                value={settings.shopAddress || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-xl font-black text-slate-950">
            Invoice Design &amp; Content
          </h2>
          <p className="mb-5 text-sm font-medium text-slate-500">
            These values control the GST invoice on screen, PDF, and print.
          </p>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className={labelClass}>Services / Business Line</label>
              <input
                type="text"
                name="invoiceBusinessLine"
                value={settings.invoiceBusinessLine || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Eco Solvent Print, Flex Banners, Hoardings..."
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>Terms Line 1</label>
                <input
                  type="text"
                  name="invoiceTermOne"
                  value={settings.invoiceTermOne || ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="All disputes are subject to Raipur Jurisdiction only."
                />
              </div>
              <div>
                <label className={labelClass}>Terms Line 2</label>
                <input
                  type="text"
                  name="invoiceTermTwo"
                  value={settings.invoiceTermTwo || ""}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="E.&O.E. GST rules apply as current regulations."
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-700">
                A4 Margins (millimetres)
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["invoiceMarginTop", "Top"],
                  ["invoiceMarginRight", "Right"],
                  ["invoiceMarginBottom", "Bottom"],
                  ["invoiceMarginLeft", "Left"],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className={labelClass}>{label}</label>
                    <input
                      type="number"
                      name={name}
                      min="0"
                      max="20"
                      step="0.5"
                      value={settings[name] ?? 8}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Allowed range: 0–20 mm. Default: 8 mm on every side.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-black text-slate-950">
            GST Details
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={settings.gstNumber || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Default GST %</label>
              <input
                type="number"
                name="gstPercentage"
                value={settings.gstPercentage || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-black text-slate-950">
            Bank Details
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              ["bankName", "Bank Name"],
              ["bankBranch", "Bank Branch"],
              ["accountHolderName", "Account Holder Name"],
              ["accountNumber", "Account Number"],
              ["ifscCode", "IFSC Code"],
              ["upiId", "UPI ID for QR Code"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className={labelClass}>{label}</label>
                <input
                  type="text"
                  name={name}
                  value={settings[name] || ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-5 text-xl font-black text-slate-950">
            Reminders
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Reminder Days Before Due</label>
              <input
                type="number"
                name="reminderDaysBeforeDue"
                value={settings.reminderDaysBeforeDue || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                name="overdueReminderEnabled"
                checked={Boolean(settings.overdueReminderEnabled)}
                onChange={handleChange}
              />
              Due reminder enabled
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                name="lowStockAlertEnabled"
                checked={Boolean(settings.lowStockAlertEnabled)}
                onChange={handleChange}
              />
              Product alert enabled
            </label>
          </div>
        </section>

        {/* ── Invoice Number Series ── */}
        <section>
          <h2 className="mb-1 text-xl font-black text-slate-950">
            Invoice Number Series
          </h2>
          <p className="mb-5 text-sm font-medium text-slate-500">
            Configure prefix for GST Invoice and Non-GST Order number series.
            Counters auto-increment and are never reset on delete.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>GST Invoice Prefix</label>
              <input
                type="text"
                name="gstInvoicePrefix"
                value={settings.gstInvoicePrefix || "GST-INV"}
                onChange={handleChange}
                className={inputClass}
                placeholder="GST-INV"
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Example: <span className="font-black text-blue-600">{settings.gstInvoicePrefix || "GST-INV"}-0001</span>
              </p>
            </div>

            <div>
              <label className={labelClass}>Non-GST Order Prefix</label>
              <input
                type="text"
                name="orderPrefix"
                value={settings.orderPrefix || "ORD"}
                onChange={handleChange}
                className={inputClass}
                placeholder="ORD"
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Example: <span className="font-black text-orange-600">{settings.orderPrefix || "ORD"}-0001</span>
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                GST Invoice Counter
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {settings.gstInvoiceCounter || 0}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Total GST invoices created
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-orange-600">
                Order Counter
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                {settings.orderCounter || 0}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Total non-GST orders created
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
