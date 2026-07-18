import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import TransactionTable from "../../components/transactions/TransactionTable";
import { formatCurrency } from "../../utils/billing";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTransactions = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/transactions/history");
      setTransactions(
        (data.transactions || []).filter(
          (transaction) => transaction.type === "payment"
        )
      );
    } catch (error) {
      toast.error("Failed to load payments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTransactions();
  }, []);

  const deleteTransaction = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;

    try {
      await API.delete(`/transactions/${id}`);
      toast.success("Payment record deleted");
      getTransactions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete payment");
    }
  };

  const stats = useMemo(() => {
    const payments = transactions
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

    return {
      total: payments,
      payments,
    };
  }, [transactions]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Receipts
          </p>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            Payments
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Record receipt vouchers from customers and delete receipt records
            when needed.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/transactions/payment"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
          >
            <ArrowDownLeft size={18} />
            New Receipt
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {[
          {
            label: "Receipt Vouchers",
            value: transactions.length,
            icon: <CreditCard size={22} />,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Total Receipts",
            value: formatCurrency(stats.total),
            icon: <IndianRupee size={22} />,
            color: "bg-blue-50 text-blue-700",
          },
        ].map((card) => (
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

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Loading payments...
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          deleteTransaction={deleteTransaction}
        />
      )}
    </div>
  );
};

export default Transactions;
