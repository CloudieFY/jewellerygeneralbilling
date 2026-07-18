import { useEffect, useState } from "react";
import {
  Calendar,
  FileText,
  IndianRupee,
  Package,
  PlusCircle,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import API from "../../services/api";

const CreditForm = ({ onSubmit, loading }) => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    farmerId: "",
    amount: 0,
    description: "",
    dueDate: "",
    products: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, productRes] = await Promise.all([
          API.get("/farmers"),
          API.get("/products"),
        ]);
        setCustomers(customerRes.data.farmers || []);
        setProducts(productRes.data.products || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleCustomerChange = (event) => {
    const farmerId = event.target.value;
    const customer = customers.find((item) => item._id === farmerId);
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, farmerId }));
  };

  const calculateTotal = (updatedProducts) => {
    const total = updatedProducts.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );
    setFormData((prev) => ({ ...prev, products: updatedProducts, amount: total }));
  };

  const addProductToOrder = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { product: "", quantity: 1, price: 0 }],
    }));
  };

  const removeProductFromOrder = (index) => {
    calculateTotal(formData.products.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;

    if (field === "product") {
      const product = products.find((item) => item._id === value);
      if (product) updatedProducts[index].price = product.creditRate;
    }

    calculateTotal(updatedProducts);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.farmerId) return alert("Please select a customer");
    onSubmit(formData);
  };

  const inputClasses =
    "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm bg-white";
  const labelClasses = "block text-sm font-semibold text-gray-700 mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-800">
              <User size={20} className="text-blue-600" />
              Customer Selection
            </h3>

            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Select Customer</label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <select
                    name="farmerId"
                    value={formData.farmerId}
                    onChange={handleCustomerChange}
                    className={inputClasses}
                    required
                  >
                    <option value="">Choose Customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} ({customer.village})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCustomer && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Current Due</span>
                    <span className="font-bold text-blue-700">
                      Rs {Number(selectedCustomer.dueAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClasses}>Due Date (Optional)</label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={18}
                  />
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="flex min-h-[400px] flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <ShoppingCart size={20} className="text-blue-600" />
                Due Products
              </h3>
              <button
                type="button"
                onClick={addProductToOrder}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
              >
                <PlusCircle size={18} />
                Add Product
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {formData.products.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 text-slate-500">
                  <Package size={48} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No products added yet</p>
                  <p className="text-xs">Or enter a direct amount below</p>
                </div>
              ) : (
                formData.products.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 items-end gap-3 rounded-2xl border border-gray-50 bg-gray-50/50 p-4"
                  >
                    <div className="col-span-5">
                      <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-slate-600">
                        Product
                      </label>
                      <select
                        value={item.product}
                        onChange={(event) =>
                          handleProductChange(index, "product", event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.productName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-slate-600">
                        Qty
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          handleProductChange(
                            index,
                            "quantity",
                            parseInt(event.target.value, 10)
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 ml-1 block text-[10px] font-bold uppercase text-slate-600">
                        Price
                      </label>
                      <div className="relative">
                        <IndianRupee
                          size={12}
                          className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(event) =>
                            handleProductChange(
                              index,
                              "price",
                              parseFloat(event.target.value)
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-6 pr-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => removeProductFromOrder(index)}
                        className="rounded-xl p-2.5 text-slate-500 shadow-sm transition hover:bg-white hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Due Amount</label>
                  <div className="relative">
                    <IndianRupee
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      size={18}
                    />
                    <input
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: parseFloat(event.target.value),
                        }))
                      }
                      className={`${inputClasses} text-xl font-black text-blue-700`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Notes / Description</label>
                  <div className="relative">
                    <FileText
                      className="absolute left-3.5 top-4 text-slate-500"
                      size={18}
                    />
                    <textarea
                      name="description"
                      placeholder="Enter details..."
                      value={formData.description}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      className="min-h-[50px] w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || formData.amount <= 0}
                  className="rounded-2xl bg-blue-600 px-10 py-4 font-black text-white shadow-xl shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Due Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreditForm;
