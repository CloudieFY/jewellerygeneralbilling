import { Link } from "react-router-dom";
import {
  Calendar,
  Eye,
  IndianRupee,
  Printer,
  Receipt,
  User,
  FileCheck,
  FileText,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "../../utils/billing";

const getPaymentStatusMeta = (status) => {
  if (status === "paid") {
    return {
      label: "Paid",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "partially_paid") {
    return {
      label: "Partially Paid",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Unpaid",
    className: "bg-red-50 text-red-700",
  };
};

const InvoiceTable = ({ invoices }) => {
  return (
    <>
      {/* Desktop Table Layout (visible on md screens and up) */}
      <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Invoice / Order",
                  "Type",
                  "Customer",
                  "Grand Total",
                  "Status",
                  "Date",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 ${
                      heading === "Actions" ? "text-right" : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Receipt size={40} />
                      <p className="text-sm font-bold">No invoices found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices?.map((invoice) => {
                  const isGst =
                    invoice.documentType !== "order" &&
                    invoice.gstEnabled !== false;
                  const statusMeta = getPaymentStatusMeta(invoice.paymentStatus);

                  return (
                    <tr key={invoice._id} className="transition hover:bg-slate-50">
                      {/* Invoice Number */}
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-955">
                          #{invoice.invoiceNumber}
                        </p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {isGst ? "GST Invoice" : "Order"}
                        </p>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-5">
                        {isGst ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                            <FileCheck size={13} />
                            GST Invoice
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                            <FileText size={13} />
                            Order
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {invoice.farmer?.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {invoice.farmer?.mobileNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1 text-lg font-black text-slate-950">
                          <IndianRupee size={16} className="text-blue-600" />
                          {Number(invoice.grandTotal || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        {isGst && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            GST {formatCurrency(invoice.totalGST)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                        {Number(invoice.balanceDue || 0) > 0 && (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Due {formatCurrency(invoice.balanceDue)}
                          </p>
                        )}
                      </td>

                      {/* Date only */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/invoices/${invoice._id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                            title="View"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/invoices/edit/${invoice._id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition hover:bg-amber-600 hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </Link>
                          <Link
                            to={`/invoices/print/${invoice._id}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-blue-600"
                            title="Print"
                          >
                            <Printer size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List Layout (visible on screens below md) */}
      <div className="space-y-4 md:hidden">
        {invoices?.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm animate-fade-in">
            <Receipt size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold">No invoices found.</p>
          </div>
        ) : (
          invoices?.map((invoice) => {
            const isGst =
              invoice.documentType !== "order" &&
              invoice.gstEnabled !== false;
            const statusMeta = getPaymentStatusMeta(invoice.paymentStatus);

            return (
              <div
                key={invoice._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-blue-200 transition"
              >
                {/* Header: Number & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-950">
                      #{invoice.invoiceNumber}
                    </span>
                  </div>
                  {isGst ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                      <FileCheck size={12} />
                      GST
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-black text-orange-700">
                      <FileText size={12} />
                      Order
                    </span>
                  )}
                </div>

                <span className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-black uppercase tracking-widest ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>

                {/* Details: Customer & Date Grid */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-xs">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Customer
                    </span>
                    <span className="block font-bold text-slate-800 truncate">
                      {invoice.farmer?.name}
                    </span>
                    <span className="block font-medium text-slate-500 mt-0.5">
                      {invoice.farmer?.mobileNumber}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Date
                    </span>
                    <span className="block font-bold text-slate-700 mt-0.5">
                      {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Footer: Grand Total & Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Grand Total
                    </span>
                    <span className="flex items-center text-base font-black text-slate-950">
                      <IndianRupee size={14} className="text-blue-600" />
                      {Number(invoice.grandTotal || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Actions buttons row */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/invoices/${invoice._id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition active:bg-blue-600 active:text-white"
                      title="View"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/invoices/edit/${invoice._id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition active:bg-amber-600 active:text-white"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </Link>
                    <Link
                      to={`/invoices/print/${invoice._id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white transition active:bg-blue-600"
                      title="Print"
                    >
                      <Printer size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default InvoiceTable;
