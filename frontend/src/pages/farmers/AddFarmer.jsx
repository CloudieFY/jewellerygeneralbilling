import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import CustomerForm from "../../components/farmers/FarmerForm";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const addCustomer = async (formData) => {
    try {
      setLoading(true);
      await API.post("/farmers", formData);
      toast.success("Customer added successfully");
      navigate("/farmers");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link
          to="/farmers"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-blue-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Add Customer
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Create a customer with a default rate type.
          </p>
        </div>
      </div>

      <CustomerForm onSubmit={addCustomer} loading={loading} />
    </div>
  );
};

export default AddCustomer;
