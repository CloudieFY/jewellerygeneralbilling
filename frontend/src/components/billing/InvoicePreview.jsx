import { FileCheck, FileText, MapPin, Phone } from "lucide-react";
import { calculateLine, formatCurrency } from "../../utils/billing";

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

  const customerDisplayName = formData.customerName || selectedCustomer?.name || (formData.farmerId === "walk_in" ? "Walk-in Customer" : "");
  const customerMobile = formData.customerMobile || selectedCustomer?.mobileNumber || "";
  const customerVillage = formData.customerVillage || selectedCustomer?.village || "";

  return (
    <div className="xl:sticky xl:top-8 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white shadow-lg shadow-amber-100/60">
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-800 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                isGst ? "bg-amber-100 text-amber-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isGst ? <FileCheck size={22} /> : <FileText size={22} />}
            </div>
            <h2 className="text-2xl font-black text-amber-50">Jewellery Invoice</h2>
            <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${
              isGst ? "text-amber-200" : "text-yellow-200"
            }`}>
              {isGst ? "GST Invoice Preview" : "Estimate Order Preview"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-amber-200">
              Date
            </p>
            <p className="mt-1 text-sm font-bold text-white">{invoiceDate}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Customer
          </p>
          {customerDisplayName ? (
            <div className="mt-3 space-y-1">
              <p className="text-lg font-black text-slate-950">
                {customerDisplayName}
              </p>
              {customerMobile && (
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Phone size={14} /> {customerMobile}
                </p>
              )}
              {customerVillage && (
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <MapPin size={14} /> {customerVillage}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-400">
              Select or type customer details to preview.
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
                    Purity / HUID
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Weight (g)
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
                          {product.purity || "-"}{product.huid ? ` / ${product.huid}` : ""}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          <span className="block">Net {line.netWeight}</span>
                          <span className="block text-xs text-slate-400">Gross {line.grossWeight}</span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                          {formatCurrency(line.rate)}/g
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
            <span>Total Net Weight</span>
            <span className="font-black text-slate-900">{summary.totalNetWeight ? `${summary.totalNetWeight} g` : "0 g"}</span>
          </div>
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
          <div className="flex items-center justify-between text-sm font-bold text-slate-600">
            <span>Round Off</span>
            <span>{formatCurrency(summary.roundOff)}</span>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-amber-800">
                Grand Total
              </span>
              <span className="text-2xl font-black tabular-nums text-amber-950">
                {formatCurrency(summary.grandTotal)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvoicePreview;
