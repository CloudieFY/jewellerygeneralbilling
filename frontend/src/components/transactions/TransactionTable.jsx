import {
  ArrowDownLeft,
  Calendar,
  CreditCard,
  FileText,
  Trash2,
  User,
} from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/billing";

const TransactionTable = ({ transactions, deleteTransaction }) => {
  const { user } = useContext(AuthContext);

  const visibleTransactions = (transactions || []).filter(
    (transaction) => transaction.type === "payment"
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
          <FileText size={18} className="text-blue-600" />
          Recent Payment Entries
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-white">
            <tr>
              {["Customer", "Type", "Amount", "Mode", "Date", "Notes", "Actions"].map(
                (heading) => (
                  <th
                    key={heading}
                    className={`px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 ${
                      heading === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-5 py-14 text-center text-sm font-semibold text-slate-400"
                >
                  No payment entries found.
                </td>
              </tr>
            ) : (
              visibleTransactions.map((item) => (
                <tr key={item._id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <User size={16} />
                      </div>
                      <p className="font-bold text-slate-900">
                        {item.farmer?.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black uppercase tracking-widest ${
                        item.type === "payment"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <ArrowDownLeft size={12} />
                      Payment
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black text-slate-950">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold capitalize text-slate-600">
                      <CreditCard size={14} />
                      {item.paymentMode || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Calendar size={14} />
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                    {item.description || "-"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {user?.role !== "operator" && (
                      <button
                        type="button"
                        onClick={() => deleteTransaction(item._id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
