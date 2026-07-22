import Settings from "../models/Settings.js";
import Invoice from "../models/Invoice.js";

const getSequenceNumber = (value) => {
  const match = String(value || "").trim().match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const sequenceNumberPattern = (sequence) =>
  new RegExp(`(?:^|-)0*${sequence}$`, "i");

export const invoiceNumberExists = async (invoiceNumber, documentType, excludeId) => {
  const value = String(invoiceNumber || "").trim();
  const sequence = getSequenceNumber(value);
  const numberMatch = sequence === null
    ? { invoiceNumber: value }
    : { invoiceNumber: sequenceNumberPattern(sequence) };

  return Invoice.exists({
    ...numberMatch,
    documentType,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
};

export const reserveManualDocumentNumber = async (invoiceNumber, documentType) => {
  const sequence = getSequenceNumber(invoiceNumber);
  if (sequence === null) return;
  const counterField = documentType === "gst_invoice" ? "gstInvoiceCounter" : "orderCounter";
  await Settings.findOneAndUpdate(
    {},
    { $max: { [counterField]: sequence } },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

/**
 * Generate sequential document number.
 * documentType: "gst_invoice" → GST-INV-0001
 * documentType: "order"       → ORD-0001
 *
 * Uses atomic $inc on Settings counter to prevent duplicates.
 */
const generateDocumentNumber = async (documentType = "gst_invoice") => {
  // Determine which counter and prefix field to use
  const isGst = documentType === "gst_invoice";
  const counterField = isGst ? "gstInvoiceCounter" : "orderCounter";
  const prefixField = isGst ? "gstInvoicePrefix" : "orderPrefix";
  const defaultPrefix = isGst ? "GST-INV" : "ORD";

  // A manual number can reserve a sequence (for example "18" also reserves
  // GST-INV-0018). Keep incrementing atomically until an unused sequence is found.
  while (true) {
    const updated = await Settings.findOneAndUpdate(
      {},
      { $inc: { [counterField]: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const prefix = updated[prefixField] || defaultPrefix;
    const counter = updated[counterField];
    const candidate = `${prefix}-${String(counter).padStart(4, "0")}`;
    if (!await invoiceNumberExists(candidate, documentType)) return candidate;
  }
};

export default generateDocumentNumber;
