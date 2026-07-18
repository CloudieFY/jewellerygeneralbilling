import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import CreditForm from "../../components/transactions/CreditForm";
import API from "../../services/api";
import toast from "react-hot-toast";

const CreditTransaction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createCredit = async (formData) => {
    try {
      setLoading(true);
      await API.post("/transactions/credit", formData);
      toast.success("Credit Entry Recorded Successfully");
      navigate("/transactions");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add credit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/transactions"
          className="p-3 bg-white border border-gray-200 rounded-2xl text-slate-800 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowUpRight size={14} />
            <span>New Credit Entry</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Record Credit Transaction</h1>
        </div>
      </div>

      <CreditForm onSubmit={createCredit} loading={loading} />
    </div>
  );
};

export default CreditTransaction;