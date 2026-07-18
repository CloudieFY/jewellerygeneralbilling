import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import ProductTable from "../../components/products/ProductsTable";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/products");
      setProducts(data.products || []);
    } catch (error) {
      toast.error("Failed to fetch products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await API.delete(`/products/${id}`);
      toast.success("Product deleted");
      getProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const filteredProducts = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) =>
      [product.productName, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [keyword, products]);

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Products
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Product List
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Manage flex printing products and their Rate A, Rate B, and Rate C
            per sq ft prices.
          </p>
        </div>

        <Link
          to="/products/add"
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Product
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Package size={22} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Total Products
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {products.length}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Rate Types
          </p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            3
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            Categories
          </p>
          <p className="mt-2 text-3xl font-black text-blue-700">
            {new Set(products.map((product) => product.category)).size}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name or category"
            className="input-field pl-11 pr-12"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Loading products...
        </div>
      ) : (
        <ProductTable products={filteredProducts} deleteProduct={deleteProduct} />
      )}
    </div>
  );
};

export default Products;
