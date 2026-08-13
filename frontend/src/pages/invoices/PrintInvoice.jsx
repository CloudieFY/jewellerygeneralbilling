import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, MessageCircle, Pencil, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  gstNumber: "23AAAHM7492L1ZV",
  accountHolderName: "Murarilal Garg And Sons",
  bankName: "HDFC BANK",
  bankBranch: "Neemuch Branch",
  accountNumber: "50200025490462",
  ifscCode: "HDFC0000624",
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
  display: flex;
  justify-content: center;
}

.invoice-document {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  min-width: 190.5mm;
}

@media screen and (max-width: 768px) {
  .invoice-scroll {
    overflow-x: hidden;
    padding: 0 8px 16px;
  }
  .invoice-document {
    zoom: calc((100vw - 24px) / 720);
    min-width: unset;
  }
}

.invoice-page {
  width: 190.5mm;
  height: 254mm;
  padding: var(--invoice-margin-top, 8mm) var(--invoice-margin-right, 8mm) var(--invoice-margin-bottom, 8mm) var(--invoice-margin-left, 8mm);
  box-sizing: border-box;
  background: #ffffff;
  color: #35200d;
  font-family: "Segoe UI", Arial, sans-serif;
  font-weight: 400;
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
  border: 0.5px solid #8b5a18;
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
  border-bottom: 0.5px solid #7b7057;
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
  color: #111827;
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
  border-top: 0.5px solid #c99a43;
  border-bottom: 0.5px solid #c99a43;
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
  border-bottom: 0.5px solid #c99a43;
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.45;
  color: #5f431c;
}

.invoice-party-grid {
  display: grid;
  grid-template-columns: 58% 42%;
  border-bottom: 0.5px solid #b9852f;
  font-size: 13px;
}

.invoice-buyer-box,
.invoice-meta-box {
  min-height: 29mm;
  padding: 9px 11px;
}

.invoice-buyer-box {
  border-right: 0.5px solid #b9852f;
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
  border-right: 0.5px solid #bd914c;
  border-bottom: 0.5px solid #70420d;
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
  border-right: 0.5px solid #d7bd8b;
  border-bottom: 0.5px solid #eee1c7;
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
  white-space: nowrap;
}

.invoice-table .amount-highlight {
  font-size: 12.5px;
  white-space: nowrap;
}

.invoice-table .gst-rate-cell {
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
  border-top: 0.5px solid #a66c18;
  border-bottom: 0.5px solid #b45309;
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
  border-top: 0.5px solid #8b5a18;
  flex: 0 0 auto;
}

.invoice-footer-grid {
  display: grid;
  border-bottom: 0.5px solid #b9852f;
  align-items: stretch;
}

.invoice-footer-cell {
  min-width: 0;
  min-height: 38mm;
  border-right: 0.5px solid #caa25e;
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
  border: 0.5px solid #c7a56b;
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
  border-top: 0.5px solid #9b671c;
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
  border: 0.5px solid #111827;
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
  border-bottom: 0.5px solid #111827;
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
  border-bottom: 0.5px solid #111827;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.4;
}

.order-party-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 14px;
  border-bottom: 0.5px solid #111827;
  font-size: 14px;
  font-weight: 800;
  gap: 12px;
}

.order-party-right {
  text-align: right;
  line-height: 1.55;
}

.order-footer {
  border-top: 0.5px solid #111827;
  padding: 8px 14px 12px;
}

.order-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid #d7dde7;
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
  border: 0.5px solid #c8b77f;
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
  border: 0.5px solid rgba(190, 145, 39, 0.18);
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
  border-bottom: 0.5px solid #b8a77a;
  background: rgba(255,255,255,.76);
  color: #3d2430;
  font-size: 15px;
  padding: 6px 12px 2px;
}

.invoice-contact-line {
  min-height: 6mm;
  padding: 2px 12px 5px;
  border-bottom: 0.5px solid #8a7c58;
  background: rgba(255,255,255,.76);
  color: #352b25;
  font-size: 10px;
}

.invoice-party-grid {
  grid-template-columns: 61% 39%;
  border-bottom: 0;
  background: rgba(255,255,255,.64);
}

