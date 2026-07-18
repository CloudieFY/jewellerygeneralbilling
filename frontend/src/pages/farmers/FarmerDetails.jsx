import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  Download,
  IndianRupee,
  Phone,
  Printer,
  Receipt,
  User,
} from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const STATEMENT_PRINT_STYLE = `
.statement-pdf-render .statement-print-hidden {
  display: none !important;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 12mm;
  }

  body * {
    visibility: hidden !important;
  }

  .statement-print-area,
  .statement-print-area * {
    visibility: visible !important;
  }

  .statement-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }

  .statement-print-hidden {
    display: none !important;
  }
}
`;

const CustomerDetails = () => {
  const { id } = useParams();
  const statementRef = useRef(null);
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalPurchase: 0,
    totalPaid: 0,
    outstandingBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [filters, setFilters] = useState({ search: "", fromDate: "", toDate: "", type: "all", item: "all", minAmount: "", maxAmount: "" });

  const itemOptions = useMemo(
    () => [...new Set(history.flatMap((entry) => entry.itemNames || []))].sort(),
    [history]
  );

  const filteredHistory = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return history.filter((entry) => {
      const entryDate = new Date(entry.date || entry.createdAt);
      const amount = Number(entry.debit || entry.credit || 0);
      const matchesSearch = !query || [entry.voucherNo, entry.invoiceNo, entry.description, ...(entry.itemNames || [])]
        .some((value) => String(value || "").toLowerCase().includes(query));

      return matchesSearch
        && (!filters.fromDate || entryDate >= new Date(`${filters.fromDate}T00:00:00`))
        && (!filters.toDate || entryDate <= new Date(`${filters.toDate}T23:59:59.999`))
        && (filters.type === "all" || entry.type === filters.type)
        && (filters.item === "all" || entry.itemNames?.includes(filters.item))
        && (filters.minAmount === "" || amount >= Number(filters.minAmount))
        && (filters.maxAmount === "" || amount <= Number(filters.maxAmount));
    });
  }, [filters, history]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ search: "", fromDate: "", toDate: "", type: "all", item: "all", minAmount: "", maxAmount: "" });

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "customer-statement-print-css";
    styleTag.textContent = STATEMENT_PRINT_STYLE;
    document.head.appendChild(styleTag);

    return () => {
      document.getElementById("customer-statement-print-css")?.remove();
    };
  }, []);

  useEffect(() => {
    const getHistory = async () => {
      try {
        const { data } = await API.get(`/transactions/ledger/${id}`);
        setCustomer(data.farmer);
        setHistory((data.statement || data.ledger || []).filter((item) => item.type !== "interest"));
        setSummary(data.summary || {});
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getHistory();
  }, [id]);

  const getStatementFilename = () =>
    `Customer-Statement-${customer?.name || "customer"}.pdf`.replace(/[\\/:*?"<>|]/g, "-");

  const handleDownloadStatement = async () => {
    if (!statementRef.current || pdfBusy) return;

    setPdfBusy(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      statementRef.current.classList.add("statement-pdf-render");
      await html2pdf()
        .set({
          margin: 8,
          filename: getStatementFilename(),
          image: { type: "jpeg", quality: 1 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(statementRef.current)
        .save();
    } finally {
      statementRef.current?.classList.remove("statement-pdf-render");
      setPdfBusy(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading customer...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="statement-print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/farmers"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Customers
        </Link>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrintStatement}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
          >
            <Printer size={16} />
            Print Statement
          </button>
          <button
            type="button"
            onClick={handleDownloadStatement}
            disabled={pdfBusy}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} />
            {pdfBusy ? "Saving..." : "Save PDF"}
          </button>
        </div>
      </div>

      <div ref={statementRef} className="statement-print-area space-y-6 rounded-3xl bg-white/0">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Customer Statement
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">
          {customer?.name || "-"}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Mobile: {customer?.mobileNumber || "-"} | Area: {customer?.village || "-"}
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <User size={22} />
            </div>
            {Number(summary.outstandingBalance || customer?.dueAmount || 0) > 0 && (
              <Link
                to={`/transactions/payment?customerId=${customer?._id}`}
                className="statement-print-hidden inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700"
              >
                <ArrowDownLeft size={16} />
                Receive Payment
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-950">
            {customer?.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Phone size={15} />
            {customer?.mobileNumber}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Area: {customer?.village}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Default Rate Type: {customer?.defaultRateType || "Rate A"}
          </p>
        </div>

        {[
          {
            label: "Total Orders",
            value: Number(summary.totalOrders || customer?.totalOrders || 0),
            icon: <Receipt size={22} />,
          },
          {
            label: "Total Purchase",
            value: formatCurrency(summary.totalPurchase || customer?.totalPurchase),
            icon: <IndianRupee size={22} />,
          },
          {
            label: "Total Paid",
            value: formatCurrency(summary.totalPaid || customer?.totalPaid),
            icon: <ArrowDownLeft size={22} />,
          },
          {
            label: "Outstanding Balance",
            value: formatCurrency(summary.outstandingBalance ?? customer?.dueAmount),
            icon: <IndianRupee size={22} />,
            highlight: true,
          },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {card.icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className={`mt-2 text-2xl font-black ${card.highlight ? "text-red-600" : "text-slate-950"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-950">
            Customer Statement
          </h2>
          <div className="statement-print-hidden mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Invoice, voucher, item..." className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500" />
            <input type="date" value={filters.fromDate} onChange={(event) => updateFilter("fromDate", event.target.value)} aria-label="From date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500" />
            <input type="date" value={filters.toDate} onChange={(event) => updateFilter("toDate", event.target.value)} aria-label="To date" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500" />
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500">
              <option value="all">All transaction types</option>
              <option value="credit">Invoices / Credit</option>
              <option value="payment">Payments</option>
              <option value="opening">Opening balance</option>
            </select>
            <select value={filters.item} onChange={(event) => updateFilter("item", event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500">
              <option value="all">All items</option>
              {itemOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <input type="number" min="0" value={filters.minAmount} onChange={(event) => updateFilter("minAmount", event.target.value)} placeholder="Minimum amount" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500" />
            <input type="number" min="0" value={filters.maxAmount} onChange={(event) => updateFilter("maxAmount", event.target.value)} placeholder="Maximum amount" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500" />
            <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Clear Filters</button>
          </div>
          <p className="statement-print-hidden mt-3 text-xs font-bold text-slate-500">
            Showing {filteredHistory.length} of {history.length} entries
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Date", "Voucher Type", "Voucher No.", "Invoice No.", "Debit", "Credit", "Balance"].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm font-semibold text-slate-400"
                  >
                    No statement entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {new Date(item.date || item.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-sm font-black capitalize text-blue-700">
                      {item.voucherType || item.type || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {item.voucherNo || "-"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                      {item.invoiceNo || "-"}
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-slate-950">
                      {item.debit ? formatCurrency(item.debit) : "-"}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-emerald-700">
                      {item.credit ? formatCurrency(item.credit) : "-"}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-blue-700">
                      {formatCurrency(item.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  );
};

export default CustomerDetails;
