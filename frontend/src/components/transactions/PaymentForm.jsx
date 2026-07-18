import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  User, 
  IndianRupee, 
  CreditCard, 
  FileText, 
  Wallet, 
  Smartphone, 
  Building2,
  CheckCircle2,
} from "lucide-react";
import API from "../../services/api";

const PaymentForm = ({ onSubmit, loading }) => {
  const [searchParams] = useSearchParams();
  const [farmers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    farmerId: "",
    amount: "",
    paymentMode: "cash",
    voucherDate: new Date().toISOString().slice(0, 10),
    description: "",
  });

  useEffect(() => {
    const getCustomers = async () => {
      try {
        const { data } = await API.get("/farmers");
        const customerList = data.farmers || [];
        const requestedCustomerId = searchParams.get("customerId");
        const requestedCustomer = customerList.find(
          (customer) => customer._id === requestedCustomerId
        );

        setCustomers(customerList);

        if (requestedCustomer) {
          setSelectedCustomer(requestedCustomer);
          setFormData((prev) => ({
            ...prev,
            farmerId: requestedCustomer._id,
          }));
        }
      } catch (error) {
        console.log(error);
      }
    };
    getCustomers();
  }, [searchParams]);

  const handleCustomerChange = (e) => {
    const farmerId = e.target.value;
    const farmer = farmers.find(f => f._id === farmerId);
    setSelectedCustomer(farmer);
    setFormData({ ...formData, farmerId });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.farmerId) return alert("Please select a customer");
    if (selectedCustomer && parseFloat(formData.amount) > Number(selectedCustomer.dueAmount || 0)) {
      alert("Payment amount exceeds due amount");
      return;
    }
    onSubmit(formData);
  };

  const inputClasses = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm bg-white";
  const labelClasses = "block text-sm font-semibold text-gray-700 mb-2 ml-1";

  const paymentModes = [
    { id: 'cash', label: 'Cash', icon: <Wallet size={18} /> },
    { id: 'upi', label: 'UPI / PhonePe', icon: <Smartphone size={18} /> },
    { id: 'bank', label: 'Bank Transfer', icon: <Building2 size={18} /> },
    { id: 'cheque', label: 'Cheque', icon: <CreditCard size={18} /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Selection */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
              <User size={20} className="text-green-600" />
              Customer Details
            </h3>
            
            <div>
              <label className={labelClasses}>Select Customer</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-green-600 transition-colors" size={18} />
                <select
                  name="farmerId"
                  value={formData.farmerId}
                  onChange={handleCustomerChange}
                  className={inputClasses}
                  required
                >
                  <option value="">Choose Customer</option>
                  {farmers?.map((f) => (
                    <option key={f._id} value={f._id}>{f.name} ({f.village})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCustomer && (
              <div className="p-6 rounded-2xl bg-green-50 border border-green-100">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Current Outstanding</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-green-800">₹{selectedCustomer.dueAmount.toLocaleString()}</span>
                  <span className="text-green-600 text-sm font-medium">pending due</span>
                </div>
                {selectedCustomer.dueAmount === 0 && (
                  <div className="mt-3 flex items-center gap-2 text-green-700 text-xs font-bold">
                    <CheckCircle2 size={14} />
                    All dues are cleared!
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
              <IndianRupee size={20} className="text-green-600" />
              Receipt Voucher
            </h3>

            <div>
              <label className={labelClasses}>Voucher Date</label>
              <input
                type="date"
                name="voucherDate"
                value={formData.voucherDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm transition-all focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>

            <div>
              <label className={labelClasses}>Amount to Pay</label>
              <div className="relative group">
                <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-green-600 transition-colors" size={18} />
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`${inputClasses} text-xl font-bold text-green-700`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Payment Mode</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {paymentModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({...formData, paymentMode: mode.id})}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      formData.paymentMode === mode.id
                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100"
                        : "bg-white border-gray-100 text-slate-700 hover:border-green-200"
                    }`}
                  >
                    {mode.icon}
                    <span className="text-[10px] font-bold uppercase">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <label className={labelClasses}>Payment Notes / Remarks</label>
          <div className="relative group">
            <FileText className="absolute left-3.5 top-4 text-slate-600 group-focus-within:text-green-600 transition-colors" size={18} />
            <textarea
              name="description"
              placeholder="e.g. Received via cash at shop..."
              value={formData.description}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm bg-white min-h-[80px]"
            />
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.amount || formData.amount <= 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-2xl font-black transition-all shadow-xl shadow-green-100 disabled:opacity-50 active:scale-95"
          >
            {loading ? "Recording..." : "Complete Payment"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
