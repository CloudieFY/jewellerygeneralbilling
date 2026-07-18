import { Link } from "react-router-dom";
import { Edit3, Eye, IndianRupee, Package, Trash2 } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

const ProductsTable = ({ products, deleteProduct }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Product Name",
                "Category",
                "Rate A",
                "Rate B",
                "Rate C",
                "GST %",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className={`px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-500 ${
                    heading === "Actions" ? "text-right" : ""
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <Package size={42} />
                    <p className="text-sm font-bold">No products found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products?.map((product) => (
                <tr key={product._id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 font-black text-blue-700">
                        {product.productName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-950">
                          {product.productName}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-5 text-sm font-semibold capitalize text-slate-600">
                    {product.category}
                  </td>

                  {[product.cashRate, product.creditRate, product.wholesaleRate].map(
                    (rate, index) => (
                      <td
                        key={index}
                        className="px-5 py-5 text-sm font-black text-slate-900"
                      >
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee size={13} className="text-blue-600" />
                          {Number(rate || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                    )
                  )}

                  <td className="px-5 py-5 text-sm font-semibold text-slate-600">
                    {product.gstRate || 0}%
                  </td>

                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/products/${product._id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white"
                        title="View"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition hover:bg-amber-600 hover:text-white"
                        title="Edit"
                      >
                        <Edit3 size={18} />
                      </Link>
                      {user?.role !== "operator" && (
                        <button
                          onClick={() => deleteProduct(product._id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;
