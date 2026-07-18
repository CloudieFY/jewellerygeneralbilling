import { Trash2, IndianRupee } from "lucide-react";

const ProductRow = ({
  product,
  index,
  handleChange,
  removeProduct,
  billingType,
}) => {
  const selectedProduct = product.productsList?.find(p => p._id === product.product);
  
  let rate = 0;
  if (selectedProduct) {
    if (billingType === "credit") rate = selectedProduct.creditRate;
    else if (billingType === "cash") rate = selectedProduct.cashRate;
    else if (billingType === "wholesale") rate = selectedProduct.wholesaleRate;
  }

  const itemTotal = rate * (product.quantity || 0);
  const gstAmount = (itemTotal * (selectedProduct?.gstRate || 0)) / 100;
  const finalAmount = itemTotal + gstAmount;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors group border-b border-gray-100">
      <td className="py-4 px-2">
        <select
          value={product.product}
          onChange={(e) => handleChange(index, "product", e.target.value)}
          className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
        >
          <option value="">Select Product</option>
          {product.productsList?.map((item) => (
            <option key={item._id} value={item._id} disabled={item.quantity <= 0}>
              {item.productName} {item.quantity <= 0 ? '(Out of Stock)' : `(${item.quantity} available)`}
            </option>
          ))}
        </select>
      </td>
      
      <td className="py-4 px-2">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
            <IndianRupee size={12} />
            {rate.toLocaleString()}
          </span>
          {selectedProduct && (
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
              {billingType} rate
            </span>
          )}
        </div>
      </td>

      <td className="py-4 px-2">
        <input
          type="number"
          placeholder="Qty"
          value={product.quantity}
          onChange={(e) => handleChange(index, "quantity", e.target.value)}
          className="w-20 p-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-center"
          min="1"
        />
      </td>

      <td className="py-4 px-2">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-800">
            {selectedProduct?.gstRate || 0}%
          </span>
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
            ₹{gstAmount.toFixed(2)}
          </span>
        </div>
      </td>

      <td className="py-4 px-2">
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-green-700">
            ₹{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </td>

      <td className="py-4 px-2 text-right">
        <button
          type="button"
          onClick={() => removeProduct(index)}
          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          title="Remove Item"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default ProductRow;