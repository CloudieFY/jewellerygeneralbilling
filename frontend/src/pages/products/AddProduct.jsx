import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import ProductForm from "../../components/products/ProductsForm";

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async (formData) => {
    try {
      setLoading(true);
      await API.post("/products", formData);
      toast.success("Product added successfully");
      navigate("/products");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-blue-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Add Product
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Create a product with per sq ft rates.
          </p>
        </div>
      </div>

      <ProductForm onSubmit={handleAddProduct} loading={loading} />
    </div>
  );
};

export default AddProduct;
