import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Building2,
  CreditCard,
  Eye,
  IndianRupee,
  Plus,
  Receipt,
  Save,
  Trash2,
} from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const emptyVendor = {
  vendorName: "",
  mobile: "",
  gstNumber: "",
  address: "",
  openingBalance: "",
  status: "active",
};

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: "",
    amount: "",
    billNo: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    vendorId: "",
    amount: "",
    paymentMode: "cash",
    voucherDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    expenseHead: "",
    partyName: "",
    amount: "",
    paymentMode: "cash",
    voucherDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const [vendorRes, transactionRes] = await Promise.all([
        API.get("/vendors"),
        API.get("/vendors/transactions"),
      ]);
      setVendors(vendorRes.data.vendors || []);
      setTransactions(transactionRes.data.transactions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load master and ledger rows once when the page opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVendors();
  }, []);

  const stats = useMemo(() => {
    return vendors.reduce(
      (total, vendor) => ({
        purchases: total.purchases + Number(vendor.totalPurchase || 0),
        paid: total.paid + Number(vendor.totalPaid || 0),
        outstanding:
          total.outstanding +
          Number(vendor.outstandingBalance ?? vendor.dueAmount ?? 0),
      }),
      { purchases: 0, paid: 0, outstanding: 0 }
    );
  }, [vendors]);

  const handleVendorChange = (event) => {
    setVendorForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const createVendor = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await API.post("/vendors", vendorForm);
      toast.success("Vendor added");
      setVendorForm(emptyVendor);
      loadVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const deleteVendor = async (id) => {
    if (!window.confirm("Delete this vendor and its ledger entries?")) return;

    try {
      await API.delete(`/vendors/${id}`);
      toast.success("Vendor deleted");
      loadVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete vendor");
    }
  };

  const createPurchase = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await API.post("/vendors/purchase", purchaseForm);
      toast.success("Purchase voucher added");
      setPurchaseForm((prev) => ({ ...prev, amount: "", billNo: "", remarks: "" }));
      loadVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add purchase");
    } finally {
      setSaving(false);
    }
  };

  const createPayment = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await API.post("/vendors/payment", paymentForm);
      toast.success("Payment voucher added");
      setPaymentForm((prev) => ({ ...prev, amount: "", remarks: "" }));
      loadVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add payment");
    } finally {
      setSaving(false);
    }
  };

  const createExpense = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await API.post("/vendors/expense", expenseForm);
      toast.success("Expense voucher added");
      setExpenseForm((prev) => ({
        ...prev,
        expenseHead: "",
        partyName: "",
        amount: "",
        remarks: "",
      }));
      loadVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to add expense");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
  const labelClass =
    "mb-2 block text-xs font-black uppercase tracking-widest text-slate-500";

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading vendors...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Supplier / Vendor Master
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Vendors & Payments
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
          Maintain vendor opening balances, purchase vouchers, payment vouchers,
          and vendor outstanding in one simple workspace.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
        {[
          { label: "Vendors", value: vendors.length, icon: <Building2 size={22} /> },
          { label: "Purchases", value: formatCurrency(stats.purchases), icon: <Receipt size={22} /> },
          { label: "Paid", value: formatCurrency(stats.paid), icon: <CreditCard size={22} /> },
          { label: "Outstanding", value: formatCurrency(stats.outstanding), icon: <IndianRupee size={22} /> },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {card.icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <form onSubmit={createVendor} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-black text-slate-950">
            <Plus size={20} className="text-blue-600" />
            Add Vendor
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Vendor Name</label>
              <input name="vendorName" value={vendorForm.vendorName} onChange={handleVendorChange} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Mobile</label>
              <input name="mobile" value={vendorForm.mobile} onChange={handleVendorChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GSTIN</label>
              <input name="gstNumber" value={vendorForm.gstNumber} onChange={handleVendorChange} className={`${inputClass} uppercase`} />
            </div>
            <div>
              <label className={labelClass}>Opening Balance</label>
              <input type="number" name="openingBalance" value={vendorForm.openingBalance} onChange={handleVendorChange} className={inputClass} min="0" step="0.01" />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea name="address" value={vendorForm.address} onChange={handleVendorChange} className={`${inputClass} min-h-24 resize-none`} />
            </div>
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700 disabled:opacity-60">
              <Save size={18} />
              Save Vendor
            </button>
          </div>
        </form>

        <form onSubmit={createPurchase} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-slate-950">Purchase Voucher</h2>
          <VoucherFields
            form={purchaseForm}
            setForm={setPurchaseForm}
            vendors={vendors}
            inputClass={inputClass}
            labelClass={labelClass}
            type="purchase"
          />
          <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-60">
            Add Purchase
          </button>
        </form>

        <form onSubmit={createPayment} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-slate-950">Payment Voucher</h2>
          <VoucherFields
            form={paymentForm}
            setForm={setPaymentForm}
            vendors={vendors}
            inputClass={inputClass}
            labelClass={labelClass}
            type="payment"
          />
          <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-60">
            Pay Vendor
          </button>
        </form>

        <form onSubmit={createExpense} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-black text-slate-950">Expense Voucher</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Expense Head</label>
              <input name="expenseHead" value={expenseForm.expenseHead} onChange={(event) => setExpenseForm((prev) => ({ ...prev, expenseHead: event.target.value }))} className={inputClass} placeholder="Rent, salary, transport..." required />
            </div>
            <div>
              <label className={labelClass}>Paid To</label>
              <input name="partyName" value={expenseForm.partyName} onChange={(event) => setExpenseForm((prev) => ({ ...prev, partyName: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="voucherDate" value={expenseForm.voucherDate} onChange={(event) => setExpenseForm((prev) => ({ ...prev, voucherDate: event.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Amount</label>
              <input type="number" name="amount" value={expenseForm.amount} onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))} className={inputClass} min="0" step="0.01" required />
            </div>
            <div>
              <label className={labelClass}>Payment Mode</label>
              <select name="paymentMode" value={expenseForm.paymentMode} onChange={(event) => setExpenseForm((prev) => ({ ...prev, paymentMode: event.target.value }))} className={inputClass}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Remarks</label>
              <textarea name="remarks" value={expenseForm.remarks} onChange={(event) => setExpenseForm((prev) => ({ ...prev, remarks: event.target.value }))} className={`${inputClass} min-h-24 resize-none`} />
            </div>
          </div>
          <button disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-white hover:bg-amber-600 disabled:opacity-60">
            Add Expense
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-950">Vendor List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Vendor", "Mobile", "GSTIN", "Purchase", "Paid", "Outstanding", "Actions"].map((heading) => (
                  <th key={heading} className={`px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 ${heading === "Actions" ? "text-right" : ""}`}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td className="px-5 py-4 font-black text-slate-950">{vendor.vendorName}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{vendor.mobile || "-"}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">{vendor.gstNumber || "-"}</td>
                    <td className="px-5 py-4 text-sm font-black text-slate-950">{formatCurrency(vendor.totalPurchase)}</td>
                    <td className="px-5 py-4 text-sm font-black text-emerald-700">{formatCurrency(vendor.totalPaid)}</td>
                    <td className="px-5 py-4 text-sm font-black text-red-600">{formatCurrency(vendor.outstandingBalance ?? vendor.dueAmount)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/vendors/${vendor._id}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                          title="View ledger"
                        >
                          <Eye size={17} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteVendor(vendor._id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                          title="Delete vendor"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-950">Recent Vendor Ledger Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Date", "Vendor", "Voucher", "Type", "Mode", "Amount", "Remarks"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 10).map((entry) => (
                <tr key={entry._id}>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{new Date(entry.voucherDate || entry.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-4 text-sm font-black text-slate-950">{entry.vendor?.vendorName || "-"}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{entry.voucherNo || entry.billNo || "-"}</td>
                  <td className="px-5 py-4 text-sm font-black capitalize text-blue-700">{entry.type}</td>
                  <td className="px-5 py-4 text-sm font-semibold capitalize text-slate-600">{entry.paymentMode || "-"}</td>
                  <td className="px-5 py-4 text-sm font-black text-slate-950">{formatCurrency(entry.amount)}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{entry.remarks || "-"}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                    No vendor ledger entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const VoucherFields = ({
  form,
  setForm,
  vendors,
  inputClass,
  labelClass,
  type,
}) => {
  const change = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Vendor</label>
        <select name="vendorId" value={form.vendorId} onChange={change} className={inputClass} required>
          <option value="">Select Vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.vendorName} - Due {formatCurrency(vendor.outstandingBalance ?? vendor.dueAmount)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" name="voucherDate" value={form.voucherDate} onChange={change} className={inputClass} required />
      </div>
      {type === "purchase" && (
        <div>
          <label className={labelClass}>Supplier Bill No.</label>
          <input name="billNo" value={form.billNo} onChange={change} className={inputClass} />
        </div>
      )}
      <div>
        <label className={labelClass}>Amount</label>
        <input type="number" name="amount" value={form.amount} onChange={change} className={inputClass} min="0" step="0.01" required />
      </div>
      {type === "payment" && (
        <div>
          <label className={labelClass}>Payment Mode</label>
          <select name="paymentMode" value={form.paymentMode} onChange={change} className={inputClass}>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      )}
      <div>
        <label className={labelClass}>Remarks</label>
        <textarea name="remarks" value={form.remarks} onChange={change} className={`${inputClass} min-h-24 resize-none`} />
      </div>
    </div>
  );
};

export default Vendors;
