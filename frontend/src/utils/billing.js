export const RATE_TYPES = ["Rate A"];
export const toNumber = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
export const getProductRate = (product) => toNumber(product?.metalRatePerGram || product?.cashRate);
export const calculateLine = (item, product, _rateType, gstEnabled = true) => {
  const quantity = toNumber(item?.quantity, 1);
  const unitGrossWeight = toNumber(item?.grossWeight ?? product?.grossWeight);
  const unitStoneWeight = toNumber(item?.stoneWeight ?? product?.stoneWeight);
  const unitNetWeight = Math.max(unitGrossWeight - unitStoneWeight, 0);
  const netWeight = unitNetWeight * quantity;
  const grossWeight = unitGrossWeight * quantity;
  const stoneWeight = unitStoneWeight * quantity;
  const rate = item?.selectedRate !== "" && item?.selectedRate !== undefined ? toNumber(item.selectedRate) : getProductRate(product);
  const metalValue = netWeight * rate;
  const wastagePercent = toNumber(item?.wastagePercent ?? product?.wastagePercent);
  const wastageAmount = metalValue * wastagePercent / 100;
  const makingCharge = toNumber(item?.makingCharge ?? product?.makingCharge);
  const makingChargeType = item?.makingChargeType || product?.makingChargeType || "per_gram";
  const makingChargeAmount = makingChargeType === "percent" ? metalValue * makingCharge / 100 : makingChargeType === "fixed" ? makingCharge * quantity : makingCharge * netWeight;
  const stoneValue = toNumber(item?.stoneValue ?? product?.stoneValue);
  const stoneValueType = item?.stoneValueType || product?.stoneValueType || "per_piece";
  const stoneValueAmount = stoneValueType === "per_gram"
    ? stoneValue * stoneWeight
    : stoneValue * quantity;
  const discount = toNumber(item?.discount);
  const baseAmount = Math.max(metalValue + wastageAmount + makingChargeAmount + stoneValueAmount - discount, 0);
  const gstRate = gstEnabled ? toNumber(item?.gstRate ?? product?.gstRate, 3) : 0;
  const gstAmount = baseAmount * gstRate / 100;
  return { quantity, netWeight, grossWeight, stoneWeight, rate, metalValue, wastagePercent, wastageAmount, makingChargeType, makingCharge, makingChargeAmount, stoneValue, stoneValueType, stoneValueAmount, discount, baseAmount, gstRate, gstAmount, lineTotal: baseAmount + gstAmount, sqFt: 0 };
};
export const calculateInvoiceTotals = (items=[], products=[], rateType="Rate A", gstEnabled=true) => items.reduce((t,item)=>{const l=calculateLine(item,products.find(p=>p._id===item.product),rateType,gstEnabled);return {subTotal:t.subTotal+l.baseAmount,totalGST:t.totalGST+l.gstAmount,grandTotal:t.grandTotal+l.lineTotal};},{subTotal:0,totalGST:0,grandTotal:0});
export const formatCurrency = (v) => `Rs ${toNumber(v).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
