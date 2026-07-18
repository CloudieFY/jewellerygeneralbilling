import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, MessageCircle, Pencil, Printer } from "lucide-react";
import API from "../../services/api";
import { toNumber } from "../../utils/billing";
import { numberToWords } from "../../utils/numberToWords";

const PAGE_ITEM_LIMIT = 14;
const COMPANY_DISPLAY_NAME = "Walia's Creative";

const FALLBACK_SHOP = {
  shopName: COMPANY_DISPLAY_NAME,
  businessLine:
    "Eco Solvent Print, Flex Banners, Hoardings, Glow Signs, Inshop Branding, Acrylic LED Boards.",
  shopAddress: "Kelkar Para, Station Road, Raipur (C.G.)",
  shopMobile: "+91 9981111199",
  shopEmail: "waliascreative@gmail.com",
  gstNumber: "22AEYPA8034J1ZC",
  accountHolderName: "Walia's Creative Design & Prints",
  bankName: "Punjab National Bank",
  bankBranch: "Budhapara Branch, Raipur (C.G.)",
  accountNumber: "0926050051323",
  ifscCode: "PUNB0092620",
  paymentUpiId: "ahluwaliaharmansingh@okicici",
};

const ORDER_PAYMENT_QR = "/payment-qr-crop.jpeg";
const ORDER_LOGO_NAME = "Walia's Creative";
const ORDER_SERVICES = ["Solvent", "Eco-Solvent", "Glow Sign Board", "Signage Solutions"];
const GST_COLUMN_WIDTHS = [6, 26, 10, 8, 12, 10, 8, 10, 10];
const ORDER_COLUMN_WIDTHS = [6, 32, 14, 12, 12, 12, 12];
const MIN_COLUMN_WIDTH = 4;
const DESIGN_EDITABLE_SELECTOR = [
  // GST Invoice elements
  ".invoice-document-heading",
  ".invoice-title p",
  ".invoice-business-line",
  ".invoice-contact-line",
  ".invoice-buyer-label",
  ".invoice-buyer-name",
  ".invoice-buyer-details div",
  ".invoice-meta-row strong",
  ".invoice-table th",
  ".invoice-table td",
  ".invoice-section-title",
  ".invoice-terms li",
  ".invoice-footer-cell:nth-child(2) > div",
  ".invoice-total-row span",
  ".invoice-amount-words span",
  ".invoice-amount-words strong",
  ".invoice-signature-for",
  ".invoice-signature-company",
  ".invoice-signature > div:last-child",
  // Non-GST Order elements
  ".order-logo",
  ".order-checklist li",
  ".order-address-line",
  ".order-remarks",
  ".order-signature",
  ".order-bottom-row > div:first-child",
  ".order-payment-upi",
].join(",");

