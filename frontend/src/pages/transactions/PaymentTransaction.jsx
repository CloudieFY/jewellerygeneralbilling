import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowDownLeft } from "lucide-react";
import PaymentForm from "../../components/transactions/PaymentForm";
import API from "../../services/api";
import toast from "react-hot-toast";

const PaymentTransaction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createPayment = async (formData) => {
    try {
      setLoading(true);
      await API.post("/transactions/payment", formData);
      toast.success("Receipt Voucher Recorded Successfully");
      navigate("/transactions");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/transactions"
          className="p-3 bg-white border border-gray-200 rounded-2xl text-slate-800 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowDownLeft size={14} />
            <span>New Receipt Voucher</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Receive Customer Payment</h1>
        </div>
      </div>

      <PaymentForm onSubmit={createPayment} loading={loading} />
    </div>
  );
};

export default PaymentTransaction;
