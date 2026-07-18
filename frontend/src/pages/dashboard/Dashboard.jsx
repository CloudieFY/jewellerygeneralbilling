import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const isSameDay = (value, date) => {
  if (!value) return false;
  const target = new Date(value);
  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
};

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [accountingSummary, setAccountingSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        const [invoiceRes, customerRes, reportRes] = await Promise.all([
          API.get("/invoices"),
          API.get("/farmers"),
          API.get("/reports/dashboard"),
        ]);

        setInvoices(invoiceRes.data.invoices || []);
        setCustomers(customerRes.data.farmers || []);
        setAccountingSummary(reportRes.data.dashboard || {});
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  const dashboard = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const todayInvoices = invoices.filter((invoice) =>
      isSameDay(invoice.createdAt, today)
    );
    const monthlyInvoices = invoices.filter((invoice) => {
      const createdAt = new Date(invoice.createdAt);
      return createdAt.getMonth() === month && createdAt.getFullYear() === year;
    });

    const topCustomers = [...customers]
      .sort((a, b) => Number(b.dueAmount || 0) - Number(a.dueAmount || 0))
      .slice(0, 5);

    return {
      todaySales: todayInvoices.reduce(
        (total, invoice) => total + Number(invoice.grandTotal || 0),
        0
      ),
      todayOrders: todayInvoices.length,
      monthlySales: monthlyInvoices.reduce(
        (total, invoice) => total + Number(invoice.grandTotal || 0),
        0
      ),
      totalGSTInvoices: invoices.filter(
        (invoice) => invoice.documentType === "gst_invoice" || (invoice.documentType == null && invoice.gstEnabled !== false)
      ).length,
      totalOrders: invoices.filter(
        (invoice) => invoice.documentType === "order"
      ).length,
      recentInvoices: invoices.slice(0, 6),
      topCustomers,
      totalSales: Number(accountingSummary.totalSales || 0),
      cashSales: Number(accountingSummary.cashSales || 0),
      creditSales: Number(accountingSummary.creditSales || 0),
      outstandingAmount: Number(accountingSummary.outstandingAmount || 0),
      totalReceipts: Number(accountingSummary.totalReceipts || 0),
      totalCustomers: Number(accountingSummary.totalCustomers || customers.length),
    };
  }, [accountingSummary, customers, invoices]);

  const cards = [
    {
      label: "Total Sales",
      value: formatCurrency(dashboard.totalSales || dashboard.monthlySales),
      icon: <IndianRupee size={22} />,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Cash Sales",
      value: formatCurrency(dashboard.cashSales),
      icon: <CheckCircle2 size={22} />,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Credit Sales",
      value: formatCurrency(dashboard.creditSales),
      icon: <TrendingUp size={22} />,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Outstanding",
      value: formatCurrency(dashboard.outstandingAmount),
      icon: <Clock3 size={22} />,
      color: "bg-orange-50 text-orange-700",
    },
    {
      label: "Total Receipts",
      value: formatCurrency(dashboard.totalReceipts),
      icon: <Receipt size={22} />,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Customers",
      value: dashboard.totalCustomers,
      icon: <Users size={22} />,
      color: "bg-slate-100 text-slate-700",
    },
  ];

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-10 text-center">
        <h1 className="text-xl font-black text-red-800">Unable to Load</h1>
        <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Dashboard
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Business Overview
        </h1>
        <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
          A quick view of sales, orders, outstanding payments, and recent
          invoices.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <FileText size={20} className="text-blue-600" />
              Recent Invoices
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.recentInvoices.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-slate-400">
                No invoices yet.
              </p>
            ) : (
              dashboard.recentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-black text-slate-950">
                      #{invoice.invoiceNumber}
                    </p>
                    <p className="text-sm font-semibold text-slate-500">
                      {invoice.farmer?.name}
                    </p>
                  </div>
                  <p className="font-black text-blue-700">
                    {formatCurrency(invoice.grandTotal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Users size={20} className="text-blue-600" />
              Top Customers
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dashboard.topCustomers.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-slate-400">
                No customers yet.
              </p>
            ) : (
              dashboard.topCustomers.map((customer) => (
                <div
                  key={customer._id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-black text-slate-950">{customer.name}</p>
                    <p className="text-sm font-semibold text-slate-500">
                      {customer.defaultRateType || "Rate A"}
                    </p>
                  </div>
                  <p className="font-black text-blue-700">
                    {formatCurrency(customer.dueAmount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
