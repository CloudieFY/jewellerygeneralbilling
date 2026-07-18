import { useEffect, useMemo, useState } from "react";
import { FolderTree, Package } from "lucide-react";
import API from "../../services/api";

const Categories = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const { data } = await API.get("/products");
        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, []);

  const categories = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const name = product.category || "Uncategorized";
      const current = map.get(name) || {
        name,
        count: 0,
      };

      current.count += 1;
      map.set(name, current);
    });

    return Array.from(map.values());
  }, [products]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
          Categories
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">
          Product Categories
        </h1>
        <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
          Categories are collected from product records.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <FolderTree size={42} className="mx-auto mb-4 text-slate-300" />
              <p className="font-bold text-slate-500">No categories found.</p>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.name}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Package size={22} />
                </div>
                <h2 className="text-xl font-black capitalize text-slate-950">
                  {category.name}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {category.count} products
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Categories;
