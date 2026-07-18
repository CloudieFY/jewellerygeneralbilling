import Settings from "../models/Settings.js";

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

  // Atomically increment the counter and return updated document
  const updated = await Settings.findOneAndUpdate(
    {},
    { $inc: { [counterField]: 1 } },
    {
      new: true,        // return updated doc
      upsert: true,     // create if no settings doc exists
      setDefaultsOnInsert: true,
    }
  );

  const prefix = updated[prefixField] || defaultPrefix;
  const counter = updated[counterField];

  // Zero-pad to 4 digits: 0001, 0002, ...
  const padded = String(counter).padStart(4, "0");

  return `${prefix}-${padded}`;
};

export default generateDocumentNumber;