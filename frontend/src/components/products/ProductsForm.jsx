import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const defaults = {
  productName: "", category: "", sku: "", metalType: "gold", purity: "22K",
  fineness: "916", huid: "", hallmarked: false, hsnCode: "7113", unit: "gram",
  grossWeight: "", netWeight: "", stoneWeight: "", pieces: 1,
  metalRatePerGram: "", wastagePercent: "", makingChargeType: "per_gram",
  makingCharge: "", stoneValue: "", stoneValueType: "per_piece", gstRate: 3, quantity: 1, description: "",
};

const ProductForm = ({ initialData = {}, onSubmit, loading }) => {
  const [formData, setFormData] = useState(defaults);
  useEffect(() => {
    // Existing edit pages load their product asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Object.keys(initialData).length) setFormData({
      ...defaults,
      ...initialData,
      netWeight: Math.max(
        Number(initialData.grossWeight || 0) - Number(initialData.stoneWeight || 0),
        0,
      ),
    });
  }, [initialData]);
  const change = ({ target }) => setFormData((p) => {
    const value = target.type === "checkbox" ? target.checked : target.value;
    const next = { ...p, [target.name]: value };
    if (target.name === "grossWeight" || target.name === "stoneWeight") {
      next.netWeight = Math.max(
        Number(next.grossWeight || 0) - Number(next.stoneWeight || 0),
        0,
      ).toFixed(3).replace(/\.?0+$/, "");
    }
    return next;
  });
  const field = (name, label, type = "text", props = {}) => (
    <label className="space-y-2 text-xs font-black uppercase tracking-wider text-slate-600">
      {label}
      <input name={name} type={type} value={formData[name]} onChange={change}
        className="input-field normal-case tracking-normal" {...props} />
    </label>
  );

  return <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div><h2 className="text-2xl font-black text-slate-950">Jewellery Product Details</h2>
      <p className="mt-1 text-sm text-slate-500">Store the ornament, hallmark, weight and pricing details used during billing.</p></div>
    <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {field("productName", "Jewellery / Product Name", "text", { required: true, placeholder: "Gold Necklace" })}
      {field("category", "Category", "text", { required: true, placeholder: "Necklace, Ring, Bangle" })}
      {field("sku", "Tag / SKU Number")}
      <label className="space-y-2 text-xs font-black uppercase tracking-wider text-slate-600">Metal Type<select name="metalType" value={formData.metalType} onChange={change} className="input-field normal-case">{["gold","silver","platinum","diamond","imitation","other"].map(x=><option key={x}>{x}</option>)}</select></label>
      {field("purity", "Purity / Carat", "text", { placeholder: "22K" })}
      {field("fineness", "Fineness", "text", { placeholder: "916" })}
      {field("huid", "6-digit HUID", "text", { maxLength: 6 })}
      {field("hsnCode", "HSN Code")}
      <label className="flex items-center gap-3 self-end rounded-2xl bg-slate-50 p-4 text-sm font-bold"><input type="checkbox" name="hallmarked" checked={formData.hallmarked} onChange={change}/> BIS Hallmarked</label>
    </section>
    <section><h3 className="mb-4 text-lg font-black">Weight & Stock</h3><div className="grid grid-cols-1 gap-5 md:grid-cols-4">
      {field("grossWeight", "Gross Weight (g)", "number", { min: 0, step: .001 })}
      {field("stoneWeight", "Stone Weight (g)", "number", { min: 0, step: .001 })}
      {field("netWeight", "Net Metal Weight (Auto)", "number", { min: 0, step: .001, required: true, readOnly: true })}
      {field("pieces", "Pieces", "number", { min: 1, step: 1 })}
    </div></section>
    <section><h3 className="mb-4 text-lg font-black">Jewellery Pricing</h3><div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {field("metalRatePerGram", "Metal Rate / Gram", "number", { min: 0, step: .01, required: true })}
      {field("wastagePercent", "Wastage / VA %", "number", { min: 0, step: .01 })}
      <label className="space-y-2 text-xs font-black uppercase tracking-wider text-slate-600">Making Charge Type<select name="makingChargeType" value={formData.makingChargeType} onChange={change} className="input-field normal-case"><option value="per_gram">Per gram</option><option value="percent">% of metal value</option><option value="fixed">Fixed amount</option></select></label>
      {field("makingCharge", "Making Charge", "number", { min: 0, step: .01 })}
      {field("stoneValue", "Stone / Diamond Value", "number", { min: 0, step: .01 })}
      <label className="space-y-2 text-xs font-black uppercase tracking-wider text-slate-600">Stone Value Calculation<select name="stoneValueType" value={formData.stoneValueType} onChange={change} className="input-field normal-case"><option value="per_piece">Per piece</option><option value="per_gram">Per gram</option></select></label>
      {field("gstRate", "GST %", "number", { min: 0, step: .01 })}
    </div></section>
    <label className="block space-y-2 text-xs font-black uppercase tracking-wider text-slate-600">Description<textarea name="description" value={formData.description} onChange={change} className="input-field min-h-24 normal-case" /></label>
    <button disabled={loading} className="ml-auto flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-4 font-black text-white disabled:opacity-50"><Save size={19}/>{loading ? "Saving..." : "Save Jewellery Product"}</button>
  </form>;
};
export default ProductForm;
