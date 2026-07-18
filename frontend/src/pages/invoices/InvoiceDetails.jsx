import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileCheck, FileText, Pencil, Printer, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { formatCurrency, toNumber } from "../../utils/billing";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const getInvoiceAndSettings = async () => {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          API.get(`/invoices/${id}`),
          API.get("/settings"),
        ]);
        setInvoice(invoiceRes.data.invoice);
        setSettings(settingsRes.data.settings);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getInvoiceAndSettings();
  }, [id]);

  const handleDelete = async () => {
    if (!invoice) return;
    const isGst = invoice?.documentType !== "order" && invoice?.gstEnabled !== false;
    const docLabel = isGst ? "Invoice" : "Order";

    if (!window.confirm(`Delete this ${docLabel.toLowerCase()} record?`)) return;

    try {
      await API.delete(`/invoices/${id}`);
      toast.success(`${docLabel} deleted`);
      navigate("/invoices");
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${docLabel.toLowerCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Invoice not found.
      </div>
    );
  }

  const isGst = invoice?.documentType !== "order" && invoice?.gstEnabled !== false;
  const docLabel = isGst ? "Invoice" : "Order";
  const paymentStatusLabel =
    invoice.paymentStatus === "paid"
      ? "Paid"
      : invoice.paymentStatus === "partially_paid"
        ? "Partially Paid"
        : "Unpaid";

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/invoices"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Invoices
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-950">
              {docLabel} #{invoice.invoiceNumber}
            </h1>
            {isGst ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                <FileCheck size={13} />
                GST Invoice
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                <FileText size={13} />
                Non-GST Order
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/invoices/edit/${invoice._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-white shadow-lg shadow-amber-200 hover:bg-amber-600"
          >
            <Pencil size={18} />
            Edit {docLabel}
          </Link>

          <Link
            to={`/invoices/print/${invoice._id}`}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-black text-white shadow-lg hover:opacity-90 ${
              isGst
                ? "bg-blue-600 shadow-blue-200"
                : "bg-orange-500 shadow-orange-200"
            }`}
          >
            <Printer size={18} />
            Print / Send PDF
          </Link>

          {user?.role !== "operator" && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-lg shadow-red-200 hover:bg-red-700"
            >
              <Trash2 size={18} />
              Delete {docLabel}
            </button>
          )}
        </div>
      </div>

      <section className={`grid grid-cols-1 gap-5 ${isGst && settings ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {isGst && settings && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Company Details
            </p>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              {settings.shopName || "Company Name"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {settings.shopAddress || "Company Address"}
            </p>
            <p className="text-sm font-semibold text-slate-600">
              Phone: {settings.shopMobile || "-"}
            </p>
            <p className="text-sm font-semibold text-slate-600">
              Email: {settings.shopEmail || "-"}
            </p>
            {settings.gstNumber && (
              <p className="mt-2 text-xs font-black uppercase tracking-widest text-blue-600">
                GSTIN: {settings.gstNumber}
              </p>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Customer
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            {invoice.farmer?.name}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {invoice.farmer?.mobileNumber}
          </p>
          <p className="text-sm font-semibold text-slate-600">
            {invoice.farmer?.village}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Grand Total
          </p>
          <h2 className="mt-3 text-2xl font-black text-blue-700">
            {formatCurrency(invoice.grandTotal)}
          </h2>
          <p className="mt-2 text-sm font-black text-slate-700">
            Status: {paymentStatusLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            Paid: {formatCurrency(invoice.paidAmount)}
          </p>
          <p className="text-sm font-semibold text-red-600">
            Balance: {formatCurrency(invoice.balanceDue)}
          </p>
          {isGst && (
            <p className="mt-1 text-sm font-semibold text-slate-600">
              GST {formatCurrency(invoice.totalGST)}
            </p>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-black text-slate-950">{docLabel} Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Product",
                  ...(isGst ? ["HSN Code"] : []),
                  "Length",
                  "Width",
                  "Sq Ft",
                  "Rate / Sq Ft",
                  "Quantity",
                  ...(isGst ? ["GST"] : []),
                  "Amount",
                ].map((heading) => (
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
              {invoice.products?.map((item) => {
                const sqFt =
                  item.sqFt ?? toNumber(item.length) * toNumber(item.width);
                const amount =
                  item.baseAmount ??
                  sqFt * toNumber(item.selectedRate) * toNumber(item.quantity, 1);
                const hsnCode = item.hsnCode || item.product?.hsnCode || "-";

                return (
                  <tr key={item._id || item.product?._id}>
                    <td className="px-5 py-4 font-bold text-slate-950">
                      {item.product?.productName || item.product}
                    </td>
                    {isGst && (
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        {hsnCode}
                      </td>
                    )}
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {item.length || 0} ft
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {item.width || 0} ft
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {sqFt}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {formatCurrency(item.selectedRate)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">
                      {item.quantity}
                    </td>
                    {isGst && (
                      <td className="px-5 py-4 font-semibold text-slate-600">
                        {item.gstRate}% ({formatCurrency(item.gstAmount)})
                      </td>
                    )}
                    <td className="px-5 py-4 font-black text-slate-950">
                      {formatCurrency(amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ml-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subTotal)}</span>
          </div>
          {isGst && (
            <>
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>CGST</span>
                <span>{formatCurrency(toNumber(invoice.totalGST) / 2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>SGST</span>
                <span>{formatCurrency(toNumber(invoice.totalGST) / 2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Total GST</span>
                <span>{formatCurrency(invoice.totalGST)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-950">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvoiceDetails;