.invoice-buyer-box, .invoice-meta-box { position: relative; min-height: 25mm; padding: 5mm 4mm 2mm; margin: 6mm 5mm 2mm; box-sizing: border-box; border: 0.5px solid #9ca3af; border-radius: 2.5mm; }
.invoice-buyer-name { font-size: 15px; font-weight: 700; text-transform: uppercase; }
.invoice-buyer-label { font-size: 11px; font-weight: 900; text-transform: uppercase; }
.invoice-buyer-details, .invoice-meta-row { font-size: 10px; }
.invoice-meta-row { padding: 1px 0; }
.invoice-meta-row strong:last-child { font-size: 10.5px; }
.parasmani-card-title { position: absolute; top: -5mm; left: 4mm; min-width: 28mm; padding: 0 2px; border-radius: 0; background: transparent; color: #374151; font-size: 9px; font-weight: 900; text-transform: uppercase; }

.invoice-table-area { flex: 0 0 auto; padding: 2.5mm 6mm 0; }
.invoice-table { flex: none; height: auto; background: rgba(255,255,255,.68); font-size: 10px; }
.gst-invoice-page .invoice-table { min-height: 38mm; }
.gst-invoice-page .invoice-table tbody td { vertical-align: top; padding-top: 5px; }
.invoice-table th {
  padding: 4px 2px;
  border: 0.5px solid #5f5a4e;
  background: rgba(255,255,255,.9);
  color: #24211d;
  font-size: 9.5px;
  white-space: normal;
  line-height: 1.1;
}
.invoice-table td { height: 6mm; padding: 3px; border: 0.5px solid #716b5d; }
.invoice-table .numeric-highlight, .invoice-table .gst-rate-cell, .invoice-table .amount-highlight { font-size: 10.5px; }
.invoice-table .product-cell { font-size: 11px; }
.invoice-filler-row { display: none; }
.invoice-table tfoot td { background: transparent; color: #29251f; border: 0; border-top: 0.5px solid #716b5d; }

.invoice-footer { flex: 1 1 auto; border: 0; padding: 2mm 6mm 3mm; }
.invoice-footer-grid { margin-left: auto; width: 58%; border: 0; grid-template-columns: 0 0 100% !important; }
.invoice-footer-cell { min-height: 0; border: 0; padding: 0; font-size: 9px; }
.invoice-footer-cell:nth-child(1), .invoice-footer-cell:nth-child(2) { display: none; }
.invoice-total-row { padding: 2px 8px; border-bottom: 0.5px solid #817762; font-size: 10px; }
.invoice-total-row span:last-child { font-size: 10px; }
.invoice-total-row.net { margin: 0; padding: 4px 8px; background: rgba(75, 85, 99, .08); color: #1f2937; font-size: 12px; }
.invoice-total-row.net span:last-child { font-size: 12px; }
.invoice-signature-row { min-height: 25mm; padding: 10px 8px; grid-template-columns: 1fr 1fr; }
.invoice-amount-words::after { content: "Customer Signatory"; display: block; margin-top: 16mm; font-size: 10px; font-weight: 900; }
.invoice-signature { font-size: 9px; }
.invoice-signature img { height: 42px; }

.invoice-page-body::after {
  content: none;
}

.parasmani-lower-grid { display: grid; grid-template-columns: 62% 38%; gap: 4mm; margin-top: 2mm; }
.parasmani-left-column { display: flex; flex-direction: column; gap: 2mm; }
.parasmani-right-column { display: flex; flex-direction: column; }
.parasmani-words { min-height: 18mm; padding: 2mm; box-sizing: border-box; border: 0.5px solid #9ca3af; border-radius: 3mm; display: flex; flex-direction: column; font-size: 9px; line-height: 1.2; }
.parasmani-box-title { color: #374151; font-weight: 900; text-transform: uppercase; }
.parasmani-customer-sign {
  margin-top: 2mm;
  padding-top: 4mm;
  font-size: 6px;
  text-align: left;
  padding-left: 2mm;
}
.parasmani-customer-sign span {
  display: inline-block;
  width: 35mm;
  border: none;
  border-bottom: 0.5px solid #9ca3af;
  text-align: center;
  padding-bottom: 1mm;
  font-weight: 900;
  text-transform: uppercase;
}
.parasmani-authorized-sign {
  margin-top: 4mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.parasmani-sign-line {
  margin-top: 8mm;
  width: 100%;
  display: flex;
  justify-content: center;
  font-size: 6px;
}
.parasmani-sign-line span {
  display: inline-block;
  width: 40mm;
  border: none;
  border-bottom: 0.5px solid #9ca3af;
  text-align: center;
  padding-bottom: 1mm;
  font-weight: 900;
  text-transform: uppercase;
}
.parasmani-for { margin-top: 1mm; text-align: center; color: #111827; font-size: 7px; font-weight: 900; }
.parasmani-totals { border-collapse: collapse; width: 100%; font-size: 9px; }
.parasmani-totals td { padding: 2px 8px; border-bottom: 0.5px solid #e5e7eb; }
.parasmani-totals td:last-child { text-align: right; font-weight: 900; }
.parasmani-totals .total { background: #4b5563; color: white; font-weight: 900; }
.parasmani-totals .net { color: #111827; font-size: 11px; font-weight: 900; }
.parasmani-totals .parasmani-write-space td { height: 9mm; border-bottom: 0.5px solid #e5e7eb; background: transparent; }
.parasmani-info-box { min-height: 25mm; padding: 3mm; box-sizing: border-box; border: 0.5px solid #9ca3af; border-radius: 2mm; font-size: 10px; line-height: 1.3; }
.parasmani-info-box h4 { margin: -3mm -3mm 2mm; padding: 3px 8px; border-radius: 2mm 2mm 0 0; background: #4b5563; color: white; text-align: center; font-size: 10px; }
.parasmani-qr { display: flex; align-items: center; gap: 4mm; }
.parasmani-qr img, .parasmani-qr svg { width: 19mm; height: 19mm; object-fit: contain; }
.parasmani-bank-with-qr { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2mm; }
.parasmani-bank-with-qr > img, .parasmani-bank-with-qr svg, .parasmani-bank-with-qr > div svg { width: 19mm; height: 19mm; object-fit: contain; }
.parasmani-bank-details { padding-left: 2mm; border-left: 0.5px solid #d1d5db; }
.parasmani-footer-banner { position: relative; margin-top: 2mm; }
.parasmani-footer-banner img { display: block; width: 100%; height: 29mm; object-fit: fill; }
.parasmani-page-number { position: absolute; right: 3mm; bottom: 1.5mm; color: #4b2a12; font-size: 7px; font-weight: 900; }

.parasmani-text-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fffdf5;
  color: #111827;
  text-align: center;
  padding: 10px 10px 32px; /* increased bottom padding to avoid sticking to the line */
  box-sizing: border-box;
}
.parasmani-header-title {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 1px;
  margin: 0 0 2px 0;
  color: #111827;
  text-transform: uppercase;
}
.parasmani-header-subtitle-main {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: #111827;
}
.parasmani-header-subtitle {
  font-size: 9px;
  font-weight: 700;
  margin: 0 0 3px 0;
  color: #4b2a12;
  text-transform: uppercase;
}
.parasmani-header-details {
  font-size: 8px;
  font-weight: 500;
  margin: 0;
  color: #35200d;
}

/* B&W Layout preview styles */
.invoice-document.bw-mode .invoice-sheet {
  background: #ffffff !important;
  border-color: #666666 !important;
  box-shadow: none !important;
  color: #000000 !important;
}
.invoice-document.bw-mode .invoice-sheet::before,
.invoice-document.bw-mode .invoice-sheet::after {
  display: none !important;
  content: none !important;
}
.invoice-document.bw-mode .invoice-top-line {
  background: transparent !important;
  border-bottom: 0.5px solid #666666 !important;
  color: #000000 !important;
}
.invoice-document.bw-mode .invoice-document-heading {
  color: #000000 !important;
}
.invoice-document.bw-mode .invoice-buyer-box,
.invoice-document.bw-mode .invoice-meta-box,
.invoice-document.bw-mode .parasmani-words,
.invoice-document.bw-mode .parasmani-info-box,
.invoice-document.bw-mode .invoice-table td,
.invoice-document.bw-mode .invoice-table th,
.invoice-document.bw-mode .parasmani-totals td {
  border-color: #666666 !important;
  background: transparent !important;
  color: #000000 !important;
}
.invoice-document.bw-mode .parasmani-info-box h4 {
  background: transparent !important;
  color: #000000 !important;
  border-bottom: 0.5px solid #666666 !important;
  font-weight: 900 !important;
  margin-bottom: 2mm !important;
}
.invoice-document.bw-mode .parasmani-totals .total {
  background: transparent !important;
  color: #000000 !important;
  border-top: 0.5px solid #666666 !important;
  border-bottom: 0.5px solid #666666 !important;
}
.invoice-document.bw-mode .parasmani-totals .net {
  background: transparent !important;
  color: #000000 !important;
}
.invoice-document.bw-mode .invoice-table th {
  background: transparent !important;
  color: #000000 !important;
  font-weight: 900 !important;
}
.invoice-document.bw-mode .invoice-buyer-name,
.invoice-document.bw-mode .parasmani-box-title,
.invoice-document.bw-mode .parasmani-card-title,
.invoice-document.bw-mode .parasmani-header-title,
.invoice-document.bw-mode .parasmani-header-subtitle-main,
.invoice-document.bw-mode .parasmani-header-subtitle,
.invoice-document.bw-mode .parasmani-header-details {
  color: #000000 !important;
}
.invoice-document.bw-mode .parasmani-footer-banner img {
  visibility: hidden !important;
}
.invoice-document.bw-mode .invoice-signature-company {
  color: #000000 !important;
}

/* Screen styles for pre-printed mode */
.invoice-document.preprinted-paper .invoice-letterhead-image {
  visibility: hidden !important;
  height: 47mm !important;
  border-bottom: 0 !important;
}
.invoice-document.preprinted-paper .parasmani-footer-banner,
.invoice-document.preprinted-paper:not(.show-firm-active) .parasmani-for {
  visibility: hidden !important;
}

@media print {
  @page {
    size: 7.5in 10in;
    margin: 0;
  }

  html,
  body,
  #root {
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
     artwork and colour fills consume toner and turn into a dark grey page. Only applies in B&W or preprinted modes. */
  .invoice-document.bw-mode .invoice-sheet,
  .invoice-document.bw-mode .invoice-sheet *,
  .invoice-document.preprinted-paper .invoice-sheet,
  .invoice-document.preprinted-paper .invoice-sheet * {
    background-color: transparent !important;
    background-image: none !important;
    color: #000000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .invoice-document.bw-mode .invoice-sheet::before,
  .invoice-document.bw-mode .invoice-sheet::after,
  .invoice-document.preprinted-paper .invoice-sheet::before,
  .invoice-document.preprinted-paper .invoice-sheet::after {
    display: none !important;
    content: none !important;
  }

  .invoice-document.preprinted-paper:not(.show-firm-active) .invoice-letterhead-image,
  .invoice-document.bw-mode .parasmani-footer-banner img,
  .invoice-document.preprinted-paper .parasmani-footer-banner img {
    visibility: hidden !important;
  }

  .invoice-document.bw-mode .invoice-sheet,
  .invoice-document.bw-mode .invoice-table th,
  .invoice-document.bw-mode .invoice-table td,
  .invoice-document.bw-mode .invoice-buyer-box,
  .invoice-document.bw-mode .invoice-meta-box,
  .invoice-document.bw-mode .parasmani-words,
  .invoice-document.bw-mode .parasmani-info-box,
  .invoice-document.bw-mode .parasmani-totals td,
  .invoice-document.preprinted-paper .invoice-sheet:not(.preprinted-paper),
  .invoice-document.preprinted-paper .invoice-table th,
  .invoice-document.preprinted-paper .invoice-table td,
  .invoice-document.preprinted-paper .invoice-buyer-box,
  .invoice-document.preprinted-paper .invoice-meta-box,
  .invoice-document.preprinted-paper .parasmani-words,
  .invoice-document.preprinted-paper .parasmani-info-box,
  .invoice-document.preprinted-paper .parasmani-totals td {
    border-width: 0.5px !important;
    border-color: #666666 !important;
  }

  .parasmani-customer-sign span,
  .parasmani-sign-line span {
    border: none !important;
    border-bottom: 0.5px solid #666666 !important;
  }

  .parasmani-totals .total {
    border-top: 0.5px solid #666666 !important;
    border-bottom: 0.5px solid #666666 !important;
  }

  .invoice-page * {
    font-weight: normal !important;
  }

  .invoice-document.preprinted-paper:not(.show-firm-active) .invoice-letterhead-image,
  .invoice-document.preprinted-paper .parasmani-footer-banner,
  .invoice-document.preprinted-paper:not(.show-firm-active) .parasmani-for {
    visibility: hidden !important;
  }

  /* 8 mm page inset + 47 mm spacer = content begins at about 55 mm,
     immediately below the stationery header measured in the supplied photo. */
  .invoice-document.preprinted-paper .invoice-letterhead-image {
    height: 47mm !important;
    border: 0 !important;
  }

  /* Preserve the pre-printed footer area (it begins at roughly 233 mm, leaving 13 mm spacer). */
  .invoice-document.preprinted-paper .parasmani-footer-banner,
  .invoice-document.preprinted-paper .parasmani-footer-banner img {
    height: 13mm !important;
  }

  .invoice-document.show-firm-active .invoice-letterhead-image,
  .invoice-document.show-firm-active.preprinted-paper .invoice-letterhead-image,
  .invoice-document.show-firm-active.print-preprinted-active .invoice-letterhead-image {
    visibility: visible !important;
  }
  .invoice-document.show-firm-active .parasmani-text-header,
  .invoice-document.show-firm-active.preprinted-paper .parasmani-text-header,
  .invoice-document.show-firm-active.print-preprinted-active .parasmani-text-header {
    visibility: visible !important;
  }
  .invoice-document.show-firm-active .parasmani-for,
  .invoice-document.show-firm-active.preprinted-paper .parasmani-for,
  .invoice-document.show-firm-active.print-preprinted-active .parasmani-for {
    visibility: visible !important;
  }
}

.invoice-document.print-preprinted-active:not(.show-firm-active) .invoice-letterhead-image,
.invoice-document.print-preprinted-active .parasmani-footer-banner,
.invoice-document.print-preprinted-active:not(.show-firm-active) .parasmani-for {
  visibility: hidden !important;
}
.invoice-document.print-preprinted-active .invoice-letterhead-image {
  height: 47mm !important;
  border: 0 !important;
}
.invoice-document.print-preprinted-active .parasmani-footer-banner,
.invoice-document.print-preprinted-active .parasmani-footer-banner img {
  height: 13mm !important;
}
.invoice-document.print-preprinted-active .invoice-sheet {
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  background: #ffffff !important;
}
.invoice-document.show-firm-active .invoice-letterhead-image,
.invoice-document.show-firm-active.preprinted-paper .invoice-letterhead-image,
.invoice-document.show-firm-active.print-preprinted-active .invoice-letterhead-image {
  visibility: visible !important;
}
.invoice-document.show-firm-active .parasmani-text-header,
.invoice-document.show-firm-active.preprinted-paper .parasmani-text-header,
.invoice-document.show-firm-active.print-preprinted-active .parasmani-text-header {
  visibility: visible !important;
}
.invoice-document.show-firm-active .parasmani-for,
.invoice-document.show-firm-active.preprinted-paper .parasmani-for,
.invoice-document.show-firm-active.print-preprinted-active .parasmani-for {
  visibility: visible !important;
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
  const [pregeneratedPdf, setPregeneratedPdf] = useState(null);
  const [invoiceMode, setInvoiceMode] = useState("color"); // 'color', 'preprinted', 'bw'
  const [designMode, setDesignMode] = useState(false);
  const [selectedDesignLabel, setSelectedDesignLabel] = useState("Nothing selected");
  const [tableColumnWidths, setTableColumnWidths] = useState(GST_COLUMN_WIDTHS);
  const selectedDesignElement = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showParasmaniName, setShowParasmaniName] = useState(true);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.id = "a4-print-css";
    styleTag.textContent = A4_PRINT_STYLE;
    document.head.appendChild(styleTag);
    return () => {
      document.getElementById("a4-print-css")?.remove();
    };
  }, [A4_PRINT_STYLE]);


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

  useEffect(() => {
    if (!loading && invoice && !error && !designMode) {
      const timer = setTimeout(async () => {
        try {
          const blob = await createPdfBlob();
          if (blob) {
            setPregeneratedPdf(blob);
          }
        } catch (err) {
          console.error("Background PDF generation failed:", err);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, invoice, error, designMode]);

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
      paymentUpiId: settings.upiId || FALLBACK_SHOP.paymentUpiId,
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



  const createExportBlob = () => createPdfBlob();

  const handlePrint = async () => {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768;

    if (isMobile) {
      if (!invoice || pdfBusy) return;
      setPdfBusy(true);
      try {
        const filename = getExportFilename("pdf");
        const blob = pregeneratedPdf || (await createPdfBlob());
        if (!blob) {
          window.print();
          return;
        }

        const sharedFile = new File([blob], filename, {
          type: "application/pdf",
        });

        // Trigger native mobile share/print modal if supported
        if (navigator.canShare && navigator.canShare({ files: [sharedFile] })) {
          try {
            await navigator.share({
              files: [sharedFile],
              title: filename,
              text: `${docLabel} #${invoice?.invoiceNumber}`,
            });
            return;
          } catch (shareErr) {
            if (shareErr.name === "AbortError") return;
          }
        }

        // Fallback: Open PDF in new tab where Android system PDF viewer handles printing cleanly
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (!win) {
          downloadBlob(blob, filename);
        } else {
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
      } catch (err) {
        console.error("Mobile print fallback:", err);
        window.print();
      } finally {
        setPdfBusy(false);
      }
    } else {
      window.print();
    }
  };

  // Opens the invoice as a PDF blob in a new Chrome tab.
  // From Chrome's built-in PDF viewer the user can print directly to any installed printer.
  const handleOpenAsPdf = async () => {
    if (!invoice || pdfBusy) return;
    setPdfBusy(true);
    try {
      const blob = await createExportBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, "_blank");
      // Revoke after a generous delay so the PDF fully loads in the new tab
      if (tab) setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally {
      setPdfBusy(false);
    }
  };

  const setDesignEditing = (enabled) => {
    setPregeneratedPdf(null);
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
      alert("Customer mobile number nahi mila. Kripya invoice mein customer phone number add karein.");
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const pdfViewLink = `${window.location.origin}/invoices/print/${invoice._id}`;

    // 📱 PHONE / MOBILE DEVICE:
    // Opens customer's direct WhatsApp chat with pre-filled PDF Link (0 share menus, just press Send!)
    if (isMobile) {
      const message = `📄 *Invoice PDF:* ${pdfViewLink}`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // 💻 LAPTOP / PC BROWSER:
    // Tries to share actual PDF file directly or downloads PDF file & opens WhatsApp Web/Desktop chat!
    setWhatsAppBusy(true);
    try {
      const filename = getExportFilename("pdf");
      let blob = pregeneratedPdf;
      if (!blob) {
        blob = await createExportBlob(filename);
      }
      if (!blob) return;

      const sharedFile = new File([blob], filename, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [sharedFile] })) {
        await navigator.share({
          files: [sharedFile],
          title: filename,
        });
        return;
      }

      const messageText = `📄 *Invoice PDF:* ${pdfViewLink}`;
      downloadBlob(blob, filename);
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("WhatsApp share failed:", err);
        const messageText = `📄 *Invoice PDF:* ${pdfViewLink}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`, "_blank", "noopener,noreferrer");
      }
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
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setInvoiceMode("color")}
              className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${invoiceMode === "color"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200"
                }`}
            >
              1. Color Invoice (Header & Footer)
            </button>
            <button
              type="button"
              onClick={() => setInvoiceMode("bw_with_header")}
              className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${invoiceMode === "bw_with_header"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200"
                }`}
            >
              2. B&W Invoice (with Header)
            </button>
            <button
              type="button"
              onClick={() => setInvoiceMode("preprinted")}
              className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${invoiceMode === "preprinted"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-200"
                }`}
            >
              3. Pre-Printed (No Header/Footer)
            </button>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-900">
            <input
              type="checkbox"
              checked={showParasmaniName}
              onChange={(event) => setShowParasmaniName(event.target.checked)}
              className="h-4 w-4 accent-blue-700"
            />
            Show Parasmani Name
          </label>
          <button
            type="button"
            onClick={() => setDesignEditing(!designMode)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-violet-700"
          >
            {designMode ? "Close Designer" : "Edit Design"}
          </button>
          {/* ── Primary action: Print (No Save) — prints the currently selected template mode ── */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700"
          >
            <Printer size={17} />
            Print (No Save)
          </button>

          {/* ── Open as PDF in Chrome viewer — lets user pick any installed printer ── */}
          <button
            onClick={handleOpenAsPdf}
            disabled={pdfBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FileText size={17} />
            {pdfBusy ? "Opening..." : "Open as PDF"}
          </button>

          {/* ── Download PDF — explicit save to disk ── */}
          <button
            onClick={handleDownloadFile}
            disabled={pdfBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Download size={17} />
            {pdfBusy ? "Generating..." : "Download PDF"}
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={whatsAppBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            title="Open WhatsApp chat directly for this customer"
          >
            <MessageCircle size={17} />
            {whatsAppBusy ? "Preparing..." : "Send WhatsApp"}
          </button>



          <Link
            to={`/invoices/edit/${invoice?._id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600"
          >
            <Pencil size={17} />
            Edit {docLabel}
          </Link>
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
          className={`invoice-document ${invoiceMode === "preprinted" ? "preprinted-paper" : ""} ${invoiceMode === "bw_with_header" ? "bw-mode show-firm-active" : ""} ${invoiceMode === "color" ? "color-mode" : ""} ${isPrinting && invoiceMode === "preprinted" ? "print-preprinted-active" : ""} ${showParasmaniName ? "show-firm-active" : ""}`}
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
                    showParasmaniName={showParasmaniName}
                    invoiceMode={invoiceMode}
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
                        showParasmaniName={showParasmaniName}
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

const InvoiceHeader = ({ invoice, isGst, showParasmaniName, docHeading, shop, invoiceMode }) => {
  const displayName = invoice?.customerName || invoice?.farmer?.name || "Walk-in Customer";
  const displayMobile = invoice?.customerMobile || invoice?.farmer?.mobileNumber || "-";
  const rawAddressParts = [
    invoice?.customerAddress,
    invoice?.customerVillage,
    invoice?.farmer?.address,
    invoice?.farmer?.village,
  ];
  const customerAddress = Array.from(
    new Set(
      rawAddressParts
        .filter(Boolean)
        .map((str) => String(str).trim())
        .filter((str) => str !== "" && str !== "Counter Sale")
    )
  ).join(", ");

  return (
    <>
      <div className="invoice-letterhead-image">
        {showParasmaniName || invoiceMode === "bw_with_header" ? (
          <div className="parasmani-text-header">
            <h1 className="parasmani-header-title">PARASMANI</h1>
            <h2 className="parasmani-header-subtitle-main">Murarilal Garg & Sons</h2>
            <p className="parasmani-header-subtitle">Gold, Silver & Diamond Jewellery · Hallmarked Ornaments · Custom Designs</p>
          </div>
        ) : (
          <img src="/parasmani-invoice-reference.png" alt="Parasmani jewellery letterhead" />
        )}
      </div>

      <div className="invoice-top-line">
        <div />
        <div className="invoice-document-heading">{isGst ? "TAX INVOICE" : "ESTIMATE / BILL"}</div>
        <div />
      </div>

      <div className="invoice-party-grid">
        <div className="invoice-buyer-box">
          <span className="parasmani-card-title">Bill To</span>
          <span className="invoice-muted-label invoice-buyer-label">Name:</span>
          <div className="invoice-buyer-content">
            <p className="invoice-buyer-name">{displayName}</p>
            <div className="invoice-buyer-details">
              <div>Mob.: {displayMobile}</div>
              {customerAddress && <div>Address: {customerAddress}</div>}
              {invoice?.farmer?.gstNumber && <div>GSTIN: {invoice.farmer.gstNumber}</div>}
              {invoice?.farmer?.panNumber && <div>PAN: {invoice.farmer.panNumber}</div>}
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
          {isGst && (
            <div className="invoice-meta-row">
              <strong>GSTIN</strong>
              <strong>{shop?.gstNumber || "23AAAHM7492L1ZV"}</strong>
            </div>
          )}
          <div className="invoice-meta-row">
            <strong>Document Type</strong>
            <strong data-design-movable="true" data-design-special-id="doc-type">
              {isGst ? "GST Invoice" : "Estimate Order"}
            </strong>
          </div>
          {!isGst && (
            <div className="invoice-meta-row">
              <strong>Mobile No.</strong>
              <strong>7898088910</strong>
            </div>
          )}
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
    ? ["SR NO", "PRODUCT DESCRIPTION", "GS WT.", "LESS WT.", "NT WT.", "PURITY", "RATE", "MAKING (%)", "MAKING AMT", "STONE CHG.", "FINAL AMT"]
    : ["S. No.", "Jewellery", "Purity", "Gross / Net Wt.", "Pcs.", "Rate", "Making", "Stone", "Amount"];
  const printableHeadings = isGst
    ? headings.filter((heading) => !heading.startsWith("MAKING AMT"))
    : headings;
  const totalNetWeight = (invoice?.products || []).reduce(
    (sum, item) => sum + (toNumber(item.netWeight) || 0),
    0
  );

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
                  <td className="rate-cell numeric-highlight">
                    {formatNumber(item.selectedRate || item.metalRatePerGram)}
                  </td>
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
                  <td className="rate-cell numeric-highlight">
                    {formatNumber(item.selectedRate || item.metalRatePerGram)}
                  </td>
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
      {showPageTotal && (
        <tfoot>
          <tr>
            <td colSpan={isGst ? 4 : 3} style={{ textAlign: "right", fontWeight: "bold" }}>Total Net Wt:</td>
            <td className="center-cell" style={{ fontWeight: "900" }}>{formatCompactNumber(totalNetWeight)} g</td>
            <td colSpan={4} style={{ textAlign: "right", fontWeight: "bold" }}>
              {showTax ? "Total Taxable Amount" : ""}
            </td>
            <td className="amount-cell amount-highlight">
              {showTax ? formatNumber(invoice?.subTotal) : ""}
            </td>
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
  showParasmaniName,
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
  const totalNetWeight = (invoice?.products || []).reduce(
    (sum, item) => sum + (toNumber(item.netWeight) || 0),
    0
  );

  return (
    <div className="invoice-footer">
      <div className="parasmani-lower-grid">
        <div className="parasmani-left-column">
          <div className="parasmani-words">
            <div className="parasmani-box-title">Amount chargeable in words</div>
            <div>{amountInWords} Only</div>
          </div>

          <div className="parasmani-info-box">
            <h4>Scan QR Code / Company Bank Details</h4>
            <div className="parasmani-bank-with-qr">
              <div className="parasmani-qr-container">
                <QRCodeSVG
                  value={`upi://pay?pa=${shop.paymentUpiId}&pn=${encodeURIComponent(shop.accountHolderName || shop.shopName)}&cu=INR&tn=Invoice%20${encodeURIComponent(invoice?.invoiceNumber || "")}`}
                  size={72}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="parasmani-bank-details"><strong>UPI ID</strong>: {shop.paymentUpiId}<br />Bank Name : <strong>{shop.bankName}</strong><br />A/c Holder : <strong>{shop.accountHolderName}</strong><br />A/c No. : <strong>{shop.accountNumber}</strong><br />Branch : <strong>{shop.bankBranch}</strong><br />IFSC Code : <strong>{shop.ifscCode}</strong></div>
            </div>
          </div>

          <div className="parasmani-customer-sign">
            <span>Customer Signatory</span>
          </div>
        </div>

        <div className="parasmani-right-column">
          <table className="parasmani-totals"><tbody>
            <tr><td>Total Net Weight</td><td><strong>{formatCompactNumber(totalNetWeight)} g</strong></td></tr>
            <tr><td>{isGst ? "Taxable Amount" : "Estimate Amount"}</td><td>₹ {formatNumber(invoice?.subTotal)}</td></tr>
            {isGst && <tr><td>CGST ({formatCompactNumber(gstRate / 2)}%)</td><td>₹ {formatNumber(cgstAmount)}</td></tr>}
            {isGst && <tr><td>SGST ({formatCompactNumber(gstRate / 2)}%)</td><td>₹ {formatNumber(cgstAmount)}</td></tr>}
            <tr><td>Round Off</td><td>₹ {formatNumber(roundOff)}</td></tr>
            <tr className="total"><td>Total Amount</td><td>₹ {formatNumber(grandTotalRounded)}</td></tr>
            <tr><td>Amount Received</td><td>₹ {formatNumber(receivedAmount)}</td></tr>
            <tr className="net"><td>Net Receivable Amount</td><td>₹ {formatNumber(balanceAmount)} DR</td></tr>
            <tr className="parasmani-write-space"><td colSpan="2" aria-label="Blank space for handwritten note" /></tr>
          </tbody></table>

          <div className="parasmani-authorized-sign">
            <div className="parasmani-for">For : {showParasmaniName ? "PARASMANI MURALILAL GARG AND SONS" : "PARASMANI"}</div>
            <div className="parasmani-sign-line">
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
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
