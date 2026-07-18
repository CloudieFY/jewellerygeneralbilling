import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import CustomerForm from "../../components/farmers/FarmerForm";

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getCustomer = async () => {
      try {
        const { data } = await API.get(`/farmers/${id}`);
        setCustomer(data.farmer);
      } catch (error) {
        toast.error("Failed to load customer");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getCustomer();
  }, [id]);

  const updateCustomer = async (formData) => {
    try {
      setSaving(true);
      await API.put(`/farmers/${id}`, formData);
      toast.success("Customer updated");
      navigate("/farmers");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center font-bold text-slate-600 shadow-sm">
        Loading customer...
      </div>
    );
  }

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
            Edit Customer
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Update {customer?.name}
          </p>
        </div>
      </div>

      <CustomerForm
        initialData={customer}
        onSubmit={updateCustomer}
        loading={saving}
      />
    </div>
  );
};

export default EditCustomer;
