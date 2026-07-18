import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import ProductForm from "../../components/products/ProductsForm";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data.product);
      } catch (error) {
        toast.error("Failed to fetch product");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getProduct();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setUpdateLoading(true);
      await API.put(`/products/${id}`, formData);
      toast.success("Product updated successfully");
      navigate("/products");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading product...
      </div>
    );
  }

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
            Edit Product
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Update {product?.productName}
          </p>
        </div>
      </div>

      <ProductForm
        initialData={product}
        onSubmit={handleUpdate}
        loading={updateLoading}
      />
    </div>
  );
};

export default EditProduct;