const A4_PRINT_STYLE = `
.invoice-shell {
  background: #eef2f7;
}

.invoice-scroll {
  width: 100%;
  overflow-x: auto;
  padding: 0 0 16px;
}

.invoice-document {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 210mm;
}

.invoice-page {
  width: 210mm;
  height: 297mm;
  padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm);
  box-sizing: border-box;
  background: #ffffff;
  color: #111827;
  font-family: "Segoe UI", Arial, sans-serif;
  font-weight: 700;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
  page-break-after: always;
  break-after: page;
}

.invoice-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

.invoice-sheet {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1.4px solid #111827;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.invoice-document.pdf-render {
  display: block;
  width: 210mm;
  min-width: 210mm;
  max-width: 210mm;
  gap: 0;
  align-items: stretch;
  margin: 0;
  padding: 0;
  background: #ffffff;
}

.invoice-document.pdf-render .invoice-page {
  width: 210mm;
  height: 297mm;
  margin: 0;
  padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm);
  box-shadow: none;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}

.invoice-document.pdf-render .invoice-page:last-child {
  page-break-after: auto;
  break-after: auto;
}

.invoice-top-line {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  border-bottom: 1.2px solid #111827;
  padding: 4px 9px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.3;
}

.invoice-document-heading {
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
}

.invoice-title {
  display: grid;
  grid-template-columns: 46mm minmax(0, 1fr) 18mm;
  align-items: center;
  min-height: 28mm;
  padding: 3px 10px 5px;
  text-align: center;
}

.invoice-document.capture-render [data-design-editable="true"],
.invoice-document.capture-render .design-selected,
.invoice-document.capture-render .invoice-brand-mark,
.invoice-document.capture-render [data-design-locked="true"],
.invoice-document.capture-render [data-design-movable="true"] {
  outline: none !important;
}

.invoice-document.capture-render .invoice-column-resizer {
  display: none !important;
}

.invoice-brand-mark {
  width: 34mm;
  height: 20mm;
  margin: 0 auto;
  display: block;
  object-fit: contain;
}

.invoice-title-copy {
  min-width: 0;
}

.invoice-title h1 {
  margin: 0 0 1px;
  font-family: Arial, sans-serif;
  font-size: 38px;
  line-height: 1;
  letter-spacing: -1.5px;
  text-transform: none;
}

.invoice-title p {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.25;
}

.invoice-business-line {
  border-top: 1.2px solid #111827;
  border-bottom: 1.2px solid #111827;
  background: #ffffff;
  padding: 5px 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.invoice-contact-line {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8mm;
  padding: 6px 14px;
  text-align: center;
  border-bottom: 1.2px solid #111827;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
}

.invoice-party-grid {
  display: grid;
  grid-template-columns: 58% 42%;
  border-bottom: 1.2px solid #111827;
  font-size: 13px;
}

.invoice-buyer-box,
.invoice-meta-box {
  min-height: 30mm;
  padding: 8px 10px;
}

.invoice-buyer-box {
  border-right: 1.2px solid #111827;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: start;
  column-gap: 8px;
}

.invoice-buyer-name {
  margin: 0;
  text-align: left;
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
}

.invoice-muted-label {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.invoice-buyer-label {
  display: inline-block;
  padding-top: 2px;
  text-align: left;
  font-size: 17px;
  font-weight: 500;
  text-transform: none;
}

.invoice-buyer-details {
  margin-top: 4px;
  line-height: 1.4;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.invoice-buyer-content {
  min-width: 0;
}

.invoice-meta-row {
  display: grid;
  grid-template-columns: 45% 55%;
  gap: 8px;
  padding: 5px 0;
  align-items: center;
  font-size: 13px;
  line-height: 1.35;
}

.invoice-meta-row strong:first-child {
  font-weight: 900;
}

.invoice-meta-row strong:last-child {
  font-size: 13.5px;
  font-weight: 900;
}

.invoice-page-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.invoice-table-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.invoice-table {
  width: 100%;
  flex: 1;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 11.5px;
  height: 100%;
}

.invoice-table th {
  background: #ffffff;
  border-right: 1px solid #111827;
  border-bottom: 1.2px solid #111827;
  padding: 6px 5px;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
  position: relative;
}

.invoice-column-resizer {
  position: absolute;
  z-index: 8;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
}

.invoice-column-resizer::after {
  content: "";
  position: absolute;
  top: 15%;
  bottom: 15%;
  left: 4px;
  width: 2px;
  border-radius: 2px;
  background: #2563eb;
  opacity: 0.65;
}

.invoice-table th:last-child,
.invoice-table td:last-child {
  border-right: 0;
}

.invoice-table td {
  height: 7.2mm;
  border-right: 1px solid #111827;
  padding: 4px 5px;
  vertical-align: middle;
  line-height: 1.28;
}

.invoice-table .amount-cell,
.invoice-table .rate-cell {
  text-align: center;
}

.invoice-table .center-cell {
  text-align: center;
}

.invoice-table .numeric-highlight {
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.invoice-table .gst-rate-cell,
.invoice-table .amount-highlight {
  font-size: 12.5px;
  font-weight: 900;
  white-space: nowrap;
}

.invoice-table .product-cell {
  font-weight: 800;
  line-height: 1.25;
  word-break: break-word;
}

.invoice-table tfoot td {
  background: #ffffff;
  border-top: 1.2px solid #111827;
  border-bottom: 1.2px solid #111827;
  font-weight: 900;
  text-align: center;
}

.invoice-filler-row td {
  height: auto;
  border-bottom: 0;
}

.invoice-continued {
  margin-top: 6px;
  color: #64748b;
  font-size: 10.5px;
  font-weight: 700;
  text-align: right;
}

.invoice-footer {
  margin-top: 0;
  border-top: 1.2px solid #111827;
  flex: 0 0 auto;
}

.invoice-footer-grid {
  display: grid;
  border-bottom: 1.2px solid #111827;
}

.invoice-footer-cell {
  min-height: 38mm;
  border-right: 1.2px solid #111827;
  padding: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.invoice-footer-cell:last-child {
  border-right: 0;
}

.invoice-section-title {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 900;
  text-decoration: underline;
  text-transform: uppercase;
}

.invoice-tax-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 7px;
  font-size: 12px;
}

.invoice-tax-table th,
.invoice-tax-table td {
  border: 1px solid #111827;
  padding: 6px 5px;
  text-align: center;
  vertical-align: middle;
  line-height: 1.35;
  white-space: nowrap;
}

.invoice-tax-table th {
  background: #f3f6fb;
  font-size: 12.5px;
  font-weight: 900;
}

.invoice-tax-table td {
  font-size: 12.5px;
  font-weight: 800;
}

.invoice-terms {
  margin: 0;
  padding-left: 0;
  list-style-position: inside;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.invoice-terms li {
  margin-bottom: 4px;
  line-height: 1.35;
}

.invoice-total-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 0;
  font-size: 12.5px;
  font-weight: 900;
  line-height: 1.3;
}

.invoice-total-row span:first-child {
  text-transform: uppercase;
}

.invoice-total-row span:last-child {
  font-size: 13px;
}

.invoice-total-row.net {
  margin-top: 5px;
  border-top: 1px solid #111827;
  padding-top: 6px;
  color: #991b1b;
  font-size: 15px;
}

.invoice-total-row.net span:last-child {
  font-size: 16.5px;
}

.invoice-signature-row {
  display: grid;
  grid-template-columns: 1fr 230px;
  align-items: end;
  gap: 14px;
  padding: 10px 14px 8px;
  min-height: 35mm;
}

.invoice-amount-words {
  align-self: end;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.invoice-signature {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.25;
}

.invoice-signature-for {
  font-size: 13px;
  font-weight: 900;
}

.invoice-signature-company {
  font-size: 13px;
  font-weight: 900;
}

.invoice-signature img {
  display: block;
  height: 68px;
  max-width: 210px;
  object-fit: contain;
  margin: 2px auto 3px;
  mix-blend-mode: multiply;
}

.invoice-payment-qr {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  height: 100%;
}

.invoice-payment-qr img {
  width: 84px;
  height: 84px;
  border: 1px solid #111827;
  object-fit: contain;
}

.invoice-payment-qr strong {
  display: block;
  font-size: 12.5px;
  text-transform: uppercase;
}

.invoice-payment-qr span {
  display: block;
  margin-top: 2px;
  word-break: break-all;
}

.order-letterhead-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px 6px;
  border-bottom: 1.2px solid #111827;
}

.order-logo {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.order-checklist {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.65;
  text-align: left;
  white-space: nowrap;
}

.order-checklist li::before {
  content: "\\2611";
  margin-right: 5px;
}

.order-address-line {
  padding: 6px 14px;
  text-align: center;
  border-bottom: 1.2px solid #111827;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.4;
}

.order-party-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 14px;
  border-bottom: 1.2px solid #111827;
  font-size: 14px;
  font-weight: 800;
  gap: 12px;
}

.order-party-right {
  text-align: right;
  line-height: 1.55;
}

.order-footer {
  border-top: 1.2px solid #111827;
  padding: 8px 14px 12px;
}

.order-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #d7dde7;
}

.order-remarks {
  flex: 1;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  font-weight: 900;
  text-transform: uppercase;
  white-space: nowrap;
}

.order-total strong {
  font-size: 18px;
}

.order-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 10px;
  font-size: 11.5px;
  font-weight: 700;
}

.order-signature {
  font-size: 13.5px;
  font-weight: 900;
  text-align: center;
}

.invoice-document.design-mode [data-design-editable="true"] {
  cursor: text;
  outline: 1px dashed rgba(37, 99, 235, 0.35);
  outline-offset: -1px;
}

.invoice-document.design-mode [data-design-editable="true"]:hover {
  outline: 2px solid #60a5fa;
  position: relative;
  z-index: 4;
}

.invoice-document.design-mode .design-selected {
  outline: 2px solid #2563eb !important;
  position: relative;
  z-index: 5;
}

.invoice-document.design-mode .invoice-brand-mark {
  cursor: move;
  outline: 2px dashed #f97316;
}

.invoice-document.design-mode [data-design-movable="true"] {
  cursor: move;
  outline: 2px dashed #f97316;
  outline-offset: 2px;
}

.invoice-document.design-mode [data-design-locked="true"] {
  cursor: not-allowed;
  outline: 2px solid #ef4444;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  html,
  body,
  #root {
    width: 210mm;
    min-width: 210mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print\\:hidden {
    display: none !important;
  }

  [data-design-editable="true"],
  .design-selected,
  .invoice-brand-mark,
  [data-design-locked="true"] {
    outline: none !important;
  }

  .invoice-column-resizer {
    display: none !important;
  }

  .invoice-shell {
    background: #ffffff !important;
    padding: 0 !important;
  }

  .invoice-scroll {
    overflow: visible !important;
    padding: 0 !important;
  }

  .invoice-document {
    width: 210mm !important;
    gap: 0 !important;
    min-width: 0 !important;
    align-items: stretch !important;
  }

  .invoice-page {
    width: 210mm !important;
    height: 297mm !important;
    margin: 0 !important;
    padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm) !important;
    box-shadow: none !important;
  }

  .invoice-shell > * {
    margin-top: 0 !important;
  }
}
`;

