import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const PRINT_STYLE = `
.vendor-statement-pdf .vendor-print-hidden {
  display: none !important;
}

@media print {
  @page { size: A4 portrait; margin: 12mm; }
  body * { visibility: hidden !important; }
  .vendor-print-area, .vendor-print-area * { visibility: visible !important; }
  .vendor-print-area {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: #fff !important;
    box-shadow: none !important;
  }
  .vendor-print-hidden { display: none !important; }
}
`;

const VendorDetails = () => {
  const { id } = useParams();
  const statementRef = useRef(null);
  const [vendor, setVendor] = useState(null);
  const [summary, setSummary] = useState({});
  const [statement, setStatement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "vendor-statement-print-css";
    styleTag.textContent = PRINT_STYLE;
    document.head.appendChild(styleTag);
    return () => document.getElementById("vendor-statement-print-css")?.remove();
  }, []);

  useEffect(() => {
    const loadLedger = async () => {
      try {
        const { data } = await API.get(`/vendors/ledger/${id}`);
        setVendor(data.vendor);
        setSummary(data.summary || {});
        setStatement(data.statement || []);
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [id]);

  const savePdf = async () => {
    if (!statementRef.current || pdfBusy) return;
    setPdfBusy(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      statementRef.current.classList.add("vendor-statement-pdf");
      await html2pdf()
        .set({
          margin: 8,
          filename: `Vendor-Statement-${vendor?.vendorName || "vendor"}.pdf`.replace(/[\\/:*?"<>|]/g, "-"),
          image: { type: "jpeg", quality: 1 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(statementRef.current)
        .save();
    } finally {
      statementRef.current?.classList.remove("vendor-statement-pdf");
      setPdfBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
        Loading vendor ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="vendor-print-hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/vendors" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600">
          <ArrowLeft size={16} />
          Back to Vendors
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
            <Printer size={16} />
            Print Statement
          </button>
          <button onClick={savePdf} disabled={pdfBusy} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">
            <Download size={16} />
            {pdfBusy ? "Saving..." : "Save PDF"}
          </button>
        </div>
      </div>

      <div ref={statementRef} className="vendor-print-area space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Vendor Ledger
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            {vendor?.vendorName || "-"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Mobile: {vendor?.mobile || "-"} | GSTIN: {vendor?.gstNumber || "-"}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { label: "Total Purchase", value: formatCurrency(summary.totalPurchase) },
            { label: "Total Paid", value: formatCurrency(summary.totalPaid) },
            { label: "Outstanding", value: formatCurrency(summary.outstandingBalance) },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Statement</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Date", "Voucher Type", "Voucher No.", "Bill No.", "Debit", "Credit", "Balance", "Remarks"].map((heading) => (
                    <th key={heading} className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statement.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-5 py-12 text-center text-sm font-bold text-slate-400">
                      No ledger entries found.
                    </td>
                  </tr>
                ) : (
                  statement.map((entry) => (
                    <tr key={entry._id}>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">{new Date(entry.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-4 text-sm font-black capitalize text-blue-700">{entry.voucherType}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">{entry.voucherNo}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">{entry.billNo}</td>
                      <td className="px-5 py-4 text-sm font-black text-emerald-700">{entry.debit ? formatCurrency(entry.debit) : "-"}</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-950">{entry.credit ? formatCurrency(entry.credit) : "-"}</td>
                      <td className="px-5 py-4 text-sm font-black text-blue-700">{formatCurrency(entry.runningBalance)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">{entry.remarks || "-"}</td>
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

export default VendorDetails;
