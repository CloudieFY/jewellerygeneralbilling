import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit3, Package, Scale } from "lucide-react";
import API from "../../services/api";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="rounded-3xl bg-white p-10 text-center font-bold">Loading product...</div>;
  if (!product) return <div className="rounded-3xl bg-white p-10 text-center font-bold">Product not found.</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/products" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-700"><ArrowLeft size={16} /> Back to Products</Link>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">{product.productName}</h1>
          <p className="mt-2 text-sm font-semibold capitalize text-slate-500">{product.metalType || "Jewellery"} inventory</p>
        </div>
        <Link to={`/products/edit/${product._id}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 font-black text-white"><Edit3 size={18} /> Edit Product</Link>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {[
          ["Available Inventory", `${Number(product.inventoryWeight || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })} g`, <Scale size={21} />],
          ["HSN / GST", `${product.hsnCode || "-"} / ${product.gstRate || 0}%`, <Package size={21} />],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">{icon}</div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-black capitalize text-slate-950">{value}</p>
          </div>
        ))}
      </section>
      {product.description && <section className="rounded-3xl border border-amber-200 bg-white p-6"><h2 className="text-xl font-black">Details</h2><p className="mt-3 text-slate-600">{product.description}</p></section>}
    </div>
  );
};

export default ProductDetails;
