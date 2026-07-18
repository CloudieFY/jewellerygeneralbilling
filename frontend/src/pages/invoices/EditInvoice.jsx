import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileCheck,
  FileText,
  IndianRupee,
  MessageSquare,
  Plus,
  Receipt,
  Ruler,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import {
  RATE_TYPES,
  calculateInvoiceTotals,
  calculateLine,
  getProductRate,
  toNumber,
} from "../../utils/billing";

const emptyItem = {
  product: "",
  length: "",
  width: "",
  quantity: 1,
  selectedRate: "",
  gstRate: "",
};

const today = new Date().toISOString().slice(0, 10);

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI / GPay" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [documentType, setDocumentType] = useState("gst_invoice");

  const gstEnabled = documentType === "gst_invoice";

  const [formData, setFormData] = useState({
    farmerId: "",
    rateType: "Rate A",
    invoiceDate: today,
    billingType: "credit",
    receivedAmount: "",
    paymentMode: "cash",
    remarks: "",
    products: [{ ...emptyItem }],
  });

  const summary = useMemo(
    () =>
      calculateInvoiceTotals(
        formData.products,
        productsList,
        formData.rateType,
        gstEnabled
      ),
    [formData.products, formData.rateType, productsList, gstEnabled]
  );

  const balanceDue = useMemo(() => {
    if (formData.billingType === "cash") return 0;
    const received = toNumber(formData.receivedAmount);
    return Math.max(summary.grandTotal - received, 0);
  }, [summary.grandTotal, formData.receivedAmount, formData.billingType]);

  const withProductRate = (item, rateType = formData.rateType) => {
    const product = productsList.find((entry) => entry._id === item.product);
    if (!product) return item;
    return {
      ...item,
      selectedRate: getProductRate(product, rateType),
      gstRate: product.gstRate ?? 0,
    };
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((entry) => entry._id === customerId);
    const nextRateType = customer?.defaultRateType || "Rate A";
    setFormData((prev) => ({
      ...prev,
      farmerId: customerId,
      rateType: nextRateType,
      products: prev.products.map((item) =>
        item.product ? withProductRate(item, nextRateType) : item
      ),
    }));
  };

  const handleRateTypeChange = (rateType) => {
    setFormData((prev) => ({
      ...prev,
      rateType,
      products: prev.products.map((item) =>
        item.product ? withProductRate(item, rateType) : item
      ),
    }));
  };

  const handleProductChange = (index, field, value) => {
    setFormData((prev) => {
      const products = prev.products.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "product") {
          const product = productsList.find((entry) => entry._id === value);
          return {
            ...updated,
            selectedRate: product ? getProductRate(product, prev.rateType) : "",
            gstRate: product?.gstRate ?? "",
          };
        }
        return updated;
      });
      return { ...prev, products };
    });
  };

  const addProductRow = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { ...emptyItem }],
    }));
  };

  const removeProductRow = (index) => {
    setFormData((prev) => {
      if (prev.products.length === 1) return prev;
      return {
        ...prev,
        products: prev.products.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter") return;
    const active = document.activeElement;
    if (
      !active ||
      (active.tagName !== "INPUT" && active.tagName !== "SELECT" && active.tagName !== "TEXTAREA") ||
      active.type === "submit"
    ) return;
    event.preventDefault();
    const controls = Array.from(
      event.currentTarget.querySelectorAll("input, select, textarea, button[type='submit']")
    ).filter((el) => !el.disabled && el.type !== "hidden" && el.tabIndex !== -1);
    const index = controls.indexOf(active);
    const next = controls[index + 1];
    if (next) {
      next.focus();
      if (next.tagName === "INPUT" && next.select) next.select();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.farmerId) {
      toast.error("Please select a customer");
      return;
    }

    const invalidItem = formData.products.some((item) => {
      const product = productsList.find((entry) => entry._id === item.product);
      const line = calculateLine(item, product, formData.rateType, gstEnabled);
      return (
        !item.product ||
        line.length <= 0 ||
        line.width <= 0 ||
        line.quantity <= 0 ||
        line.rate <= 0
      );
    });

    if (invalidItem) {
      toast.error("Select product and enter valid size, quantity, and rate");
      return;
    }

    const receivedAmt = toNumber(formData.receivedAmount);
    if (receivedAmt > summary.grandTotal) {
      toast.error("Received amount cannot exceed grand total");
      return;
    }

    try {
      setLoading(true);
      await API.put(`/invoices/${id}`, {
        farmerId: formData.farmerId,
        billingType: formData.billingType,
        rateType: formData.rateType,
        invoiceDate: formData.invoiceDate,
        documentType,
        receivedAmount: receivedAmt,
        paymentMode: formData.paymentMode,
        remarks: formData.remarks,
        products: formData.products.map((item) => ({
          product: item.product,
          length: Number(item.length),
          width: Number(item.width),
          quantity: Number(item.quantity),
          selectedRate: Number(item.selectedRate),
          gstRate: gstEnabled ? Number(item.gstRate) : 0,
        })),
      });

      toast.success(`${gstEnabled ? "GST Invoice" : "Order"} updated successfully`);
      navigate(`/invoices/print/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getDataAndInvoice = async () => {
      try {
        setPageLoading(true);
        const [customerRes, productRes, invoiceRes] = await Promise.all([
          API.get("/farmers"),
          API.get("/products"),
          API.get(`/invoices/${id}`),
        ]);

        const invoiceData = invoiceRes.data.invoice;
        setCustomers(customerRes.data.farmers || []);
        setProductsList(productRes.data.products || []);

        if (invoiceData) {
          const nextDocumentType =
            invoiceData.documentType ||
            (invoiceData.gstEnabled ? "gst_invoice" : "order");

          setDocumentType(nextDocumentType);
          setFormData({
            farmerId: invoiceData.farmer?._id || invoiceData.farmer,
            rateType: invoiceData.rateType || "Rate A",
            invoiceDate: invoiceData.createdAt
              ? invoiceData.createdAt.slice(0, 10)
              : today,
            billingType: invoiceData.billingType || "credit",
            receivedAmount: invoiceData.paidAmount ?? invoiceData.receivedAmount ?? "",
            paymentMode: invoiceData.paymentMode || "cash",
            remarks: invoiceData.remarks || "",
            products:
              invoiceData.products?.map((item) => ({
                product: item.product?._id || item.product,
                length: item.length || "",
                width: item.width || "",
                quantity: item.quantity || 1,
                selectedRate: item.selectedRate || "",
                gstRate: item.gstRate || "",
              })) || [{ ...emptyItem }],
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice edit data");
      } finally {
        setPageLoading(false);
      }
    };

    getDataAndInvoice();
  }, [id]);

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm font-bold text-slate-600">Loading edit form...</p>
        </div>
      </div>
    );
  }

  const accentActive = gstEnabled
    ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
    : "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200";
  const accentHover = gstEnabled ? "hover:border-blue-300" : "hover:border-orange-300";
  const accentSubmit = gstEnabled
    ? "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
    : "bg-orange-500 shadow-orange-200 hover:bg-orange-600";
  const accentHighlight = gstEnabled ? "text-blue-700" : "text-orange-600";
  const accentIcon = gstEnabled ? "text-blue-600" : "text-orange-500";
  const accentAddBtn = gstEnabled
    ? "bg-slate-950 hover:bg-blue-700"
    : "bg-slate-950 hover:bg-orange-600";
  const accentRowBorder = gstEnabled ? "border-blue-100" : "border-orange-100";
  const accentBadgeBg = gstEnabled ? "bg-blue-600" : "bg-orange-500";

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={`/invoices/print/${id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Invoice
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Edit {gstEnabled ? "GST Invoice" : "Order"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            Edit customer, date, payment, items — everything. Ledger recalculates after saving.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Receipt size={20} className={accentIcon} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Grand Total
            </p>
            <p className={`text-2xl font-black ${accentHighlight}`}>
              ₹{summary.grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">

        {/* ── 1. Bill Type ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
            Bill Type
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDocumentType("gst_invoice")}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-sm font-black transition ${
                gstEnabled ? accentActive : `border-slate-200 bg-white text-slate-600 hover:border-blue-300`
              }`}
            >
              <FileCheck size={20} />
              GST Invoice
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("order")}
              className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-sm font-black transition ${
                !gstEnabled ? accentActive : `border-slate-200 bg-white text-slate-600 hover:border-orange-300`
              }`}
            >
              <FileText size={20} />
              Non-GST Order
            </button>
          </div>
        </section>

        {/* ── 2. Customer, Billing Type & Date ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
            Customer & Date
          </p>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Customer
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.farmerId}
                  onChange={(event) => handleCustomerChange(event.target.value)}
                  className="input-field pl-10"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.village}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Billing Type
              </label>
              <select
                value={formData.billingType}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, billingType: event.target.value }))
                }
                className="input-field"
              >
                <option value="credit">Credit</option>
                <option value="cash">Cash</option>
                <option value="wholesale">Wholesale</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Invoice Date
              </label>
              <div className="relative">
                <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, invoiceDate: event.target.value }))
                  }
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>

          {/* Rate Type */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-600">
              Rate Type
            </p>
            <div className="grid grid-cols-3 gap-2 sm:max-w-md">
              {RATE_TYPES.map((rateType) => (
                <button
                  type="button"
                  key={rateType}
                  onClick={() => handleRateTypeChange(rateType)}
                  className={`rounded-2xl border px-3 py-3 text-xs font-black transition ${
                    formData.rateType === rateType
                      ? accentActive
                      : `border-slate-200 bg-white text-slate-600 ${accentHover}`
                  }`}
                >
                  {rateType}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Payment Details ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
            Payment Details
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Amount Received */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Amount Received (₹)
              </label>
              <div className="relative">
                <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.receivedAmount}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, receivedAmount: event.target.value }))
                  }
                  className="input-field pl-10"
                  disabled={formData.billingType === "cash"}
                />
              </div>
              {formData.billingType === "cash" && (
                <p className="text-[11px] font-semibold text-green-600">
                  ✓ Cash — full amount collected
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Payment Mode
              </label>
              <div className="relative">
                <Wallet size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.paymentMode}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, paymentMode: event.target.value }))
                  }
                  className="input-field pl-10"
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Balance Due */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                Balance Due
              </label>
              <div
                className={`flex h-[46px] items-center gap-2 rounded-2xl border px-4 font-black ${
                  balanceDue > 0
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                {balanceDue > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                ₹{balanceDue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="mt-5 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-600">
              Remarks / Notes
            </label>
            <div className="relative">
              <MessageSquare size={18} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={2}
                placeholder="Add any notes, special instructions, or order details..."
                value={formData.remarks}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, remarks: event.target.value }))
                }
                className="input-field resize-none pl-10 pt-2.5 leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* ── 4. Items ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Items</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Size in feet · Qty in pieces · Amount auto-calculates live
              </p>
            </div>
            <button
              type="button"
              onClick={addProductRow}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition ${accentAddBtn}`}
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.products.map((item, index) => {
              const product = productsList.find((entry) => entry._id === item.product);
              const line = calculateLine(item, product, formData.rateType, gstEnabled);
              const hasContent = line.sqFt > 0;

              return (
                <div
                  key={index}
                  className={`rounded-2xl border-2 bg-slate-50 p-4 transition-colors ${
                    hasContent ? accentRowBorder : "border-slate-200"
                  }`}
                >
                  {/* Row header */}
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white ${accentBadgeBg}`}
                    >
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProductRow(index)}
                      disabled={formData.products.length === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Main fields row */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                        Product
                      </label>
                      <select
                        value={item.product}
                        onChange={(event) =>
                          handleProductChange(index, "product", event.target.value)
                        }
                        className="input-field bg-white"
                        required
                      >
                        <option value="">Select Product</option>
                        {productsList.map((productItem) => (
                          <option key={productItem._id} value={productItem._id}>
                            {productItem.productName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <NumberField
                      label="Width (ft)"
                      value={item.width}
                      onChange={(value) => handleProductChange(index, "width", value)}
                    />
                    <NumberField
                      label="Length (ft)"
                      value={item.length}
                      onChange={(value) => handleProductChange(index, "length", value)}
                    />
                    <NumberField
                      label="Qty (pcs)"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(value) => handleProductChange(index, "quantity", value)}
                    />

                    {/* Rate */}
                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                        Rate / Sq.Ft
                      </label>
                      <div className="relative">
                        <IndianRupee size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.selectedRate}
                          onChange={(event) =>
                            handleProductChange(index, "selectedRate", event.target.value)
                          }
                          className="input-field bg-white pl-7"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* GST rate (only for GST invoices) */}
                  {gstEnabled && (
                    <div className="mt-3 lg:max-w-xs">
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                        GST %
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.gstRate}
                        onChange={(event) =>
                          handleProductChange(index, "gstRate", event.target.value)
                        }
                        className="input-field bg-white"
                      />
                    </div>
                  )}

                  {/* Live calculation stats */}
                  <div
                    className={`mt-4 grid gap-3 rounded-2xl bg-white p-3 ${
                      gstEnabled ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sq. Ft.</p>
                      <p className={`mt-2 flex items-center gap-1 text-sm font-black ${accentHighlight}`}>
                        <Ruler size={13} className={accentIcon} />
                        {line.sqFt.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Size</p>
                      <p className="mt-2 text-sm font-black text-slate-800">
                        {line.width > 0 && line.length > 0 ? `${line.width} × ${line.length}` : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</p>
                      <p className="mt-2 text-sm font-black text-slate-950">
                        ₹{line.baseAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {gstEnabled && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">GST Amt</p>
                        <p className="mt-2 text-sm font-black text-slate-800">
                          ₹{line.gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Line Total</p>
                      <p className={`mt-2 text-sm font-black ${accentHighlight}`}>
                        ₹{line.lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. Summary & Submit ── */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Invoice Summary
              </p>
              <div className="space-y-1 text-sm font-semibold text-slate-700">
                <div className="flex gap-4">
                  <span>Subtotal</span>
                  <span className="font-black text-slate-900">
                    ₹{summary.subTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {gstEnabled && (
                  <div className="flex gap-4">
                    <span>Total GST</span>
                    <span className="font-black text-slate-900">
                      ₹{summary.totalGST.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className={`flex gap-4 text-base font-black ${accentHighlight}`}>
                  <span>Grand Total</span>
                  <span>₹{summary.grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                {formData.billingType !== "cash" && toNumber(formData.receivedAmount) > 0 && (
                  <>
                    <div className="flex gap-4 text-green-700">
                      <span>Received</span>
                      <span className="font-black">
                        ₹{toNumber(formData.receivedAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex gap-4 text-red-700">
                      <span>Balance Due</span>
                      <span className="font-black">
                        ₹{balanceDue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || summary.grandTotal <= 0}
              className={`inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-base font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${accentSubmit}`}
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

const NumberField = ({ label, value, onChange, min = "0", step = "0.01" }) => (
  <div className="lg:col-span-2">
    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
      {label}
    </label>
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input-field bg-white"
      required
    />
  </div>
);

export default EditInvoice;
