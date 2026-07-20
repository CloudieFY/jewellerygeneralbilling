import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const defaults = {
  productName: "",
  metalType: "gold",
  inventoryWeight: "",
  inventoryUnit: "gram",
  hsnCode: "7113",
  gstRate: 3,
  description: "",
};

const ProductForm = ({ initialData = {}, onSubmit, loading }) => {
  const [formData, setFormData] = useState(defaults);

  useEffect(() => {
    if (!Object.keys(initialData).length) return;
    const storedGrams = Number(initialData.inventoryWeight ?? initialData.quantity ?? 0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      ...defaults,
      ...initialData,
      inventoryWeight: storedGrams,
      inventoryUnit: "gram",
    });
  }, [initialData]);

  const change = ({ target }) => {
    setFormData((previous) => ({ ...previous, [target.name]: target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const multiplier = formData.inventoryUnit === "kg" ? 1000 : 1;
    onSubmit({
      productName: formData.productName,
      metalType: formData.metalType,
      inventoryWeight: Number(formData.inventoryWeight || 0) * multiplier,
      hsnCode: formData.hsnCode,
      gstRate: Number(formData.gstRate || 0),
      description: formData.description,
    });
  };

  const fieldClass = "input-field normal-case tracking-normal";
  const labelClass = "space-y-2 text-xs font-black uppercase tracking-wider text-slate-600";

  return (
    <form onSubmit={submit} className="space-y-7 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-2xl font-black text-slate-950">Jewellery Inventory Product</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add the product and available stock weight. Jewellery details are entered manually while billing.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <label className={labelClass}>
          Product Name
          <input name="productName" value={formData.productName} onChange={change} className={fieldClass} placeholder="Gold Jewellery" required />
        </label>
        <label className={labelClass}>
          Metal Type
          <select name="metalType" value={formData.metalType} onChange={change} className={fieldClass}>
            {["gold", "silver", "platinum", "diamond", "imitation", "other"].map((metal) => <option key={metal} value={metal}>{metal}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Inventory Weight
          <input name="inventoryWeight" type="number" min="0" step="0.001" value={formData.inventoryWeight} onChange={change} className={fieldClass} placeholder="1" required />
        </label>
        <label className={labelClass}>
          Weight Unit
          <select name="inventoryUnit" value={formData.inventoryUnit} onChange={change} className={fieldClass}>
            <option value="gram">Gram</option>
            <option value="kg">Kilogram</option>
          </select>
        </label>
        <label className={labelClass}>
          HSN Code
          <input name="hsnCode" value={formData.hsnCode} onChange={change} className={fieldClass} />
        </label>
        <label className={labelClass}>
          GST %
          <input name="gstRate" type="number" min="0" step="0.01" value={formData.gstRate} onChange={change} className={fieldClass} />
        </label>
      </section>

      <label className={`block ${labelClass}`}>
        Description
        <textarea name="description" value={formData.description} onChange={change} className={`${fieldClass} min-h-24`} />
      </label>

      <button disabled={loading} className="ml-auto flex items-center gap-2 rounded-2xl bg-amber-700 px-6 py-4 font-black text-white disabled:opacity-50">
        <Save size={19} /> {loading ? "Saving..." : "Save Inventory Product"}
      </button>
    </form>
  );
};

export default ProductForm;
