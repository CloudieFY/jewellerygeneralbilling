import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  Receipt,
  Users,
} from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const reportTabs = [
  { key: "outstanding", label: "Outstanding Report" },
  { key: "sales", label: "Sales Register" },
  { key: "receipts", label: "Receipt Register" },
  { key: "purchases", label: "Purchase Register" },
  { key: "payments", label: "Payment Register" },
  { key: "dayBook", label: "Day Book" },
  { key: "cashBook", label: "Cash Book" },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState("outstanding");
  const [dashboard, setDashboard] = useState({});
  const [reports, setReports] = useState({
    outstanding: [],
    sales: [],
    receipts: [],
    purchases: [],
    payments: [],
    dayBook: [],
    cashBook: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [
          dashboardRes,
          outstandingRes,
          salesRes,
          receiptRes,
          purchaseRes,
          paymentRes,
          dayBookRes,
          cashBookRes,
        ] = await Promise.all([
          API.get("/reports/dashboard"),
          API.get("/reports/outstanding"),
          API.get("/reports/sales-register"),
          API.get("/reports/receipt-register"),
          API.get("/reports/purchase-register"),
          API.get("/reports/payment-register"),
          API.get("/reports/day-book"),
          API.get("/reports/cash-book"),
        ]);

        setDashboard(dashboardRes.data.dashboard || {});
        setReports({
          outstanding: outstandingRes.data.rows || [],
          sales: salesRes.data.rows || [],
          receipts: receiptRes.data.rows || [],
          purchases: purchaseRes.data.rows || [],
          payments: paymentRes.data.rows || [],
          dayBook: dayBookRes.data.rows || [],
          cashBook: cashBookRes.data.rows || [],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const totals = useMemo(() => {
    return {
      totalSales: Number(dashboard.totalSales || 0),
      cashSales: Number(dashboard.cashSales || 0),
      creditSales: Number(dashboard.creditSales || 0),
      outstanding: Number(dashboard.outstandingAmount || dashboard.pendingPayments || 0),
      receipts: Number(dashboard.totalReceipts || 0),
      customers: Number(dashboard.totalCustomers || dashboard.totalFarmers || 0),
    };
  }, [dashboard]);

  const activeRows = reports[activeTab] || [];

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading accounting reports...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Accounting Reports
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Retail Accounting
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
          Customer ledger and vendor ledger are maintained automatically from
          invoices, receipts, purchases, and payments.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Total Sales", value: formatCurrency(totals.totalSales), icon: <IndianRupee size={21} /> },
          { label: "Cash Sales", value: formatCurrency(totals.cashSales), icon: <Receipt size={21} /> },
          { label: "Credit Sales", value: formatCurrency(totals.creditSales), icon: <FileText size={21} /> },
          { label: "Outstanding", value: formatCurrency(totals.outstanding), icon: <Users size={21} /> },
          { label: "Receipts", value: formatCurrency(totals.receipts), icon: <CreditCard size={21} /> },
          { label: "Customers", value: totals.customers, icon: <Users size={21} /> },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {card.icon}
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <ReportTable title={reportTabs.find((tab) => tab.key === activeTab)?.label} rows={activeRows} type={activeTab} />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <InfoPanel
          icon={<BookOpen size={20} />}
          title="Customer Ledger"
          text="Open any customer from Customers page to view, print, and save PDF statement with debit, credit, and running balance."
        />
        <InfoPanel
          icon={<CalendarDays size={20} />}
          title="Vendor Ledger"
          text="Vendor purchase and payment history is maintained from Vendors page. Purchase credits vendor ledger; payment debits vendor ledger."
        />
      </section>
    </div>
  );
};

const InfoPanel = ({ icon, title, text }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
      {icon}
    </div>
    <h2 className="text-xl font-black text-slate-950">{title}</h2>
    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
  </div>
);

const ReportTable = ({ title, rows, type }) => {
  const columns = getColumns(type);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row._id || `${type}-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 text-sm font-semibold text-slate-700">
                      {formatCell(row[column.key], column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const getColumns = (type) => {
  if (type === "outstanding") {
    return [
      { key: "customerName", label: "Customer" },
      { key: "mobile", label: "Mobile" },
      { key: "outstanding", label: "Outstanding", money: true },
      { key: "lastInvoiceDate", label: "Last Invoice", date: true },
      { key: "lastPaymentDate", label: "Last Payment", date: true },
    ];
  }

  if (type === "sales") {
    return [
      { key: "date", label: "Date", date: true },
      { key: "invoiceNo", label: "Invoice No." },
      { key: "customerName", label: "Customer" },
      { key: "paymentType", label: "Payment Type" },
      { key: "taxable", label: "Taxable", money: true },
      { key: "gst", label: "GST", money: true },
      { key: "total", label: "Total", money: true },
      { key: "status", label: "Status" },
    ];
  }

  if (type === "receipts") {
    return [
      { key: "date", label: "Date", date: true },
      { key: "voucherNo", label: "Voucher No." },
      { key: "customerName", label: "Customer" },
      { key: "invoiceNo", label: "Invoice No." },
      { key: "paymentMode", label: "Mode" },
      { key: "amount", label: "Amount", money: true },
      { key: "remarks", label: "Remarks" },
    ];
  }

  if (type === "purchases") {
    return [
      { key: "date", label: "Date", date: true },
      { key: "voucherNo", label: "Voucher No." },
      { key: "billNo", label: "Bill No." },
      { key: "vendorName", label: "Vendor" },
      { key: "amount", label: "Amount", money: true },
      { key: "remarks", label: "Remarks" },
    ];
  }

  if (type === "payments") {
    return [
      { key: "date", label: "Date", date: true },
      { key: "voucherNo", label: "Voucher No." },
      { key: "vendorName", label: "Vendor / Expense" },
      { key: "paymentMode", label: "Mode" },
      { key: "amount", label: "Amount", money: true },
      { key: "remarks", label: "Remarks" },
    ];
  }

  return [
    { key: "date", label: "Date", date: true },
    { key: "voucherType", label: "Voucher Type" },
    { key: "voucherNo", label: "Voucher No." },
    { key: "party", label: "Party" },
    { key: "debit", label: "Debit", money: true },
    { key: "credit", label: "Credit", money: true },
    { key: "runningBalance", label: "Balance", money: true },
    { key: "remarks", label: "Remarks" },
  ];
};

const formatCell = (value, column) => {
  if (column.date) {
    return value ? new Date(value).toLocaleDateString("en-IN") : "-";
  }
  if (column.money) {
    return Number(value || 0) ? formatCurrency(value) : "-";
  }
  return value || "-";
};

export default Reports;
