import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  FilePlus2,
  Plus,
  Receipt,
  Ruler,
  Trash2,
  User,
  UserPlus,
  FileCheck,
  FileText,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import InvoicePreview from "../../components/billing/InvoicePreview";
import CustomerForm from "../../components/farmers/FarmerForm";
import {
  calculateInvoiceTotals,
  calculateLine,
  formatCurrency,
  roundWeight,
} from "../../utils/billing";

const emptyItem = {
  product: "",
  grossWeight: "", netWeight: "", stoneWeight: "",
  quantity: 1,
  purity: "22K / 916",
  selectedRate: "",
  rateUnit: "per_gram",
  gstRate: "",
  wastagePercent: 0, makingChargeType: "per_gram", makingCharge: "",
  stoneValue: "", stoneValueType: "per_gram", hallmarkCharge: "", discount: "",
};

const today = new Date().toISOString().slice(0, 10);

const Billing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);

  // "gst_invoice" = GST Invoice (GST-INV-XXXX)
  // "order"       = Non-GST Order / Kaccha Bill (ORD-XXXX)
  const [documentType, setDocumentType] = useState("gst_invoice");

  const gstEnabled = documentType === "gst_invoice";

  const [formData, setFormData] = useState({
    farmerId: "",
    invoiceNumber: "",
    rateType: "Rate A",
    invoiceDate: today,
    receivedAmount: "",
    paymentMode: "cash",
    products: [{ ...emptyItem }],
  });

  // Enter key navigation inside billing forms
  const handleFormKeyDown = (event) => {
    if (event.key === "Enter") {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "SELECT") &&
        active.type !== "submit"
      ) {
        event.preventDefault();
        const formControls = Array.from(
          event.currentTarget.querySelectorAll("input, select, button[type='submit']")
        ).filter(
          (el) => !el.disabled && el.type !== "hidden" && el.tabIndex !== -1
        );
        const index = formControls.indexOf(active);
        if (index > -1 && index < formControls.length - 1) {
          const next = formControls[index + 1];
          next.focus();
          if (next.tagName === "INPUT" && next.select) {
            next.select();
          }
        }
      }
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const [customerRes, productRes] = await Promise.all([
          API.get("/farmers"),
          API.get("/products"),
        ]);

        setCustomers(customerRes.data.farmers || []);
        setProductsList(productRes.data.products || []);
        const linkedCustomerId = searchParams.get("customerId");
        const linkedType = searchParams.get("type");
        if (linkedCustomerId) {
          setFormData((previous) => ({ ...previous, farmerId: linkedCustomerId }));
        }
        if (linkedType === "estimate") setDocumentType("order");
      } catch (error) {
        console.error(error);
        toast.error("Failed to load billing data");
      } finally {
        setPageLoading(false);
      }
    };

    getData();
  }, [searchParams]);


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

  const withProductRate = (item, rateType = formData.rateType) => {
    void rateType;
    return item;
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((entry) => entry._id === customerId);
    const nextRateType = customer?.defaultRateType || "Rate A";

    setFormData((prev) => ({
      ...prev,
      farmerId: customerId,
      rateType: nextRateType,
      products: prev.products.map((item) =>
        withProductRate(item, nextRateType)
      ),
    }));
  };

  const createCustomer = async (customerData) => {
    try {
      setCustomerSaving(true);
      const { data } = await API.post("/farmers", customerData);
      const createdCustomer = data.farmer;

      if (!createdCustomer?._id) {
        throw new Error("Customer created but response was incomplete");
      }

      const nextRateType = createdCustomer.defaultRateType || "Rate A";

      setCustomers((prev) => [
        createdCustomer,
        ...prev.filter((customer) => customer._id !== createdCustomer._id),
      ]);
      setFormData((prev) => ({
        ...prev,
        farmerId: createdCustomer._id,
        rateType: nextRateType,
        products: prev.products.map((item) =>
          withProductRate(item, nextRateType)
        ),
      }));
      setCustomerFormOpen(false);
      toast.success("Customer added and selected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    } finally {
      setCustomerSaving(false);
    }
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
            selectedRate: "",
            gstRate: product?.gstRate ?? "", grossWeight: "",
            netWeight: "", stoneWeight: "", wastagePercent: 0,
            makingChargeType: "per_gram", makingCharge: "", stoneValue: "",
            stoneValueType: "per_gram", hallmarkCharge: "",
          };
        }

        if (field === "grossWeight" || field === "stoneWeight") {
          return {
            ...updated,
            netWeight: roundWeight(Math.max(
              Number(updated.grossWeight || 0) - Number(updated.stoneWeight || 0),
              0,
            )),
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.farmerId) {
      toast.error("Please select a customer");
      return;
    }

    const invalidItem = formData.products.some((item) => {
      const line = calculateLine(
        item,
        productsList.find((product) => product._id === item.product),
        formData.rateType
      );

      return !item.product || line.netWeight <= 0 || line.rate <= 0 || line.quantity <= 0;
    });

    if (invalidItem) {
      toast.error("Select a product and enter valid net weight, metal rate, and quantity");
      return;
    }

    const receivedAmount = Number(formData.receivedAmount || 0);
    if (receivedAmount < 0 || receivedAmount > summary.grandTotal) {
      toast.error("Received amount must be between zero and grand total");
      return;
    }

    try {
      setLoading(true);
      await API.post("/invoices", {
        farmerId: formData.farmerId,
        invoiceNumber: formData.invoiceNumber,
        rateType: formData.rateType,
        invoiceDate: formData.invoiceDate,
        documentType: documentType,
        gstEnabled: gstEnabled,
        receivedAmount,
        paymentMode: formData.paymentMode,
        products: formData.products.map((item) => ({
          product: item.product,
          purity: item.purity,
          grossWeight: Number(item.grossWeight), netWeight: Number(item.netWeight),
          stoneWeight: Number(item.stoneWeight), wastagePercent: Number(item.wastagePercent),
          makingChargeType: item.makingChargeType, makingCharge: Number(item.makingCharge),
          stoneValue: Number(item.stoneValue), stoneValueType: item.stoneValueType,
          hallmarkCharge: Number(item.hallmarkCharge),
          discount: Number(item.discount),
          quantity: Number(item.quantity),
          selectedRate: Number(item.selectedRate),
          rateUnit: item.rateUnit || "per_gram",
          gstRate: gstEnabled ? Number(item.gstRate) : 0,
        })),
      });

      const label = gstEnabled ? "GST Invoice" : "Estimate Order";
      toast.success(`${label} created successfully`);
      navigate("/invoices");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeys = (e) => {
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "a") {
          e.preventDefault();
          addProductRow();
          toast.success("New product row added");
        } else if (key === "g") {
          e.preventDefault();
          setDocumentType("gst_invoice");
          toast.success("Switched to GST Invoice");
        } else if (key === "o") {
          e.preventDefault();
          setDocumentType("order");
          toast.success("Switched to Estimate Order");
        } else if (key === "f") {
          e.preventDefault();
          const dropdown = document.getElementById("customer-select-dropdown");
          if (dropdown) dropdown.focus();
        }
      }

      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
    // Keep this listener synced to the active billing form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, documentType, loading]);

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl bg-white px-8 py-6 text-sm font-bold text-slate-600 shadow-sm">
          Loading billing form...
        </div>
      </div>
    );
  }

  const isGst = documentType === "gst_invoice";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
            JewelFlow — Jewellery Billing Software
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {isGst ? "Create GST Invoice" : "Create Estimate Order"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
            Jewellery value is calculated from net weight, metal rate, wastage, making charges and stones.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Receipt size={20} className="text-blue-600" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Grand Total
            </p>
            <p className="text-lg font-black text-slate-950">
              Rs {summary.grandTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleFormKeyDown}
          className="space-y-6 xl:col-span-7"
        >
          {/* ── Document Type Selector ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
              Bill Type
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocumentType("gst_invoice")}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-sm font-black transition ${
                  isGst
                    ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                <FileCheck size={20} />
                <div className="text-left">
                  <p className="font-black">GST Invoice</p>
                  <p className={`text-[10px] font-semibold ${isGst ? "text-blue-100" : "text-slate-400"}`}>
                    GST-INV-XXXX series
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocumentType("order")}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-sm font-black transition ${
                  !isGst
                    ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200"
                    : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
                }`}
              >
                <FileText size={20} />
                <div className="text-left">
                  <p className="font-black">Estimate Order</p>
                  <p className={`text-[10px] font-semibold ${!isGst ? "text-orange-100" : "text-slate-400"}`}>
                    ORD-XXXX series
                  </p>
                </div>
              </button>
            </div>

            {isGst ? (
              <p className="mt-3 text-xs font-semibold text-blue-600">
                ✅ GST Invoice — HSN code, CGST/SGST breakup included in printout
              </p>
            ) : (
              <p className="mt-3 text-xs font-semibold text-orange-600">
                Estimate Order — No GST columns. Clean client estimate.
              </p>
            )}
          </section>

          {/* ── Customer / Rate / Date ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Customer
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomerFormOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                  >
                    <UserPlus size={14} />
                    Add
                  </button>
                </div>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    id="customer-select-dropdown"
                    value={formData.farmerId}
                    onChange={(event) =>
                      handleCustomerChange(event.target.value)
                    }
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
                  {isGst ? "Invoice" : "Estimate"} Date
                </label>
                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(event) =>
                      setFormData({ ...formData, invoiceDate: event.target.value })
                    }
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">
                  {isGst ? "Invoice" : "Estimate"} Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(event) => setFormData((previous) => ({ ...previous, invoiceNumber: event.target.value }))}
                  placeholder="Blank = automatic number"
                  className="input-field"
                />
                <p className="text-[10px] font-semibold text-slate-400">Duplicate numbers are not allowed.</p>
              </div>
            </div>
          </section>

          {/* ── Invoice Items ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {isGst ? "Invoice" : "Estimate"} Items
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Verify weights and charges. The payable amount updates automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={addProductRow}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {formData.products.map((item, index) => {
                const product = productsList.find(
                  (entry) => entry._id === item.product
                );
                const line = calculateLine(item, product, formData.rateType, gstEnabled);

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                      <div className="lg:col-span-3">
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

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                          Gross Wt. (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.grossWeight}
                          onChange={(event) =>
                            handleProductChange(index, "grossWeight", event.target.value)
                          }
                          className="input-field bg-white"
                          required
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                          Stone Wt. (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.stoneWeight}
                          onChange={(event) =>
                            handleProductChange(index, "stoneWeight", event.target.value)
                          }
                          className="input-field bg-white"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                          Net Wt. (g)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.netWeight}
                          className="input-field bg-white"
                          required
                          readOnly
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-600">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            handleProductChange(index, "quantity", event.target.value)
                          }
                          className="input-field bg-white"
                          required
                        />
                      </div>

                      <div className="flex items-end justify-end lg:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {product && (
                      <p className="mt-3 text-xs font-bold text-amber-700">
                        Available inventory: {Number(product.inventoryWeight || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })} g
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Purity
                        <input type="text" value={item.purity} onChange={(event) => handleProductChange(index, "purity", event.target.value)} placeholder="22K / 916" className="input-field bg-white normal-case" />
                      </label>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Gold / Metal Rate
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.selectedRate}
                            onChange={(event) => handleProductChange(index, "selectedRate", event.target.value)}
                            className="input-field bg-white flex-1"
                            required
                          />
                          <select
                            value={item.rateUnit || "per_gram"}
                            onChange={(event) => handleProductChange(index, "rateUnit", event.target.value)}
                            className="input-field bg-white px-1 text-[10px] w-[60px] text-center normal-case shrink-0"
                          >
                            <option value="per_gram">/ g</option>
                            <option value="per_10_gram">/ 10g</option>
                            <option value="per_kg">/ kg</option>
                          </select>
                        </div>
                      </div>
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Making Charge Type
                        <select value={item.makingChargeType} onChange={(event) => handleProductChange(index, "makingChargeType", event.target.value)} className="input-field bg-white normal-case">
                          <option value="per_gram">Per gram</option>
                          <option value="percent">Percentage (%)</option>
                          <option value="per_piece">Per piece</option>
                          <option value="fixed">Fixed price</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Making Charge
                        <input type="number" min="0" step="0.01" value={item.makingCharge} onChange={(event) => handleProductChange(index, "makingCharge", event.target.value)} className="input-field bg-white" />
                      </label>
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Stone Charge Type
                        <select value={item.stoneValueType} onChange={(event) => handleProductChange(index, "stoneValueType", event.target.value)} className="input-field bg-white normal-case">
                          <option value="per_gram">Per gram</option>
                          <option value="per_piece">Per piece</option>
                          <option value="fixed">Fixed price</option>
                        </select>
                      </label>
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Stone / Diamond Charge
                        <input type="number" min="0" step="0.01" value={item.stoneValue} onChange={(event) => handleProductChange(index, "stoneValue", event.target.value)} className="input-field bg-white" />
                      </label>
                      <label className="space-y-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Hallmark Charge (Internal)
                        <input type="number" min="0" step="0.01" value={item.hallmarkCharge} onChange={(event) => handleProductChange(index, "hallmarkCharge", event.target.value)} className="input-field bg-white" />
                      </label>
                    </div>

                    <div className={`mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 ${isGst ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Net Metal Wt.
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-base font-black text-slate-950">
                          <Ruler size={14} className="text-blue-600" />
                          {line.netWeight.toLocaleString("en-IN")} g
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Metal Value
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">{formatCurrency(line.metalValue)}</p>
                      </div>

                      {/* GST% — only for GST Invoice */}
                      {isGst && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            GST %
                          </p>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.gstRate}
                            onChange={(event) =>
                              handleProductChange(index, "gstRate", event.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Amount
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          Rs {line.baseAmount.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Line Total
                        </p>
                        <p className="mt-2 text-sm font-black text-blue-700">
                          Rs {line.lineTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-black text-slate-950">Payment Details</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-black uppercase tracking-widest text-slate-600">
                Received Amount
                <input
                  type="number"
                  min="0"
                  max={summary.grandTotal}
                  step="0.01"
                  value={formData.receivedAmount}
                  onChange={(event) => setFormData((previous) => ({ ...previous, receivedAmount: event.target.value }))}
                  placeholder="0.00"
                  className="input-field bg-white normal-case"
                />
              </label>
              <label className="space-y-2 text-xs font-black uppercase tracking-widest text-slate-600">
                Payment Mode
                <select
                  value={formData.paymentMode}
                  onChange={(event) => setFormData((previous) => ({ ...previous, paymentMode: event.target.value }))}
                  className="input-field bg-white normal-case"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold">
              <span className="text-slate-600">Balance Due</span>
              <span className="text-slate-950">{formatCurrency(Math.max(summary.grandTotal - Number(formData.receivedAmount || 0), 0))}</span>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="text-sm font-semibold text-slate-600">
              Subtotal Rs {summary.subTotal.toLocaleString("en-IN")}
              {isGst && (
                <span className="ml-2">
                  + GST Rs {summary.totalGST.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || summary.grandTotal <= 0}
              className={`inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isGst
                  ? "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
                  : "bg-orange-500 shadow-orange-200 hover:bg-orange-600"
              }`}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <FilePlus2 size={20} />
                  {isGst ? "Create GST Invoice" : "Create Estimate Order"}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </section>
        </form>

        <aside className="xl:col-span-5">
          <InvoicePreview
            formData={formData}
            customers={customers}
            productsList={productsList}
            summary={summary}
            documentType={documentType}
            gstEnabled={gstEnabled}
          />
        </aside>
      </div>

      {customerFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-6">
          <div className="w-full max-w-4xl">
            <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-base font-black text-slate-950">
                  Add Customer
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  After saving, the customer will be selected in this bill.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomerFormOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Close customer form"
              >
                <X size={18} />
              </button>
            </div>
            <CustomerForm onSubmit={createCustomer} loading={customerSaving} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
