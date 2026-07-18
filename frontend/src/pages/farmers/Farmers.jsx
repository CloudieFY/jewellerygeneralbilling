import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowRight, IndianRupee, Plus, Receipt, Search, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";
import CustomerTable from "../../components/farmers/FarmerTable";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const getCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/farmers");
      setCustomers(data.farmers || []);
    } catch (error) {
      toast.error("Failed to load customers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await API.delete(`/farmers/${id}`);
      toast.success("Customer deleted");
      getCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const filteredCustomers = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.mobileNumber,
        customer.village,
        customer.city,
        customer.gstNumber,
        customer.status,
        customer.defaultRateType,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search))
    );
  }, [customers, keyword]);

  useEffect(() => {
    getCustomers();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            Customers
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Customer List
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
            Manage customer details, default rate type, and outstanding
            balances.
          </p>
        </div>

        <Link
          to="/farmers/add"
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Customer
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total Customers",
            value: customers.length.toLocaleString("en-IN"),
            icon: <Users size={22} />,
            color: "text-blue-600",
          },
          {
            label: "Total Orders",
            value: customers
              .reduce((total, customer) => total + Number(customer.totalOrders || 0), 0)
              .toLocaleString("en-IN"),
            icon: <Receipt size={22} />,
            color: "text-blue-600",
          },
          {
            label: "Total Purchase",
            value: `Rs ${customers
              .reduce((total, customer) => total + Number(customer.totalPurchase || 0), 0)
              .toLocaleString("en-IN")}`,
            icon: <IndianRupee size={22} />,
            color: "text-blue-600",
          },
          {
            label: "Total Paid",
            value: `Rs ${customers
              .reduce((total, customer) => total + Number(customer.totalPaid || 0), 0)
              .toLocaleString("en-IN")}`,
            icon: <ArrowDownLeft size={22} />,
            color: "text-emerald-600",
          },
          {
            label: "Outstanding Balance",
            value: `Rs ${customers
              .reduce(
                (total, customer) =>
                  total + Number(customer.outstandingBalance ?? customer.dueAmount ?? 0),
                0
              )
              .toLocaleString("en-IN")}`,
            icon: <IndianRupee size={22} />,
            color: "text-red-600",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search customers by name, mobile, area, or rate type"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="input-field pl-11 pr-12"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-sm">
          Loading customers...
        </div>
      ) : (
        <CustomerTable
          farmers={filteredCustomers}
          deleteCustomer={deleteCustomer}
        />
      )}
    </div>
  );
};

export default Customers;
