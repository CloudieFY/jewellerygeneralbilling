import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Package,
  Percent,
  Tag,
} from "lucide-react";
import API from "../../services/api";
import { formatCurrency } from "../../utils/billing";

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <Package size={48} className="mx-auto mb-4 text-slate-300" />
        <h1 className="text-2xl font-black text-slate-950">
          Product not found
        </h1>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>
      </div>
    );
  }

  const cards = [
    {
      label: "Category",
      value: product.category,
      icon: <Tag size={20} />,
    },
    {
      label: "GST %",
      value: `${product.gstRate || 0}%`,
      icon: <Percent size={20} />,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/products"
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>
          <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
            {product.productName}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {product.unit || "Sq Ft"} product
          </p>
        </div>

        <Link
          to={`/products/edit/${product._id}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
        >
          <Edit3 size={18} />
          Edit Product
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {card.icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-black capitalize text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Sq Ft Rates</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            ["Rate A", product.cashRate],
            ["Rate B", product.creditRate],
            ["Rate C", product.wholesaleRate],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                {label} / Sq Ft
              </p>
              <p className="mt-2 text-2xl font-black text-blue-700">
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {product.description && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Details</h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            {product.description}
          </p>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
