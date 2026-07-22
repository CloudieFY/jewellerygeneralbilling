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
    "Gold, Silver & Diamond Jewellery · Hallmarked Ornaments · Custom Designs",
  shopAddress: "Kelkar Para, Station Road, Raipur (C.G.)",
  shopMobile: "+91 9981111199",
  shopEmail: "waliascreative@gmail.com",
  gstNumber: "22AEYPA8034J1ZC",
  accountHolderName: "Walia's Creative Design & Prints",
  bankName: "Punjab National Bank",
  bankBranch: "Budhapara Branch, Raipur (C.G.)",
  accountNumber: "0926050051323",
  ifscCode: "PUNB0092620",
  paymentUpiId: "7898088910@hdfc",
};

const ORDER_PAYMENT_QR = "/payment-qr-crop.jpeg";
const GST_COLUMN_WIDTHS = [5, 20, 8, 8, 8, 9, 11, 8, 10, 13];
const MIN_COLUMN_WIDTH = 4;
const DESIGN_SCHEMA_VERSION = 4;
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

const INVOICE_PAGE_WIDTH_MM = 190.5;
const INVOICE_PAGE_HEIGHT_MM = 254;

const A4_PRINT_STYLE = `
.invoice-shell {
  background: radial-gradient(circle at 10% 5%, rgba(217, 119, 6, 0.14), transparent 28rem), #fffaf0;
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
  min-width: 190.5mm;
}

.invoice-page {
  width: 190.5mm;
  height: 254mm;
  padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm);
  box-sizing: border-box;
  background: #ffffff;
  color: #35200d;
  font-family: "Segoe UI", Arial, sans-serif;
  font-weight: 700;
  box-shadow: 0 22px 55px rgba(92, 49, 12, 0.18);
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
  border: 1.5px solid #8b5a18;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fffef9 0%, #ffffff 18%, #ffffff 100%);
  box-shadow: inset 0 0 0 3px #fff, inset 0 0 0 4px #e8c777;
}

.invoice-document.pdf-render {
  display: block;
  width: 190.5mm;
  min-width: 190.5mm;
  max-width: 190.5mm;
  gap: 0;
  align-items: stretch;
  margin: 0;
  padding: 0;
  background: #ffffff;
}

.invoice-document.pdf-render .invoice-page {
  width: 190.5mm;
  height: 254mm;
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
  border-bottom: 1px solid #c99a43;
  padding: 5px 11px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.3;
  color: #70420d;
  background: #fff8e7;
}

.invoice-letterhead-image {
  position: relative;
  height: 49mm;
  overflow: hidden;
  border-bottom: 1px solid #7b7057;
  background: #eee9dc;
}

.invoice-letterhead-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: auto;
  display: block;
  max-width: none;
}

.invoice-sale-title {
  padding: 2mm 0 1mm;
  text-align: center;
  color: #741326;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.2;
}

.invoice-sale-title span { display: block; margin-top: 2px; color: #1f1a17; font: 800 9px Arial, sans-serif; }

.invoice-document-heading {
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.8px;
}

.invoice-title {
  display: grid;
  grid-template-columns: 46mm minmax(0, 1fr) 18mm;
  align-items: center;
  min-height: 30mm;
  padding: 5px 12px 6px;
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
  width: 36mm;
  height: 22mm;
  margin: 0 auto;
  display: block;
  object-fit: contain;
}

.invoice-title-copy {
  min-width: 0;
}

.invoice-title h1 {
  margin: 0 0 1px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 39px;
  line-height: 1;
  letter-spacing: -0.8px;
  color: #6f3f0b;
  text-transform: none;
}

.invoice-title p {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
  line-height: 1.25;
  color: #725426;
}

.invoice-business-line {
  border-top: 1px solid #c99a43;
  border-bottom: 1px solid #c99a43;
  background: linear-gradient(90deg, #fff8e7, #f8e7b9, #fff8e7);
  padding: 5px 12px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
  color: #68400e;
  letter-spacing: 0.35px;
}

.invoice-contact-line {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8mm;
  padding: 6px 14px;
  text-align: center;
  border-bottom: 1px solid #c99a43;
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.45;
  color: #5f431c;
}

.invoice-party-grid {
  display: grid;
  grid-template-columns: 58% 42%;
  border-bottom: 1px solid #b9852f;
  font-size: 13px;
}

.invoice-buyer-box,
.invoice-meta-box {
  min-height: 29mm;
  padding: 9px 11px;
}

.invoice-buyer-box {
  border-right: 1px solid #b9852f;
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
  color: #8a6224;
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
  padding: 4px 0;
  align-items: center;
  font-size: 13px;
  line-height: 1.35;
}

.invoice-meta-row strong:first-child {
  font-weight: 900;
  color: #79571f;
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
  background: #70420d;
  color: #fffaf0;
  border-right: 1px solid #bd914c;
  border-bottom: 1px solid #70420d;
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
  border-right: 1px solid #d7bd8b;
  border-bottom: 1px solid #eee1c7;
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
  background: #fff5dc;
  color: #5f3508;
  border-top: 1px solid #a66c18;
  border-bottom: 1.2px solid #b45309;
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
  border-top: 1.2px solid #8b5a18;
  flex: 0 0 auto;
}

.invoice-footer-grid {
  display: grid;
  border-bottom: 1px solid #b9852f;
  align-items: stretch;
}

.invoice-footer-cell {
  min-width: 0;
  min-height: 38mm;
  border-right: 1px solid #caa25e;
  padding: 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.invoice-footer-cell:last-child {
  border-right: 0;
}

.invoice-section-title {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 900;
  text-decoration: none;
  text-transform: uppercase;
  color: #74480f;
  letter-spacing: 0.7px;
}

.invoice-tax-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 7px;
  font-size: 12px;
}

.invoice-tax-table th,
.invoice-tax-table td {
  border: 1px solid #c7a56b;
  padding: 6px 5px;
  text-align: center;
  vertical-align: middle;
  line-height: 1.35;
  white-space: nowrap;
}

.invoice-tax-table th {
  background: #fff3d1;
  color: #65400f;
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
  white-space: nowrap;
  text-align: right;
}

.invoice-total-row.net {
  margin-top: 5px;
  border-top: 1px solid #9b671c;
  padding: 6px 8px 4px;
  margin-left: -8px;
  margin-right: -8px;
  color: #6f3f0b;
  background: #fff4d8;
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
  padding: 10px 16px 8px;
  min-height: 35mm;
}

.invoice-amount-words {
  align-self: end;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
  overflow-wrap: anywhere;
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
  color: #6f3f0b;
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

/* Jewellery letterhead template inspired by the supplied Parasmani invoice. */
.invoice-sheet {
  position: relative;
  overflow: hidden;
  border: 1px solid #c8b77f;
  background: linear-gradient(105deg, #fffdf4 0%, #fffef9 48%, #f8f3df 100%);
  box-shadow: none;
}

.invoice-sheet::before,
.invoice-sheet::after {
  content: "";
  position: absolute;
  z-index: 0;
  width: 86mm;
  height: 86mm;
  border: 1.5px solid rgba(190, 145, 39, 0.18);
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle, transparent 0 7mm, rgba(190, 145, 39, 0.12) 7.2mm 7.8mm),
    repeating-conic-gradient(from 0deg, rgba(190, 145, 39, 0.11) 0deg 4deg, transparent 4deg 12deg);
  pointer-events: none;
}

.invoice-sheet::before { left: -51mm; top: 47mm; }
.invoice-sheet::after { right: -48mm; bottom: 32mm; }
.invoice-sheet > * { position: relative; z-index: 1; }

.invoice-top-line {
  min-height: 8mm;
  border: 0;
  background: #742538;
  color: #fff8df;
  padding: 4px 11px;
  font-size: 9px;
}

.invoice-document-heading {
  color: #f2c549;
  font-size: 13px;
  letter-spacing: 2px;
}

.invoice-title {
  grid-template-columns: 31mm minmax(0, 1fr) 47mm;
  min-height: 24mm;
  padding: 4px 9px;
  background: #742538;
}

.invoice-brand-mark {
  width: 24mm;
  height: 18mm;
  padding: 2px;
  border-radius: 2px;
  background: #fffaf0;
}

.invoice-title h1 {
  color: #f3c33f;
  font-size: 34px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.invoice-title p { color: #fff8e4; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; }

.invoice-business-line {
  border: 0;
  border-bottom: 1px solid #b8a77a;
  background: rgba(255,255,255,.76);
  color: #3d2430;
  font-size: 15px;
  padding: 6px 12px 2px;
}

.invoice-contact-line {
  min-height: 6mm;
  padding: 2px 12px 5px;
  border-bottom: 1px solid #8a7c58;
  background: rgba(255,255,255,.76);
  color: #352b25;
  font-size: 10px;
}

.invoice-party-grid {
  grid-template-columns: 61% 39%;
  border-bottom: 0;
  background: rgba(255,255,255,.64);
}

.invoice-buyer-box, .invoice-meta-box { position: relative; min-height: 25mm; padding: 5mm 4mm 2mm; margin: 6mm 5mm 2mm; box-sizing: border-box; border: 1px solid #d3ad6a; border-radius: 2.5mm; }
.invoice-buyer-name { font-size: 15px; text-transform: uppercase; }
.invoice-buyer-label { font-size: 11px; font-weight: 900; text-transform: uppercase; }
.invoice-buyer-details, .invoice-meta-row { font-size: 10px; }
.invoice-meta-row { padding: 1px 0; }
.invoice-meta-row strong:last-child { font-size: 10.5px; }
.parasmani-card-title { position: absolute; top: -5mm; left: 4mm; min-width: 28mm; padding: 0 2px; border-radius: 0; background: transparent; color: #741326; font-size: 9px; font-weight: 900; text-transform: uppercase; }

.invoice-table-area { flex: 0 0 auto; padding: 2.5mm 6mm 0; }
.invoice-table { flex: none; height: auto; background: rgba(255,255,255,.68); font-size: 9px; }
.gst-invoice-page .invoice-table { min-height: 38mm; }
.gst-invoice-page .invoice-table tbody td { vertical-align: top; padding-top: 5px; }
.invoice-table th {
  padding: 4px 2px;
  border: 1px solid #5f5a4e;
  background: rgba(255,255,255,.9);
  color: #24211d;
  font-size: 9px;
  white-space: normal;
  line-height: 1.1;
}
.invoice-table td { height: 6mm; padding: 3px; border: 1px solid #716b5d; }
.invoice-table .numeric-highlight, .invoice-table .gst-rate-cell, .invoice-table .amount-highlight { font-size: 9.5px; }
.invoice-filler-row { display: none; }
.invoice-table tfoot td { background: transparent; color: #29251f; border: 0; border-top: 1px solid #716b5d; }

.invoice-footer { flex: 1 1 auto; border: 0; padding: 2mm 6mm 3mm; }
.invoice-footer-grid { margin-left: auto; width: 58%; border: 0; grid-template-columns: 0 0 100% !important; }
.invoice-footer-cell { min-height: 0; border: 0; padding: 0; font-size: 9px; }
.invoice-footer-cell:nth-child(1), .invoice-footer-cell:nth-child(2) { display: none; }
.invoice-total-row { padding: 2px 8px; border-bottom: 1px solid #817762; font-size: 10px; }
.invoice-total-row span:last-child { font-size: 10px; }
.invoice-total-row.net { margin: 0; padding: 4px 8px; background: rgba(116,37,56,.08); color: #3a2027; font-size: 12px; }
.invoice-total-row.net span:last-child { font-size: 12px; }
.invoice-signature-row { min-height: 25mm; padding: 10px 8px; grid-template-columns: 1fr 1fr; }
.invoice-amount-words::after { content: "Customer Signatory"; display: block; margin-top: 16mm; font-size: 10px; font-weight: 900; }
.invoice-signature { font-size: 9px; }
.invoice-signature img { height: 42px; }

.invoice-page-body::after {
  content: none;
}

.parasmani-lower-grid { display: grid; grid-template-columns: 30% 70%; gap: 4mm; margin-top: 2mm; }
.parasmani-words { min-height: 18mm; padding: 2mm; box-sizing: border-box; border: 1px solid #d5ad67; border-radius: 3mm; display: flex; flex-direction: column; font-size: 7px; line-height: 1.2; }
.parasmani-box-title { color: #741326; font-weight: 900; text-transform: uppercase; }
.parasmani-signatures { display: flex; justify-content: space-between; gap: 3mm; margin-top: auto; padding-top: 10mm; font-size: 5px; text-align: center; }
.parasmani-signatures span { width: 48%; padding-top: 1mm; border-top: 1px solid #6b5a45; }
.parasmani-for { margin-top: 1mm; text-align: center; color: #741326; font-size: 7px; font-weight: 900; }
.parasmani-totals { border-collapse: collapse; width: 100%; font-size: 9px; }
.parasmani-totals td { padding: 2px 8px; border-bottom: 1px solid #dec79e; }
.parasmani-totals td:last-child { text-align: right; font-weight: 900; }
.parasmani-totals .total { background: #741326; color: white; font-weight: 900; }
.parasmani-totals .net { color: #741326; font-size: 11px; font-weight: 900; }
.parasmani-totals .parasmani-write-space td { height: 9mm; border-bottom: 1px solid #dec79e; background: transparent; }
.parasmani-info-grid { display: grid; grid-template-columns: 100%; margin-top: 2mm; }
.parasmani-info-box { min-height: 25mm; padding: 3mm; box-sizing: border-box; border: 1px solid #d5ad67; border-radius: 2mm; font-size: 8px; line-height: 1.3; }
.parasmani-info-box h4 { margin: -3mm -3mm 2mm; padding: 3px 8px; border-radius: 2mm 2mm 0 0; background: #741326; color: white; text-align: center; font-size: 8px; }
.parasmani-qr { display: flex; align-items: center; gap: 4mm; }
.parasmani-qr img { width: 19mm; height: 19mm; object-fit: contain; }
.parasmani-bank-with-qr { display: grid; grid-template-columns: auto 1fr 1.6fr; align-items: center; gap: 5mm; }
.parasmani-bank-with-qr > img { width: 19mm; height: 19mm; object-fit: contain; }
.parasmani-bank-details { padding-left: 5mm; border-left: 1px solid #dec79e; }
.parasmani-footer-banner { position: relative; margin-top: 2mm; }
.parasmani-footer-banner img { display: block; width: 100%; height: 29mm; object-fit: fill; }
.parasmani-page-number { position: absolute; right: 3mm; bottom: 1.5mm; color: #4b2a12; font-size: 7px; font-weight: 900; }

@media print {
  @page {
    size: 7.5in 10in;
    margin: 0;
  }

  html,
  body,
  #root {
    width: 190.5mm;
    min-width: 190.5mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
    -webkit-print-color-adjust: economy !important;
    print-color-adjust: economy !important;
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
    width: 190.5mm !important;
    gap: 0 !important;
    min-width: 0 !important;
    align-items: stretch !important;
  }

  .invoice-page {
    width: 190.5mm !important;
    height: 254mm !important;
    margin: 0 !important;
    padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm) !important;
    box-shadow: none !important;
  }

  .invoice-shell > * {
    margin-top: 0 !important;
  }

  /* The Parasmani stationery already contains the artwork, letterhead and
     bottom terms. Keep their measured space, but do not put ink over them. */
  .invoice-document.preprinted-paper .invoice-page {
    background: transparent !important;
  }

  .invoice-document.preprinted-paper .invoice-sheet {
    border-color: transparent !important;
    background: transparent !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }

  /* Black-and-white printer output: print only invoice matter. Decorative
     artwork and colour fills consume toner and turn into a dark grey page. */
  .invoice-sheet,
  .invoice-sheet * {
    background-color: transparent !important;
    background-image: none !important;
    color: #000000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
    -webkit-print-color-adjust: economy !important;
    print-color-adjust: economy !important;
  }

  .invoice-sheet::before,
  .invoice-sheet::after {
    display: none !important;
    content: none !important;
  }

  .invoice-letterhead-image,
  .parasmani-footer-banner img {
    visibility: hidden !important;
  }

  .invoice-table th,
  .invoice-table td,
  .invoice-buyer-box,
  .invoice-meta-box,
  .parasmani-words,
  .parasmani-info-box,
  .parasmani-totals td {
    border-color: #000000 !important;
  }

  .parasmani-totals .total {
    border-top: 1.5px solid #000000 !important;
    border-bottom: 1.5px solid #000000 !important;
    font-weight: 900 !important;
  }

  .invoice-document.preprinted-paper .invoice-letterhead-image,
  .invoice-document.preprinted-paper .parasmani-footer-banner {
    visibility: hidden !important;
  }

  /* 8 mm page inset + 27 mm spacer = content begins at about 35 mm,
     immediately below the stationery header measured in the supplied photo. */
  .invoice-document.preprinted-paper .invoice-letterhead-image {
    height: 27mm !important;
    border: 0 !important;
  }

  /* Preserve the pre-printed footer area (it begins at roughly 230 mm). */
  .invoice-document.preprinted-paper .parasmani-footer-banner,
  .invoice-document.preprinted-paper .parasmani-footer-banner img {
    height: 17mm !important;
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
  const [printOnPreprintedPaper, setPrintOnPreprintedPaper] = useState(true);
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
      const storedDesign = settings.invoiceDesign?.templates?.[templateKey] || {};
      // Older templates used positional element indexes. After invoice columns changed,
      // those indexes could apply text and sizing to the wrong cells and break alignment.
      const savedDesign = storedDesign.schemaVersion === DESIGN_SCHEMA_VERSION
        ? storedDesign
        : {};
      const expectedColumnCount = GST_COLUMN_WIDTHS.length;
      const savedColumnWidths = savedDesign.tableColumnWidths;
      setTableColumnWidths(
        Array.isArray(savedColumnWidths) && savedColumnWidths.length === expectedColumnCount
          ? savedColumnWidths
          : GST_COLUMN_WIDTHS
      );
      const elements = [...root.querySelectorAll(DESIGN_EDITABLE_SELECTOR)];
      elements.forEach((element, index) => {
        element.removeAttribute("style");
        element.dataset.designId = `text-${index}`;
        const saved = savedDesign.elements?.[`text-${index}`];
        if (saved?.style) element.style.cssText = saved.style;
      });
      const logo = root.querySelector(".invoice-brand-mark");
      logo?.removeAttribute("style");
      if (logo && savedDesign.logoStyle) {
        logo.style.cssText = savedDesign.logoStyle;
      }
      root.querySelectorAll('[data-design-special-id]').forEach((element) => {
        element.removeAttribute("style");
        delete element.dataset.moveX;
        delete element.dataset.moveY;
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
  const docLabel = isGst ? "Invoice" : "Estimate Order";
  const docHeading = isGst ? "Tax Invoice" : "Estimate Order";

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

  const grandTotalRounded = Math.round(toNumber(invoice?.grandTotal));
  const roundOff = invoice?.roundOff !== undefined
    ? toNumber(invoice.roundOff)
    : Math.round((grandTotalRounded - toNumber(invoice?.subTotal) - toNumber(invoice?.totalGST) + Number.EPSILON) * 100) / 100;
  const amountInWords = numberToWords(grandTotalRounded);

  const getExportFilename = (extension) =>
    `${isGst ? "GST-Invoice" : "Estimate"}-${invoice?.invoiceNumber || "bill"}.${extension}`;

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
      const invoiceFormat = [INVOICE_PAGE_WIDTH_MM, INVOICE_PAGE_HEIGHT_MM];
      const pdf = new jsPDF({ unit: "mm", format: invoiceFormat, orientation: "portrait" });
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
        if (index > 0) pdf.addPage(invoiceFormat, "portrait");
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1),
          "JPEG",
          0,
          0,
          INVOICE_PAGE_WIDTH_MM,
          INVOICE_PAGE_HEIGHT_MM,
        );
      }

      return pdf.output("blob");
    });
  };

  const createExportBlob = () => createPdfBlob();

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
          schemaVersion: DESIGN_SCHEMA_VERSION,
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
      alert(`${isGst ? "GST Invoice" : "Estimate Order"} template saved! Yeh design ab saare ${isGst ? "GST Invoices" : "Estimates"} mein apply hoga.`);
    } catch (error) {
      alert(error.response?.data?.message || "Design save nahi ho paya.");
    }
  };

  const handleDownloadFile = async () => {
    if (!invoice || pdfBusy) return;

    setPdfBusy(true);
    try {
      const filename = getExportFilename("pdf");
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
      const extension = "pdf";
      const fileTypeLabel = "PDF";
      const filename = getExportFilename(extension);
      const blob = await createExportBlob(filename);
      if (!blob) return;

      const sharedFile = new File([blob], filename, {
        type: "application/pdf",
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
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
              <input
                type="checkbox"
                checked={printOnPreprintedPaper}
                onChange={(event) => setPrintOnPreprintedPaper(event.target.checked)}
                className="h-4 w-4 accent-amber-700"
              />
              Pre-printed paper
          </label>
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
            {whatsAppBusy ? "Preparing..." : "Send PDF on WhatsApp"}
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
            {pdfBusy ? "Saving..." : "Save PDF (7.5 × 10 in)"}
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
              Template Editor — {isGst ? "GST Invoice" : "Estimate Order"}
            </div>
            <div className="text-[10px] font-semibold text-amber-600">
              ⚡ Save karoge toh saare {isGst ? "GST Invoices" : "Estimates"} update honge
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
              Applies to all {isGst ? "GST Invoices" : "Estimate Orders"}
            </span>
          </div>
        </div>
      )}

      <div className="invoice-scroll">
        <div
          id="invoice-a4-wrapper"
          ref={printRef}
          className={`invoice-document ${printOnPreprintedPaper ? "preprinted-paper" : ""}`}
          onClickCapture={handleDesignSelect}
        >
          {pages.map((pageItems, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;
            const serialOffset = pageIndex * PAGE_ITEM_LIMIT;

            return (
              <div
                className="invoice-page gst-invoice-page"
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
                        isGst={true}
                        showTax={isGst}
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
                        pageCount={pages.length}
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

const InvoiceHeader = ({ invoice, isGst }) => {
  const customerAddress = [
    invoice?.farmer?.address,
    invoice?.farmer?.village,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="invoice-letterhead-image">
        <img src="/parasmani-invoice-reference.png" alt="Parasmani jewellery letterhead" />
      </div>

      <div className="invoice-party-grid">
        <div className="invoice-buyer-box">
          <span className="parasmani-card-title">Bill To</span>
          <span className="invoice-muted-label invoice-buyer-label">Name:</span>
          <div className="invoice-buyer-content">
            <p className="invoice-buyer-name">{invoice?.farmer?.name || "-"}</p>
            <div className="invoice-buyer-details">
              <div>{customerAddress || "-"}</div>
              <div>Mob.: {invoice?.farmer?.mobileNumber || "-"}</div>
              {isGst && <div>GST: {invoice?.farmer?.gstNumber || "-"}</div>}
            </div>
          </div>
        </div>

        <div className="invoice-meta-box">
          <span className="parasmani-card-title">Invoice Details</span>
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
            <strong data-design-movable="true" data-design-special-id="doc-type">
              {isGst ? "GST Invoice" : "Estimate Order"}
            </strong>
          </div>
        </div>
      </div>
    </>
  );
};

const ItemsTable = ({
  columnWidths,
  designMode,
  invoice,
  isGst,
  onColumnResize,
  pageItems,
  serialOffset,
  showPageTotal,
  showTax,
}) => {
  const headings = isGst
    ? ["SR NO", "PRODUCT DESCRIPTION", "GS WT.", "LESS WT.", "NT WT.", "PURITY", "RATE (₹)", "MAKING (%)", "MAKING AMT (₹)", "STONE CHG. (₹)", "FINAL AMT (₹)"]
    : ["S. No.", "Jewellery", "Purity", "Gross / Net Wt.", "Pcs.", "Rate / g", "Making", "Stone", "Amount"];
  const printableHeadings = isGst
    ? headings.filter((heading) => !heading.startsWith("MAKING AMT"))
    : headings;

  return (
    <table className="invoice-table">
      <colgroup>
        {columnWidths.map((width, index) => (
          <col key={index} style={{ width: `${width}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {printableHeadings.map((heading, index) => (
            <th key={heading}>
              {heading}
              {designMode && index < printableHeadings.length - 1 && (
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
          const amount = item.baseAmount ?? item.totalAmount ?? 0;
          const purity = item.purity || item.product?.purity || "-";
          const huid = item.huid || item.product?.huid;

          return (
            <tr key={item._id || `${item.product?._id}-${idx}`}>
              <td className="center-cell">{serialOffset + idx + 1}</td>
              <td className="product-cell">
                {item.product?.productName || item.product || "-"}
              </td>
              {isGst && (
                <>
                  <td className="center-cell">{formatCompactNumber(item.grossWeight)}</td>
                  <td className="center-cell">{formatCompactNumber(item.stoneWeight)}</td>
                  <td className="center-cell">{formatCompactNumber(item.netWeight)}</td>
                  <td className="center-cell">{purity}{huid ? ` / ${huid}` : ""}</td>
                  <td className="rate-cell numeric-highlight">{formatNumber(item.metalRatePerGram || item.selectedRate)}</td>
                  <td className="rate-cell">
                    {item.makingChargeType === "percent"
                      ? `${formatCompactNumber(item.makingCharge)}%`
                      : "-"}
                  </td>
                  <td className="rate-cell">{formatNumber(item.stoneValueAmount || item.stoneValue)}</td>
                  <td className="amount-cell amount-highlight">{formatNumber(amount)}</td>
                </>
              )}
              {!isGst && (
                <td className="center-cell">
                  {purity}{huid ? ` / ${huid}` : ""}
                </td>
              )}
              {!isGst && (
                <>
                  <td className="center-cell">{formatCompactNumber(item.grossWeight)} / {formatCompactNumber(item.netWeight)} g</td>
                  <td className="center-cell">{formatCompactNumber(quantity)}</td>
                  <td className="rate-cell numeric-highlight">{formatNumber(item.metalRatePerGram || item.selectedRate)}</td>
                  <td className="rate-cell">{formatNumber(item.makingChargeAmount || item.makingCharge)}</td>
                  <td className="rate-cell">{formatNumber(item.stoneValueAmount || item.stoneValue)}</td>
                  <td className="amount-cell amount-highlight">{formatNumber(amount)}</td>
                </>
              )}
            </tr>
          );
        })}
        <FillerRow isGst={isGst} />
      </tbody>
      {showPageTotal && showTax && (
        <tfoot>
          <tr>
            <td colSpan={9}>Total Taxable Amount</td>
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
    {!isGst && <td />}
    {isGst && <td />}
    {isGst && <td />}
    {isGst && <td />}
    <td />
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
  pageCount,
}) => {
  // Older invoices can have receivedAmount=0 while ledger recalculation has
  // correctly populated paidAmount. Use the greater saved value for printing.
  const savedReceivedAmount = Math.max(
    toNumber(invoice?.receivedAmount),
    toNumber(invoice?.paidAmount)
  );
  const receivedAmount = Math.abs(grandTotalRounded - savedReceivedAmount) <= 0.5
    ? grandTotalRounded
    : savedReceivedAmount;
  const rawBalanceAmount = Math.max(grandTotalRounded - receivedAmount, 0);
  const balanceAmount = rawBalanceAmount <= 0.5 ? 0 : rawBalanceAmount;
  const cgstAmount = toNumber(invoice?.totalGST) / 2;
  const gstRate = taxBreakup[0]?.rate || 0;

  return (
    <div className="invoice-footer">
      <div className="parasmani-lower-grid">
        <div className="parasmani-words">
          <div className="parasmani-box-title">Amount chargeable in words</div>
          <div>Rupees {amountInWords} Only</div>
          <div className="parasmani-signatures"><span>Customer Signatory</span><span>Authorized Signatory</span></div>
          <div className="parasmani-for">For : PARASMANI</div>
        </div>
        <table className="parasmani-totals"><tbody>
          <tr><td>{isGst ? "Taxable Amount" : "Estimate Amount"}</td><td>₹ {formatNumber(invoice?.subTotal)}</td></tr>
          {isGst && <tr><td>CGST ({formatCompactNumber(gstRate / 2)}%)</td><td>₹ {formatNumber(cgstAmount)}</td></tr>}
          {isGst && <tr><td>SGST ({formatCompactNumber(gstRate / 2)}%)</td><td>₹ {formatNumber(cgstAmount)}</td></tr>}
          <tr><td>Round Off</td><td>₹ {formatNumber(roundOff)}</td></tr>
          <tr className="total"><td>Total Amount</td><td>₹ {formatNumber(grandTotalRounded)}</td></tr>
          <tr><td>Amount Received</td><td>₹ {formatNumber(receivedAmount)}</td></tr>
          <tr className="net"><td>Net Receivable Amount</td><td>₹ {formatNumber(balanceAmount)} DR</td></tr>
          <tr className="parasmani-write-space"><td colSpan="2" aria-label="Blank space for handwritten note" /></tr>
        </tbody></table>
      </div>

      <div className="parasmani-info-grid">
        <div className="parasmani-info-box">
          <h4>Scan QR Code / Company Bank Details</h4>
          <div className="parasmani-bank-with-qr">
            <img src={ORDER_PAYMENT_QR} alt="Payment QR"/>
            <div><strong>UPI ID</strong><br/>{shop.paymentUpiId}</div>
            <div className="parasmani-bank-details">Bank Name : <strong>{shop.bankName}</strong><br/>A/c Holder : <strong>{shop.accountHolderName}</strong><br/>A/c No. : <strong>{shop.accountNumber}</strong><br/>Branch : <strong>{shop.bankBranch}</strong><br/>IFSC Code : <strong>{shop.ifscCode}</strong></div>
          </div>
        </div>
      </div>

      <div className="parasmani-footer-banner">
        <img src="/parasmani-invoice-footer.png" alt="Invoice terms, BIS hallmark and authorised signature" />
        <span className="parasmani-page-number">Page {pageCount} of {pageCount}</span>
      </div>
    </div>
  );
};

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
