import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileCheck,
  FilePlus2,
  FileText,
  LayoutList,
  Receipt,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import InvoiceTable from "../../components/invoices/InvoicesTable";
import { formatCurrency } from "../../utils/billing";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all" | "gst_invoice" | "order"
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });

  const getInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/invoices");
      const invoiceList = data.invoices || [];

      setInvoices(invoiceList);
      setStats({
        totalAmount: invoiceList.reduce(
          (acc, invoice) => acc + Number(invoice.grandTotal || 0),
          0
        ),
        gstAmount: invoiceList
          .filter((invoice) => invoice.documentType === "gst_invoice" || (invoice.documentType == null && invoice.gstEnabled !== false))
          .reduce((acc, invoice) => acc + Number(invoice.grandTotal || 0), 0),
        orderAmount: invoiceList
          .filter((invoice) => invoice.documentType === "order")
          .reduce((acc, invoice) => acc + Number(invoice.grandTotal || 0), 0),
      });
    } catch (error) {
      toast.error("Failed to load invoices");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const byType = invoices.filter((inv) => {
      if (filterType === "all") return true;
      if (filterType === "gst_invoice") {
        return inv.documentType === "gst_invoice" || (inv.documentType == null && inv.gstEnabled !== false);
      }
      if (filterType === "order") {
        return inv.documentType === "order";
      }
      return true;
    });

    const search = keyword.trim().toLowerCase();
    if (!search) return byType;

    return byType.filter((invoice) => {
      const isGst =
        invoice.documentType !== "order" && invoice.gstEnabled !== false;

      return [
        invoice.invoiceNumber,
        isGst ? "GST Invoice" : "Order",
        invoice.farmer?.name,
        invoice.farmer?.mobileNumber,
        invoice.paymentStatus,
        invoice.grandTotal,
        invoice.balanceDue,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [filterType, invoices, keyword]);

  const gstCount = invoices.filter(
    (inv) => inv.documentType === "gst_invoice" || (inv.documentType == null && inv.gstEnabled !== false)
  ).length;
  const orderCount = invoices.filter((inv) => inv.documentType === "order").length;

  const cards = [
    {
      label: "Total Sales",
      value: stats.totalAmount,
      icon: <Receipt size={22} />,
      color: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "GST Invoices Total",
      value: stats.gstAmount,
      icon: <FileCheck size={22} />,
      color: "text-blue-700 bg-blue-50",
    },
    {
      label: "Orders Total",
      value: stats.orderAmount,
      icon: <FileText size={22} />,
      color: "text-orange-700 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Invoices & Orders
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Invoice List
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            GST Invoices and Non-GST Orders — all billing records in one place.
          </p>
        </div>

        <Link
          to="/billing"
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
        >
          <FilePlus2 size={20} />
          Create Invoice / Order
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div
              className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}
            >
              {card.icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
            filterType === "all"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
          }`}
        >
          <LayoutList size={16} />
          All ({invoices.length})
        </button>

        <button
          onClick={() => setFilterType("gst_invoice")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
            filterType === "gst_invoice"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
          }`}
        >
          <FileCheck size={16} />
          GST Invoices ({gstCount})
        </button>

        <button
          onClick={() => setFilterType("order")}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-black transition ${
            filterType === "order"
              ? "border-orange-500 bg-orange-500 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
          }`}
        >
          <FileText size={16} />
          Orders ({orderCount})
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search invoices by number, customer, mobile, or status"
            className="input-field pl-11 pr-12"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Clear invoice search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Loading invoices...
        </div>
      ) : (
        <InvoiceTable invoices={filteredInvoices} />
      )}
    </div>
  );
};

export default Invoices;
