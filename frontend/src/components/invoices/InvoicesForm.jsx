import {
  useEffect,
  useState,
} from "react";

import API from "../../services/api";

const InvoicesForm = () => {

  const [farmers,
    setCustomers] =
    useState([]);

  const [products,
    setProducts] =
    useState([]);

  const [formData,
    setFormData] =
    useState({
      farmerId: "",
      billingType: "cash",
      products: [],
    });

  const getData =
    async () => {

      const farmerRes =
        await API.get(
          "/farmers"
        );

      const productRes =
        await API.get(
          "/products"
        );

      setCustomers(
        farmerRes.data.farmers
      );

      setProducts(
        productRes.data.products
      );
    };

  useEffect(() => {
    getData();
  }, []);

  const addProduct =
    () => {

      setFormData({
        ...formData,
        products: [
          ...formData.products,
          {
            product: "",
            quantity: 1,
          },
        ],
      });
    };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        await API.post(
          "/invoices",
          formData
        );

        alert(
          "Invoice Created"
        );

      } catch (error) {
        console.log(error);
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="bg-white p-6 rounded-xl shadow"
    >

      <select
        className="w-full border p-3 rounded-lg mb-4"
        onChange={(e) =>
          setFormData({
            ...formData,
            farmerId:
              e.target.value,
          })
        }
      >

        <option>
          Select Customer
        </option>

        {
          farmers.map(
            (farmer) => (

              <option
                key={farmer._id}
                value={farmer._id}
              >
                {farmer.name}
              </option>
            )
          )
        }

      </select>

      <select
        className="w-full border p-3 rounded-lg mb-4"
        onChange={(e) =>
          setFormData({
            ...formData,
            billingType:
              e.target.value,
          })
        }
      >

        <option value="cash">
          Cash
        </option>

        <option value="credit">
          Credit
        </option>

        <option value="wholesale">
          Wholesale
        </option>

      </select>

      {
        formData.products.map(
          (item, index) => (

            <div
              key={index}
              className="grid grid-cols-2 gap-4 mb-4"
            >

              <select
                className="border p-3 rounded-lg"
                onChange={(e) => {

                  const updated =
                    [
                      ...formData.products,
                    ];

                  updated[
                    index
                  ].product =
                    e.target.value;

                  setFormData({
                    ...formData,
                    products:
                      updated,
                  });
                }}
              >

                <option>
                  Product
                </option>

                {
                  products.map(
                    (product) => (

                      <option
                        key={
                          product._id
                        }
                        value={
                          product._id
                        }
                      >
                        {
                          product.productName
                        }
                      </option>
                    )
                  )
                }

              </select>

              <input
                type="number"
                placeholder="Quantity"
                className="border p-3 rounded-lg"
                onChange={(e) => {

                  const updated =
                    [
                      ...formData.products,
                    ];

                  updated[
                    index
                  ].quantity =
                    e.target.value;

                  setFormData({
                    ...formData,
                    products:
                      updated,
                  });
                }}
              />

            </div>
          )
        )
      }

      <button
        type="button"
        onClick={addProduct}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg mb-5"
      >
        Add Product
      </button>

      <button className="block bg-green-600 text-white px-6 py-3 rounded-lg">
        Create Invoice
      </button>

    </form>
  );
};

export default InvoicesForm;