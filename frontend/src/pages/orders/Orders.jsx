import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, ImagePlus, MessageCircle, PackageCheck, Plus, Search, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../services/api";

const today = new Date().toISOString().slice(0, 10);
const emptyForm = {
  customerId: "", customerName: "", customerMobile: "", customerAddress: "",
  itemDescription: "", metal: "Gold", purity: "22K / 916", fixedRate: "",
  advancePaid: "", orderDate: today, dueDate: "", note: "", design: null,
};

const Orders = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [savedOrder, setSavedOrder] = useState(null);

  const loadData = async () => {
    try {
      const [customerRes, orderRes] = await Promise.all([API.get("/farmers"), API.get("/orders")]);
      setCustomers(customerRes.data.farmers || []);
      setOrders(orderRes.data.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  const setField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  const selectCustomer = (id) => {
    const customer = customers.find((entry) => entry._id === id);
    setForm((previous) => ({
      ...previous, customerId: id,
      customerName: customer?.name || "", customerMobile: customer?.mobileNumber || "",
      customerAddress: customer?.address || [customer?.village, customer?.city].filter(Boolean).join(", "),
    }));
  };

  const attachDesign = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image design");
    if (file.size > 5 * 1024 * 1024) return toast.error("Design image must be under 5 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/jpeg", 0.8);
        setField("design", {
          name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
          mimeType: "image/jpeg",
          data,
        });
      };
      image.onerror = () => toast.error("Could not read this design image");
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const { data } = await API.post("/orders", form);
      const completedOrder = {
        ...data.order,
        design: form.design || data.order.design,
        designAttached: Boolean(form.design || data.order.designAttached),
      };
      setSavedOrder(completedOrder);
      setOrders((previous) => [completedOrder, ...previous]);
      setForm(emptyForm);
      toast.success("Order saved — ready to share on WhatsApp");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save order");
    } finally { setSaving(false); }
  };

  const orderMessage = (order) => [
    `*JewelFlow Order ${order.orderNumber}*`, `Customer: ${order.customerName}`,
    `Item: ${order.itemDescription}`, `Metal / Purity: ${order.metal} - ${order.purity}`,
    order.fixedRate !== null && order.fixedRate !== undefined ? `Fixed Rate: Rs ${Number(order.fixedRate).toLocaleString("en-IN")}` : "",
    `Advance Paid: Rs ${Number(order.advancePaid).toLocaleString("en-IN")}`,
    `Due Date: ${new Date(order.dueDate).toLocaleDateString("en-IN")}`,
    order.note ? `Note: ${order.note}` : "",
  ].filter(Boolean).join("\n");

  const dataUrlToFile = async (design) => {
    const blob = await (await fetch(design.data)).blob();
    return new File([blob], design.name || "jewellery-design.jpg", { type: design.mimeType || blob.type });
  };

  const shareWhatsApp = async (order) => {
    const message = orderMessage(order);
    try {
      let design = order.design?.data ? order.design : null;
      if (!design && order.designAttached) {
        const { data } = await API.get(`/orders/${order._id}/design`);
        design = data.design;
      }
      if (design?.data && navigator.share) {
        const file = await dataUrlToFile(design);
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ title: order.orderNumber, text: message, files: [file] });
          return;
        }
      }
      const phone = String(order.customerMobile || "").replace(/\D/g, "");
      const indianPhone = phone.length === 10 ? `91${phone}` : phone;
      window.open(`https://wa.me/${indianPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      if (design?.data) toast("Desktop WhatsApp opened. Download/attach the saved design if needed.");
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Could not open sharing");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.patch(`/orders/${id}/status`, { status });
      setOrders((previous) => previous.map((item) => item._id === id ? data.order : item));
      toast.success("Order status updated");
    } catch (error) { toast.error(error.response?.data?.message || "Status update failed"); }
  };

  const visibleOrders = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return orders;
    return orders.filter((order) => [order.orderNumber, order.customerName, order.customerMobile, order.itemDescription, order.status].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [orders, search]);

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[.25em] text-blue-600">Job Orders</p><h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Customer Order Book</h1><p className="mt-2 text-sm font-semibold text-slate-500">Take the order, keep its design connected, and send confirmation on WhatsApp.</p></div>
        <button onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={19}/> New Order</button>
      </header>

      <form ref={formRef} onSubmit={submit} className="premium-card overflow-hidden">
        <div className="border-b border-amber-100 bg-amber-50/60 p-5 sm:p-7"><h2 className="flex items-center gap-2 text-xl font-black"><PackageCheck className="text-amber-700"/> Take Customer Order</h2><p className="mt-1 text-sm font-semibold text-slate-500">Fields marked * are required.</p></div>
        <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-2">
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-black text-slate-900"><UserRound size={18} className="text-amber-700"/> Customer details</h3>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Existing customer <select className="input-field mt-2 normal-case" value={form.customerId} onChange={(e) => selectCustomer(e.target.value)}><option value="">New customer / select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} — {customer.mobileNumber}</option>)}</select></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wider text-slate-500">Customer name *<input className="input-field mt-2 normal-case" value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} required /></label><label className="text-xs font-black uppercase tracking-wider text-slate-500">WhatsApp mobile *<input className="input-field mt-2 normal-case" value={form.customerMobile} onChange={(e) => setField("customerMobile", e.target.value)} inputMode="tel" required /></label></div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Customer address *<textarea className="input-field mt-2 min-h-24 normal-case" value={form.customerAddress} onChange={(e) => setField("customerAddress", e.target.value)} required /></label>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900">Jewellery details</h3>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Item description *<textarea className="input-field mt-2 min-h-24 normal-case" placeholder="E.g. bridal necklace, kundan work, size..." value={form.itemDescription} onChange={(e) => setField("itemDescription", e.target.value)} required /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wider text-slate-500">Metal *<select className="input-field mt-2 normal-case" value={form.metal} onChange={(e) => setField("metal", e.target.value)}><option>Gold</option><option>Silver</option><option>Platinum</option><option>Diamond</option><option>Other</option></select></label><label className="text-xs font-black uppercase tracking-wider text-slate-500">Purity *<input className="input-field mt-2 normal-case" value={form.purity} onChange={(e) => setField("purity", e.target.value)} required /></label></div>
          </section>

          <section className="space-y-4">
            <h3 className="font-black text-slate-900">Price & delivery</h3>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wider text-slate-500">Fixed rate (Rs)<input type="number" min="0" className="input-field mt-2 normal-case" value={form.fixedRate} onChange={(e) => setField("fixedRate", e.target.value)} /></label><label className="text-xs font-black uppercase tracking-wider text-slate-500">Advance paid (Rs)<input type="number" min="0" className="input-field mt-2 normal-case" value={form.advancePaid} onChange={(e) => setField("advancePaid", e.target.value)} /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-black uppercase tracking-wider text-slate-500">Order date *<input type="date" className="input-field mt-2 normal-case" value={form.orderDate} onChange={(e) => setField("orderDate", e.target.value)} required /></label><label className="text-xs font-black uppercase tracking-wider text-slate-500">Due date *<input type="date" min={form.orderDate} className="input-field mt-2 normal-case" value={form.dueDate} onChange={(e) => setField("dueDate", e.target.value)} required /></label></div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Note<textarea className="input-field mt-2 min-h-20 normal-case" value={form.note} onChange={(e) => setField("note", e.target.value)} /></label>
          </section>

          <section className="space-y-4"><h3 className="font-black text-slate-900">Design attachment</h3>{form.design ? <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-amber-50"><img src={form.design.data} className="h-52 w-full object-contain" alt="Selected jewellery design"/><button type="button" onClick={() => setField("design", null)} className="absolute right-3 top-3 rounded-full bg-white p-2 text-red-600 shadow"><X size={17}/></button><p className="truncate p-3 text-xs font-bold text-slate-600">{form.design.name}</p></div> : <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-6 text-center hover:bg-amber-50"><ImagePlus size={35} className="text-amber-700"/><span className="mt-3 font-black">Attach jewellery design</span><span className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG or WebP · max 5 MB</span><input type="file" accept="image/*" className="hidden" onChange={(e) => attachDesign(e.target.files?.[0])}/></label>}</section>
        </div>
        <div className="flex justify-end border-t border-amber-100 bg-amber-50/40 p-5 sm:p-7"><button disabled={saving} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 size={19}/>{saving ? "Saving order..." : "Save Order"}</button></div>
      </form>

      {savedOrder && <div className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-emerald-900">{savedOrder.orderNumber} saved successfully</p><p className="text-sm font-semibold text-emerald-700">Send the complete order summary{savedOrder.designAttached ? " and attached design" : ""} to {savedOrder.customerName}.</p></div><button onClick={() => shareWhatsApp(savedOrder)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white"><MessageCircle size={19}/> Send via WhatsApp</button></div>}

      <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">All Orders</h2><p className="text-sm font-semibold text-slate-500">{orders.length} connected customer orders</p></div><div className="relative"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input-field pl-11" placeholder="Search order or customer" value={search} onChange={(e) => setSearch(e.target.value)}/></div></div>
        {loading ? <div className="premium-card p-10 text-center font-bold text-slate-500">Loading orders...</div> : visibleOrders.length === 0 ? <div className="premium-card p-10 text-center font-bold text-slate-500">No orders found. Create your first customer order above.</div> : <div className="grid gap-4 lg:grid-cols-2">{visibleOrders.map((order) => <article key={order._id} className="premium-card p-5"><div className="flex gap-4">{order.design?.data ? <img src={order.design.data} className="h-24 w-24 shrink-0 rounded-2xl border border-amber-100 object-cover" alt="Design"/> : <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-amber-50"><ImagePlus className="text-amber-500"/></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-amber-800">{order.orderNumber}</p><select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-black"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="ready">Ready</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div><h3 className="mt-1 truncate text-lg font-black">{order.customerName}</h3><p className="truncate text-sm font-semibold text-slate-600">{order.itemDescription}</p><p className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-500"><CalendarDays size={14}/> Due {new Date(order.dueDate).toLocaleDateString("en-IN")}</p></div></div><button onClick={() => shareWhatsApp(order)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"><MessageCircle size={18}/> WhatsApp Customer</button></article>)}</div>}
      </section>
    </div>
  );
};

export default Orders;
