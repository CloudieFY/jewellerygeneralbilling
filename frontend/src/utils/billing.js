export const RATE_TYPES = ["Rate A"];
export const toNumber = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
export const roundWeight = (value) => Math.round((toNumber(value) + Number.EPSILON) * 1000) / 1000;
export const getProductRate = (product) => toNumber(product?.metalRatePerGram || product?.cashRate);
export const calculateLine = (item, product, _rateType, gstEnabled = true) => {
  const quantity = toNumber(item?.quantity, 1);
  const rawGross = item?.grossWeight !== "" && item?.grossWeight !== undefined && item?.grossWeight !== null && toNumber(item?.grossWeight) > 0
    ? toNumber(item.grossWeight)
    : item?.netWeight !== "" && item?.netWeight !== undefined && item?.netWeight !== null && toNumber(item?.netWeight) > 0
      ? toNumber(item.netWeight)
      : toNumber(product?.grossWeight);

  const unitGrossWeight = rawGross;
  const unitStoneWeight = toNumber(item?.stoneWeight ?? product?.stoneWeight);
  const unitNetWeight = (item?.netWeight !== "" && item?.netWeight !== undefined && item?.netWeight !== null && toNumber(item?.netWeight) > 0 && (item?.grossWeight === "" || item?.grossWeight === undefined || toNumber(item?.grossWeight) === 0))
    ? toNumber(item.netWeight)
    : roundWeight(Math.max(unitGrossWeight - unitStoneWeight, 0));

  const netWeight = roundWeight(unitNetWeight * quantity);
  const grossWeight = roundWeight(unitGrossWeight * quantity);
  const stoneWeight = roundWeight(unitStoneWeight * quantity);
  const rate = item?.selectedRate !== "" && item?.selectedRate !== undefined ? toNumber(item.selectedRate) : getProductRate(product);
  const rateUnit = item?.rateUnit || "per_gram";
  let ratePerGram = rate;
  if (rateUnit === "per_10_gram") {
    ratePerGram = rate / 10;
  } else if (rateUnit === "per_kg") {
    ratePerGram = rate / 1000;
  }
  const metalValue = netWeight * ratePerGram;
  const wastagePercent = toNumber(item?.wastagePercent ?? product?.wastagePercent);
  const wastageAmount = metalValue * wastagePercent / 100;
  const makingCharge = toNumber(item?.makingCharge ?? product?.makingCharge);
  const makingChargeType = item?.makingChargeType || "per_gram";
  const makingChargeAmount = makingChargeType === "percent"
    ? metalValue * makingCharge / 100
    : makingChargeType === "per_piece"
      ? makingCharge * quantity
      : makingChargeType === "fixed" ? makingCharge : makingCharge * netWeight;
  const stoneValue = toNumber(item?.stoneValue ?? product?.stoneValue);
  const stoneValueType = item?.stoneValueType || "per_piece";
  const stoneValueAmount = stoneValueType === "per_gram"
    ? stoneValue * stoneWeight
    : stoneValueType === "fixed" ? stoneValue : stoneValue * quantity;
  const hallmarkCharge = toNumber(item?.hallmarkCharge);
  const discount = toNumber(item?.discount);
  const baseAmount = Math.max(metalValue + wastageAmount + makingChargeAmount + stoneValueAmount + hallmarkCharge - discount, 0);
  const gstRate = gstEnabled ? toNumber(item?.gstRate ?? product?.gstRate, 3) : 0;
  const gstAmount = baseAmount * gstRate / 100;
  return { quantity, netWeight, grossWeight, stoneWeight, rate, metalValue, wastagePercent, wastageAmount, makingChargeType, makingCharge, makingChargeAmount, stoneValue, stoneValueType, stoneValueAmount, hallmarkCharge, discount, baseAmount, gstRate, gstAmount, lineTotal: baseAmount + gstAmount, sqFt: 0 };
};
export const calculateInvoiceTotals = (items=[], products=[], rateType="Rate A", gstEnabled=true) => {
  const totals = items.reduce((t,item)=>{
    const l=calculateLine(item,products.find(p=>p._id===item.product),rateType,gstEnabled);
    return {
      subTotal: t.subTotal + l.baseAmount,
      totalGST: t.totalGST + l.gstAmount,
      totalNetWeight: roundWeight(t.totalNetWeight + l.netWeight),
      totalGrossWeight: roundWeight(t.totalGrossWeight + l.grossWeight),
      totalStoneWeight: roundWeight(t.totalStoneWeight + l.stoneWeight),
    };
  },{subTotal:0,totalGST:0,totalNetWeight:0,totalGrossWeight:0,totalStoneWeight:0});
  const exactTotal = totals.subTotal + totals.totalGST;
  const grandTotal = Math.round(exactTotal);
  const roundOff = Math.round((grandTotal - exactTotal + Number.EPSILON) * 100) / 100;
  return { ...totals, roundOff, grandTotal };
};
export const formatCurrency = (v) => `Rs ${toNumber(v).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