const chunkItems = (items = []) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += PAGE_ITEM_LIMIT) {
    chunks.push(items.slice(index, index + PAGE_ITEM_LIMIT));
  }
  return chunks.length ? chunks : [[]];
};

const normalizeWhatsAppPhone = (value = "") => {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
};

const normalizeInvoiceMargin = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 8;
  return Math.min(20, Math.max(0, numericValue));
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const PrintInvoice = () => {
  const { id } = useParams();
  const printRef = useRef(null);
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [whatsAppBusy, setWhatsAppBusy] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [selectedDesignLabel, setSelectedDesignLabel] = useState("Nothing selected");
  const [tableColumnWidths, setTableColumnWidths] = useState(GST_COLUMN_WIDTHS);
  const selectedDesignElement = useRef(null);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "a4-print-css";
    styleTag.textContent = A4_PRINT_STYLE;
    document.head.appendChild(styleTag);
    return () => {
      document.getElementById("a4-print-css")?.remove();
    };
  }, []);

  useEffect(() => {
    const getInvoice = async () => {
      try {
        const { data } = await API.get(`/invoices/print/${id}`);
        setInvoice(data.printableInvoice);
        setSettings(data.settings || {});
      } catch (err) {
        setError(err.response?.data?.message || "Invoice not found");
      } finally {
        setLoading(false);
      }
    };

    getInvoice();
  }, [id]);

  useEffect(() => {
    if (!invoice) return;
    const frame = requestAnimationFrame(() => {
      const root = printRef.current;
      if (!root) return;
      const orderDocument = invoice?.documentType === "order" || invoice?.gstEnabled === false;
      const templateKey = orderDocument ? "order" : "gst_invoice";
      // Load template design for this document type (applies to ALL invoices of same type)
      const savedDesign = settings.invoiceDesign?.templates?.[templateKey] || {};
      const expectedColumnCount = orderDocument
        ? ORDER_COLUMN_WIDTHS.length
        : GST_COLUMN_WIDTHS.length;
      const savedColumnWidths = savedDesign.tableColumnWidths;
      setTableColumnWidths(
        Array.isArray(savedColumnWidths) && savedColumnWidths.length === expectedColumnCount
          ? savedColumnWidths
          : orderDocument ? ORDER_COLUMN_WIDTHS : GST_COLUMN_WIDTHS
      );
      const elements = [...root.querySelectorAll(DESIGN_EDITABLE_SELECTOR)];
      elements.forEach((element, index) => {
        element.dataset.designId = `text-${index}`;
        const saved = savedDesign.elements?.[`text-${index}`];
        if (saved?.text !== undefined) element.textContent = saved.text;
        if (saved?.style) element.style.cssText = saved.style;
      });
      const logo = root.querySelector(".invoice-brand-mark");
      if (logo && savedDesign.logoStyle) {
        logo.style.cssText = savedDesign.logoStyle;
      }
      root.querySelectorAll('[data-design-special-id]').forEach((element) => {
        const savedStyle = savedDesign.specialStyles?.[element.dataset.designSpecialId];
        if (savedStyle) {
          element.style.cssText = savedStyle;
          const translated = element.style.transform.match(
            /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/
          );
          if (translated) {
            element.dataset.moveX = translated[1];
            element.dataset.moveY = translated[2];
          }
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [id, invoice, settings.invoiceDesign]);

  const isGst = invoice?.documentType !== "order" && invoice?.gstEnabled !== false;
  const docLabel = isGst ? "Invoice" : "Order";
  const docHeading = isGst ? "Tax Invoice" : "Estimate / Order";

  const shop = useMemo(
    () => ({
      shopName: COMPANY_DISPLAY_NAME,
      businessLine: settings.invoiceBusinessLine || FALLBACK_SHOP.businessLine,
      shopAddress: settings.shopAddress || FALLBACK_SHOP.shopAddress,
      shopMobile: settings.shopMobile || FALLBACK_SHOP.shopMobile,
      shopEmail: settings.shopEmail || FALLBACK_SHOP.shopEmail,
      gstNumber: settings.gstNumber || FALLBACK_SHOP.gstNumber,
      accountHolderName:
        settings.accountHolderName || FALLBACK_SHOP.accountHolderName,
      bankName: settings.bankName || FALLBACK_SHOP.bankName,
      bankBranch: settings.bankBranch || FALLBACK_SHOP.bankBranch,
      accountNumber: settings.accountNumber || FALLBACK_SHOP.accountNumber,
      ifscCode: settings.ifscCode || FALLBACK_SHOP.ifscCode,
      paymentUpiId: FALLBACK_SHOP.paymentUpiId,
    }),
    [settings]
  );

  const pages = useMemo(() => chunkItems(invoice?.products || []), [invoice]);

  const invoicePageStyle = useMemo(
    () => ({
      "--invoice-margin-top": `${normalizeInvoiceMargin(settings.invoiceMarginTop)}mm`,
      "--invoice-margin-right": `${normalizeInvoiceMargin(settings.invoiceMarginRight)}mm`,
      "--invoice-margin-bottom": `${normalizeInvoiceMargin(settings.invoiceMarginBottom)}mm`,
      "--invoice-margin-left": `${normalizeInvoiceMargin(settings.invoiceMarginLeft)}mm`,
    }),
    [settings]
  );

  const taxBreakup = useMemo(() => {
    if (!invoice?.products?.length) return [];

    const groups = new Map();
    invoice.products.forEach((item) => {
      const quantity = toNumber(item.quantity, 1);
      const sqFt = toNumber(item.sqFt) || toNumber(item.length) * toNumber(item.width);
      const taxable =
        item.baseAmount ?? sqFt * quantity * toNumber(item.selectedRate);
      const rate = toNumber(item.gstRate);
      const gstAmount = item.gstAmount ?? (taxable * rate) / 100;
      const key = String(rate);
      const existing = groups.get(key) || { rate, taxable: 0, gstAmount: 0 };

      existing.taxable += taxable;
      existing.gstAmount += gstAmount;
      groups.set(key, existing);
    });

    return [...groups.values()].sort((a, b) => a.rate - b.rate);
  }, [invoice]);

  const termsList = [
    settings.invoiceTermOne || "All disputes are subject to Raipur Jurisdiction only.",
    settings.invoiceTermTwo || "E.&O.E. GST rules apply as current regulations.",
  ];

  const grandTotal = toNumber(invoice?.grandTotal);
  const grandTotalRounded = Math.round(grandTotal);
  const roundOff = grandTotalRounded - grandTotal;
  const amountInWords = numberToWords(grandTotalRounded);

  const getExportFilename = (extension) =>
    `${isGst ? "GST-Invoice" : "Order"}-${invoice?.invoiceNumber || "bill"}.${extension}`;

  const withCaptureRender = async (element, action) => {
    if (document.fonts?.ready) await document.fonts.ready;
    const images = [...element.querySelectorAll("img")];
    await Promise.all(images.map((image) => {
      if (image.complete) return image.decode?.().catch(() => undefined);
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
    element.classList.add("capture-render");
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      return await action();
    } finally {
      element.classList.remove("capture-render");
    }
  };

  const createPdfBlob = async () => {
    const element = document.getElementById("invoice-a4-wrapper");
    if (!element) return null;

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    return withCaptureRender(element, async () => {
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageElements = [...element.querySelectorAll(".invoice-page")];

      for (let index = 0; index < pageElements.length; index += 1) {
        const page = pageElements[index];
        const pageRect = page.getBoundingClientRect();
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: -window.scrollY,
          width: Math.round(pageRect.width),
          height: Math.round(pageRect.height),
          windowWidth: document.documentElement.clientWidth,
          windowHeight: document.documentElement.clientHeight,
        });
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(canvas.toDataURL("image/jpeg", 1), "JPEG", 0, 0, 210, 297);
      }

      return pdf.output("blob");
    });
  };

  const createImageBlob = async (mimeType = "image/jpeg") => {
    const element = document.getElementById("invoice-a4-wrapper");
    if (!element) return null;

    const html2canvas = (await import("html2canvas")).default;
    return withCaptureRender(element, async () => {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      return new Promise((resolve) => canvas.toBlob(resolve, mimeType, 0.95));
    });
  };

  const createExportBlob = (filename) =>
    isGst ? createPdfBlob(filename) : createImageBlob("image/jpeg");

  const handlePrint = () => {
    window.print();
  };

  const setDesignEditing = (enabled) => {
    const root = printRef.current;
    if (!root) return;
    const elements = [...root.querySelectorAll(DESIGN_EDITABLE_SELECTOR)];
    elements.forEach((element, index) => {
      element.dataset.designId = `text-${index}`;
      element.dataset.designEditable = "true";
      element.contentEditable = enabled ? "true" : "false";
      element.spellcheck = enabled;
    });
    root.querySelectorAll('[data-design-movable="true"]').forEach((element) => {
      element.contentEditable = "false";
    });
    root.classList.toggle("design-mode", enabled);
    if (!enabled) {
      selectedDesignElement.current?.classList.remove("design-selected");
      selectedDesignElement.current = null;
      setSelectedDesignLabel("Nothing selected");
    }
    setDesignMode(enabled);
  };

  const handleDesignSelect = (event) => {
    if (!designMode) return;
    const target = event.target.closest(
      '[data-design-editable="true"], .invoice-brand-mark, [data-design-movable="true"]'
    );
    if (!target || !printRef.current?.contains(target)) return;
    selectedDesignElement.current?.classList.remove("design-selected");
    selectedDesignElement.current = target;
    target.classList.add("design-selected");
    setSelectedDesignLabel(
      target.classList.contains("invoice-brand-mark")
        ? "Logo selected"
        : target.dataset.designSpecialId === "signature"
          ? "Signature selected (size and position only)"
          : target.dataset.designSpecialId === "company-name"
            ? "Company name selected (position only)"
        : `${target.textContent.trim().slice(0, 38) || "Text block"} selected`
    );
  };

  const applySelectedStyle = (property, value) => {
    const element = selectedDesignElement.current;
    if (!element) return;
    element.style[property] = value;
  };

  const updateDesignMargin = (side, value) => {
    const normalized = normalizeInvoiceMargin(value);
    const settingName = `invoiceMargin${side[0].toUpperCase()}${side.slice(1)}`;
    setSettings((current) => ({ ...current, [settingName]: normalized }));
  };

  const moveSelected = (xDelta, yDelta) => {
    const element = selectedDesignElement.current;
    if (!element) return;
    const x = Number(element.dataset.moveX || 0) + xDelta;
    const y = Number(element.dataset.moveY || 0) + yDelta;
    const matchingElements = element.dataset.designSpecialId
      ? printRef.current.querySelectorAll(
          `[data-design-special-id="${element.dataset.designSpecialId}"]`
        )
      : [element];
    matchingElements.forEach((matchingElement) => {
      matchingElement.dataset.moveX = String(x);
      matchingElement.dataset.moveY = String(y);
      matchingElement.style.transform = `translate(${x}px, ${y}px)`;
    });
  };

  const resizeSelected = (delta) => {
    const element = selectedDesignElement.current;
    if (!element) return;
    if (
      element.classList.contains("invoice-brand-mark") ||
      element.dataset.designSpecialId === "signature"
    ) {
      const width = Math.max(30, element.getBoundingClientRect().width + delta);
      const matchingElements = element.dataset.designSpecialId
        ? printRef.current.querySelectorAll(
            `[data-design-special-id="${element.dataset.designSpecialId}"]`
          )
        : [element];
      matchingElements.forEach((matchingElement) => {
        matchingElement.style.width = `${width}px`;
        matchingElement.style.height = "auto";
      });
      return;
    }
    if (element.dataset.designSpecialId === "company-name") return;
    const currentSize = Number.parseFloat(getComputedStyle(element).fontSize) || 12;
    element.style.fontSize = `${Math.max(7, currentSize + delta)}px`;
  };

  const resizeTableColumns = (columnIndex, startClientX, tableWidth) => {
    if (!designMode || columnIndex >= tableColumnWidths.length - 1 || !tableWidth) return;
    const startingWidths = [...tableColumnWidths];
    const combinedWidth = startingWidths[columnIndex] + startingWidths[columnIndex + 1];

    const handlePointerMove = (event) => {
      const deltaPercent = ((event.clientX - startClientX) / tableWidth) * 100;
      const leftWidth = Math.min(
        combinedWidth - MIN_COLUMN_WIDTH,
        Math.max(MIN_COLUMN_WIDTH, startingWidths[columnIndex] + deltaPercent)
      );
      const nextWidths = [...startingWidths];
      nextWidths[columnIndex] = leftWidth;
      nextWidths[columnIndex + 1] = combinedWidth - leftWidth;
      setTableColumnWidths(nextWidths);
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const saveInvoiceDesign = async () => {
    const root = printRef.current;
    if (!root) return;
    const elements = {};
    root.querySelectorAll("[data-design-id]").forEach((element) => {
      elements[element.dataset.designId] = {
        text: element.textContent,
        style: element.style.cssText,
      };
    });
    const logo = root.querySelector(".invoice-brand-mark");
    const specialStyles = {};
    root.querySelectorAll('[data-design-special-id]').forEach((element) => {
      specialStyles[element.dataset.designSpecialId] = element.style.cssText;
    });
    // Save as template for this document type — applies to ALL invoices of same type
    const templateKey = isGst ? "gst_invoice" : "order";
    const invoiceDesign = {
      ...(settings.invoiceDesign || {}),
      templates: {
        ...(settings.invoiceDesign?.templates || {}),
        [templateKey]: {
          elements,
          logoStyle: logo?.style.cssText || "",
          specialStyles,
          tableColumnWidths,
        },
      },
    };
    try {
      await API.put("/settings", { ...settings, shopName: COMPANY_DISPLAY_NAME, invoiceDesign });
      setSettings((current) => ({ ...current, invoiceDesign }));
      setDesignEditing(false);
      alert(`${isGst ? "GST Invoice" : "Non-GST Order"} template saved! Yeh design ab saare ${isGst ? "GST Invoices" : "Orders"} mein apply hoga.`);
    } catch (error) {
      alert(error.response?.data?.message || "Design save nahi ho paya.");
    }
  };

  const handleDownloadFile = async () => {
    if (!invoice || pdfBusy) return;

    setPdfBusy(true);
    try {
      const filename = getExportFilename(isGst ? "pdf" : "jpg");
      const blob = await createExportBlob(filename);
      if (blob) downloadBlob(blob, filename);
    } finally {
      setPdfBusy(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!invoice || whatsAppBusy) return;

    const phone = normalizeWhatsAppPhone(invoice?.farmer?.mobileNumber);
    if (!phone) {
      alert("Customer mobile number nahi mila.");
      return;
    }

    setWhatsAppBusy(true);
    try {
      const extension = isGst ? "pdf" : "jpg";
      const fileTypeLabel = isGst ? "PDF" : "Image";
      const filename = getExportFilename(extension);
      const blob = await createExportBlob(filename);
      if (!blob) return;

      const sharedFile = new File([blob], filename, {
        type: isGst ? "application/pdf" : "image/jpeg",
      });
      const date = formatDate(invoice?.createdAt);
      const message = `${docLabel} #${invoice?.invoiceNumber}\nDate: ${date}\nCustomer: ${invoice?.farmer?.name || "-"}\nAmount: Rs ${formatNumber(grandTotalRounded)}\n\n${fileTypeLabel} invoice is attached.`;

      if (navigator.canShare && navigator.canShare({ files: [sharedFile] })) {
        await navigator.share({
          files: [sharedFile],
          title: filename,
          text: message,
        });
        return;
      }

      downloadBlob(blob, filename);
      const fallbackMessage = `${message}\n\n${fileTypeLabel} has been downloaded. Please attach the downloaded file in this WhatsApp chat.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(fallbackMessage)}`, "_blank");
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      alert("File share nahi ho paya. Please Save file karke WhatsApp me attach karein.");
    } finally {
      setWhatsAppBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading invoice...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 p-10 text-center font-bold text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="invoice-shell space-y-5 p-3 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <Link
          to="/invoices"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setDesignEditing(!designMode)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-violet-700"
          >
            {designMode ? "Close Designer" : "Edit Design"}
          </button>
          <button
            onClick={handleWhatsApp}
            disabled={whatsAppBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <MessageCircle size={17} />
            {whatsAppBusy ? "Preparing..." : `Send ${isGst ? "PDF" : "Image"} on WhatsApp`}
          </button>

          <Link
            to={`/invoices/edit/${invoice?._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600"
          >
            <Pencil size={17} />
            Edit {docLabel}
          </Link>

          <button
            onClick={handleDownloadFile}
            disabled={pdfBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download size={17} />
            {pdfBusy ? "Saving..." : isGst ? "Save PDF A4" : "Save Image"}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-700"
          >
            <Printer size={17} />
            Print {docLabel}
          </button>
        </div>
      </div>

      {designMode && (
        <div className="print:hidden sticky top-2 z-50 mx-auto flex max-w-5xl flex-wrap items-end gap-2 rounded-2xl border border-violet-200 bg-white p-3 shadow-xl">
          <div className="mr-2 min-w-52">
            <div className="text-[10px] font-black uppercase tracking-widest text-violet-600">
              Template Editor — {isGst ? "GST Invoice" : "Non-GST Order"}
            </div>
            <div className="text-[10px] font-semibold text-amber-600">
              ⚡ Save karoge toh saare {isGst ? "GST Invoices" : "Orders"} update honge
            </div>
            <div className="mt-1 max-w-56 truncate text-xs font-bold text-slate-700">
              {selectedDesignLabel}
            </div>
          </div>

          <label className="text-[10px] font-black uppercase text-slate-500">
            Font
            <select
              className="mt-1 block rounded-lg border border-slate-300 px-2 py-2 text-xs normal-case text-slate-800"
              onChange={(event) => applySelectedStyle("fontFamily", event.target.value)}
              defaultValue="Arial"
            >
              <option>Arial</option>
              <option>Georgia</option>
              <option>Tahoma</option>
              <option>Verdana</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
            </select>
          </label>

          <div className="flex gap-1">
            <button type="button" onClick={() => resizeSelected(-1)} className="rounded-lg bg-slate-100 px-3 py-2 font-black">A−</button>
            <button type="button" onClick={() => resizeSelected(1)} className="rounded-lg bg-slate-100 px-3 py-2 font-black">A+</button>
            <button type="button" onClick={() => applySelectedStyle("fontWeight", "900")} className="rounded-lg bg-slate-100 px-3 py-2 font-black">B</button>
            <button type="button" onClick={() => applySelectedStyle("fontWeight", "400")} className="rounded-lg bg-slate-100 px-3 py-2">Normal</button>
            <input
              type="color"
              title="Text colour"
              defaultValue="#111827"
              onChange={(event) => applySelectedStyle("color", event.target.value)}
              className="h-9 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
            />
          </div>

          <div className="flex gap-1">
            <button type="button" onClick={() => applySelectedStyle("textAlign", "left")} className="rounded-lg bg-slate-100 px-3 py-2">Left</button>
            <button type="button" onClick={() => applySelectedStyle("textAlign", "center")} className="rounded-lg bg-slate-100 px-3 py-2">Center</button>
            <button type="button" onClick={() => applySelectedStyle("textAlign", "right")} className="rounded-lg bg-slate-100 px-3 py-2">Right</button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <span />
            <button type="button" onClick={() => moveSelected(0, -2)} className="rounded bg-slate-100 px-2 py-1">↑</button>
            <span />
            <button type="button" onClick={() => moveSelected(-2, 0)} className="rounded bg-slate-100 px-2 py-1">←</button>
            <button type="button" onClick={() => moveSelected(0, 2)} className="rounded bg-slate-100 px-2 py-1">↓</button>
            <button type="button" onClick={() => moveSelected(2, 0)} className="rounded bg-slate-100 px-2 py-1">→</button>
          </div>

          <div className="flex gap-1">
            {["top", "right", "bottom", "left"].map((side) => {
              const key = `invoiceMargin${side[0].toUpperCase()}${side.slice(1)}`;
              return (
                <label key={side} className="text-[9px] font-black uppercase text-slate-500">
                  {side[0]}
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={settings[key] ?? 8}
                    onChange={(event) => updateDesignMargin(side, event.target.value)}
                    className="mt-1 block w-12 rounded border border-slate-300 px-1 py-2 text-center text-xs text-slate-800"
                  />
                </label>
              );
            })}
          </div>

          <div className="ml-auto flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={saveInvoiceDesign}
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white hover:bg-violet-700"
            >
              Save as Default Template
            </button>
            <span className="text-[10px] font-bold text-violet-500">
              Applies to all {isGst ? "GST Invoices" : "Non-GST Orders"}
            </span>
          </div>
        </div>
      )}

      <div className="invoice-scroll">
        <div
          id="invoice-a4-wrapper"
          ref={printRef}
          className="invoice-document"
          onClickCapture={handleDesignSelect}
        >
          {pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const serialOffset = pageIndex * PAGE_ITEM_LIMIT;

            return (
              <div
                className="invoice-page"
                key={`invoice-page-${pageIndex}`}
                style={invoicePageStyle}
              >
                <div className="invoice-sheet">
                  <InvoiceHeader
                    docHeading={docHeading}
                    invoice={invoice}
                    isGst={isGst}
                    pageIndex={pageIndex}
                    pageCount={pages.length}
                    shop={shop}
                  />

                  <div className="invoice-page-body">
                    <div className="invoice-table-area">
                      <ItemsTable
                        columnWidths={tableColumnWidths}
                        designMode={designMode}
                        invoice={invoice}
                        isGst={isGst}
                        onColumnResize={resizeTableColumns}
                        pageItems={pageItems}
                        serialOffset={serialOffset}
                        showPageTotal={isLastPage}
                      />

                      {!isLastPage && (
                        <div className="invoice-continued">
                          Continued on next page
                        </div>
                      )}
                    </div>

                    {isLastPage && (
                      <InvoiceFooter
                        amountInWords={amountInWords}
                        grandTotalRounded={grandTotalRounded}
                        invoice={invoice}
                        isGst={isGst}
                        roundOff={roundOff}
                        shop={shop}
                        taxBreakup={taxBreakup}
                        termsList={termsList}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const InvoiceHeader = ({ docHeading, invoice, isGst, pageIndex, pageCount, shop }) => {
  if (!isGst) {
    return <OrderHeader invoice={invoice} shop={shop} />;
  }

  const customerAddress = [
    invoice?.farmer?.address,
    invoice?.farmer?.village,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="invoice-top-line">
        <span />
        <span className="invoice-document-heading">{docHeading}</span>
        <span style={{ textAlign: "right" }}>
          Page {pageIndex + 1} of {pageCount}
        </span>
      </div>

      <div className="invoice-title">
        <img
          className="invoice-brand-mark"
          src="/walia-logo.png"
          alt="Walia's Creative logo"
        />
        <div className="invoice-title-copy">
          <h1
            data-design-locked="true"
            data-design-movable="true"
            data-design-special-id="company-name"
            title="Company name is locked; position can be changed"
          >
            {shop.shopName}
          </h1>
          <p>{shop.shopAddress}</p>
        </div>
        <span aria-hidden="true" />
      </div>

      <div className="invoice-business-line">{shop.businessLine}</div>

      <div className="invoice-contact-line">
        Mobile : {shop.shopMobile}
        {shop.shopEmail ? ` | Email : ${shop.shopEmail}` : ""}
        {shop.gstNumber ? ` | GSTIN : ${shop.gstNumber}` : ""}
      </div>

      <div className="invoice-party-grid">
        <div className="invoice-buyer-box">
          <span className="invoice-muted-label invoice-buyer-label">Bill To:</span>
          <div className="invoice-buyer-content">
            <p className="invoice-buyer-name">{invoice?.farmer?.name || "-"}</p>
            <div className="invoice-buyer-details">
              <div>{customerAddress || "-"}</div>
              <div>Mob.: {invoice?.farmer?.mobileNumber || "-"}</div>
              <div>GST: {invoice?.farmer?.gstNumber || "-"}</div>
            </div>
          </div>
        </div>

        <div className="invoice-meta-box">
          <div className="invoice-meta-row">
            <strong>Invoice No.</strong>
            <strong>{invoice?.invoiceNumber}</strong>
          </div>
          <div className="invoice-meta-row">
            <strong>Invoice Date</strong>
            <strong>{formatDate(invoice?.createdAt)}</strong>
          </div>
          <div className="invoice-meta-row">
            <strong>Bill Time</strong>
            <strong>{formatTime(invoice?.createdAt)}</strong>
          </div>
          <div className="invoice-meta-row">
            <strong>Document Type</strong>
            <strong data-design-movable="true" data-design-special-id="doc-type">GST Invoice</strong>
          </div>
        </div>
      </div>
    </>
  );
};

const OrderHeader = ({ invoice, shop }) => (
  <>
    <div className="order-letterhead-top">
      <h1 className="order-logo" data-design-movable="true" data-design-special-id="company-name">{ORDER_LOGO_NAME}</h1>
      <ul className="order-checklist">
        {ORDER_SERVICES.map((service) => (
          <li key={service}>{service}</li>
        ))}
      </ul>
    </div>

    <div className="order-address-line" data-design-movable="true" data-design-special-id="company-address">
      {shop.shopAddress}
      {shop.shopMobile ? ` | Handfone : ${shop.shopMobile}` : ""}
      {shop.shopEmail ? ` | e-mail : ${shop.shopEmail}` : ""}
    </div>

    <div className="order-party-row">
      <div data-design-movable="true" data-design-special-id="party-details">
        M/s <strong>{invoice?.farmer?.name || "-"}</strong>
      </div>
      <div className="order-party-right">
        <div>Inv.No. <strong>{invoice?.invoiceNumber}</strong></div>
        <div>Date <strong>{formatDate(invoice?.createdAt)}</strong></div>
      </div>
    </div>
  </>
);

const ItemsTable = ({
  columnWidths,
  designMode,
  invoice,
  isGst,
  onColumnResize,
  pageItems,
  serialOffset,
  showPageTotal,
}) => {
  const headings = isGst
    ? ["S. No.", "Particulars", "HSN/SAC", "GST %", "Size", "Sq.Ft.", "Qty.", "Rate", "Amount"]
    : ["S. No.", "Particulars", "Size", "Sq.Ft.", "Qty.", "Rate", "Amount"];

  return (
    <table className="invoice-table">
      <colgroup>
        {columnWidths.map((width, index) => (
          <col key={index} style={{ width: `${width}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {headings.map((heading, index) => (
            <th key={heading}>
              {heading}
              {designMode && index < headings.length - 1 && (
                <span
                  className="invoice-column-resizer"
                  contentEditable="false"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onColumnResize(index, event.clientX, event.currentTarget.closest("table")?.offsetWidth);
                  }}
                  role="separator"
                  aria-label={`Resize ${heading} column`}
                />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {pageItems.map((item, idx) => {
          const quantity = toNumber(item.quantity, 1);
          const sqFt = toNumber(item.sqFt) || toNumber(item.length) * toNumber(item.width);
          const amount =
            item.baseAmount ?? sqFt * quantity * toNumber(item.selectedRate);

          return (
            <tr key={item._id || `${item.product?._id}-${idx}`}>
              <td className="center-cell">{serialOffset + idx + 1}</td>
              <td className="product-cell">
                {item.product?.productName || item.product || "-"}
              </td>
              {!isGst && (
                <td className="center-cell">
                  {toNumber(item.width) > 0 && toNumber(item.length) > 0
                    ? `${formatCompactNumber(item.width)} \u00d7 ${formatCompactNumber(item.length)}`
                    : "-"}
                </td>
              )}
              {isGst && (
                <td className="center-cell">
                  {item.hsnCode || item.product?.hsnCode || "-"}
                </td>
              )}
              {isGst && (
                <td className="center-cell gst-rate-cell">
                  {formatCompactNumber(item.gstRate)}
                </td>
              )}
              {isGst && (
                <td className="center-cell">
                  {formatCompactNumber(item.width)} x {formatCompactNumber(item.length)}
                </td>
              )}
              <td className="center-cell">{formatCompactNumber(sqFt)}</td>
              <td className="center-cell">{formatCompactNumber(quantity)}</td>
              <td className="rate-cell numeric-highlight">{formatNumber(item.selectedRate)}</td>
              <td className="amount-cell amount-highlight">{formatNumber(amount)}</td>
            </tr>
          );
        })}
        <FillerRow isGst={isGst} />
      </tbody>
      {showPageTotal && isGst && (
        <tfoot>
          <tr>
            <td />
            <td>Total Taxable Amount</td>
            <td />
            <td />
            <td />
            <td />
            <td />
            <td />
            <td className="amount-cell amount-highlight">{formatNumber(invoice?.subTotal)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

const FillerRow = ({ isGst }) => (
  <tr className="invoice-filler-row">
    <td />
    <td />
    {!isGst && <td />}
    {isGst && <td />}
    {isGst && <td />}
    {isGst && <td />}
    <td />
    <td />
    <td />
    <td />
  </tr>
);


const InvoiceFooter = ({
  amountInWords,
  grandTotalRounded,
  invoice,
  isGst,
  roundOff,
  shop,
  taxBreakup,
  termsList,
}) => {
  if (!isGst) {
    return <OrderFooter grandTotalRounded={grandTotalRounded} shop={shop} />;
  }

  return (
    <div className="invoice-footer">
      <div className="invoice-footer-grid" style={{ gridTemplateColumns: "45% 31% 24%" }}>
        <div className="invoice-footer-cell">
          <table className="invoice-tax-table">
            <thead>
              <tr>
                <th>GST</th>
                <th>Taxable</th>
                <th>CGST</th>
                <th>SGST</th>
              </tr>
            </thead>
            <tbody>
              {taxBreakup.map((row) => (
                <tr key={row.rate}>
                  <td style={{ fontWeight: 800, textAlign: "center" }}>
                    {formatCompactNumber(row.rate)}%
                  </td>
                  <td style={{ textAlign: "center" }}>{formatNumber(row.taxable)}</td>
                  <td style={{ textAlign: "center" }}>{formatNumber(row.gstAmount / 2)}</td>
                  <td style={{ textAlign: "center" }}>{formatNumber(row.gstAmount / 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <span className="invoice-section-title">Terms & Conditions</span>
          <ol className="invoice-terms">
            {termsList.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </div>

        <div className="invoice-footer-cell">
          <span className="invoice-section-title">Bank Details</span>
          <div>A/c Name: <strong>{shop.accountHolderName}</strong></div>
          <div>A/c No.: <strong>{shop.accountNumber}</strong></div>
          <div>Bank: <strong>{shop.bankName}</strong></div>
          <div>Branch: <strong>{shop.bankBranch}</strong></div>
          <div>IFSC: <strong>{shop.ifscCode}</strong></div>
        </div>

        <div className="invoice-footer-cell">
          <div className="invoice-total-row">
            <span>Total</span>
            <span>{formatNumber(invoice?.subTotal)}</span>
          </div>
          <div className="invoice-total-row">
            <span>CGST</span>
            <span>{formatNumber(toNumber(invoice?.totalGST) / 2)}</span>
          </div>
          <div className="invoice-total-row">
            <span>SGST</span>
            <span>{formatNumber(toNumber(invoice?.totalGST) / 2)}</span>
          </div>
          <div className="invoice-total-row">
            <span>Add GST</span>
            <span>{formatNumber(invoice?.totalGST)}</span>
          </div>
          {Math.abs(roundOff) >= 0.01 && (
            <div className="invoice-total-row">
              <span>Round Off</span>
              <span>{formatNumber(roundOff)}</span>
            </div>
          )}
          <div className="invoice-total-row net">
            <span>Net Total</span>
            <span>{formatNumber(grandTotalRounded)}</span>
          </div>
        </div>
      </div>

      <div className="invoice-signature-row">
        <div className="invoice-amount-words">
          <span className="invoice-muted-label">Amount Chargeable in Words</span>
          <div>
            <strong>Rs. {amountInWords} Only</strong>
          </div>
        </div>
        <div className="invoice-signature">
          <div className="invoice-signature-for">FOR</div>
          <div className="invoice-signature-company">
            {shop.accountHolderName || shop.shopName}
          </div>
          <img
            src="/signature.png"
            alt="Authorized signature"
            data-design-movable="true"
            data-design-special-id="signature"
            title="Signature size and position can be changed"
          />
          <div>Proprietor / Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
};

const OrderFooter = ({ grandTotalRounded, shop }) => (
  <div className="order-footer">
    <div className="order-footer-row">
      <div className="order-remarks">Remarks :</div>

      <div className="invoice-payment-qr">
        <img src={ORDER_PAYMENT_QR} alt="Scan QR to pay" />
        <div>
          <strong>Scan to Pay</strong>
          <span className="order-payment-upi">UPI: {shop.paymentUpiId}</span>
        </div>
      </div>

      <div className="order-total">
        <span>Total :</span>
        <strong>{formatNumber(grandTotalRounded)}</strong>
      </div>
    </div>

    <div className="order-bottom-row">
      <div>
        Subject to Raipur Jurisdiction
        <br />
        E.&amp;O.E.
      </div>
      <div className="order-signature">For, {ORDER_LOGO_NAME}</div>
    </div>
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatNumber = (value) =>
  toNumber(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCompactNumber = (value) => {
  const numericValue = toNumber(value);
  return Number.isInteger(numericValue)
    ? String(numericValue)
    : numericValue.toFixed(2);
};

export default PrintInvoice;
