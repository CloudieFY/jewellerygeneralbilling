import { FileCheck, FileText, MapPin, Phone } from "lucide-react";
import { calculateLine, formatCurrency, toNumber } from "../../utils/billing";

const InvoicePreview = ({
  formData,
  customers,
  productsList,
  summary,
  documentType = "gst_invoice",
  gstEnabled = true,
}) => {
  const selectedCustomer = customers.find(
    (customer) => customer._id === formData.farmerId
  );
  const invoiceDate = formData.invoiceDate
    ? new Date(formData.invoiceDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  const isGst = documentType === "gst_invoice";
  const receivedAmount =
    formData.billingType === "cash"
      ? summary.grandTotal
      : Math.min(toNumber(formData.receivedAmount), summary.grandTotal);
  const balanceDue = Math.max(summary.grandTotal - receivedAmount, 0);

  return (
    <div className="xl:sticky xl:top-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isGst ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
              }`}
            >
              {isGst ? <FileCheck size={22} /> : <FileText size={22} />}
            </div>
            <h2 className="text-2xl font-black text-slate-950">Cloudify</h2>
            <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${
              isGst ? "text-blue-600" : "text-orange-600"
            }`}>
              {isGst ? "GST Invoice Preview" : "Order Preview (Kaccha Bill)"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Date
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">{invoiceDate}</p>
            <p className={`mt-3 text-xs font-black uppercase tracking-widest ${
              isGst ? "text-blue-600" : "text-orange-600"
            }`}>
              {formData.rateType}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Customer
          </p>
          {selectedCustomer ? (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-black text-slate-950">
                {selectedCustomer.name}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Phone size={14} /> {selectedCustomer.mobileNumber}
              </p>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <MapPin size={14} /> {selectedCustomer.village}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-400">
              Select a customer to preview invoice details.
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Size
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Sq Ft
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Qty
                  </th>
                  {isGst && (
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      GST
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.products.filter((item) => item.product).length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={isGst ? "7" : "6"}
                      className="px-4 py-10 text-center text-sm font-semibold text-slate-400"
                    >
                      No items added yet.
                    </td>
                  </tr>
                ) : (
                  formData.products.map((item, index) => {
                    const product = productsList.find(
                      (entry) => entry._id === item.product
                    );

                    if (!product) return null;

                    const line = calculateLine(
                      item,
                      product,
                      formData.rateType,
                      gstEnabled
                    );

                    return (
                      <tr key={index}>
                        <td className="px-4 py-4 text-sm font-bold text-slate-900">
                          {product.productName}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {line.length} x {line.width} ft
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {line.sqFt}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {formatCurrency(line.rate)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {line.quantity}
                        </td>
                        {isGst && (
                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                            {line.gstRate}%
                          </td>
                        )}
                        <td className="px-4 py-4 text-right text-sm font-black text-slate-950">
                          {formatCurrency(line.baseAmount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ml-auto w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between text-sm font-bold text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(summary.subTotal)}</span>
          </div>
          {isGst && (
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>GST Total</span>
              <span>{formatCurrency(summary.totalGST)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-black uppercase tracking-widest ${isGst ? "text-blue-600" : "text-orange-600"}`}>
                Grand Total
              </span>
              <span className="text-2xl font-black text-slate-950">
                {formatCurrency(summary.grandTotal)}
              </span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>Payment Type</span>
              <span className="capitalize">{formData.billingType || "cash"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-600">
              <span>Received</span>
              <span>{formatCurrency(receivedAmount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-black">
              <span>Balance Due</span>
              <span className={balanceDue > 0 ? "text-red-600" : "text-emerald-700"}>
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoicePreview;
