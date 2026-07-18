const RecentTransactions = ({
  transactions,
}) => {

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-2xl font-bold">
          Recent Transactions
        </h2>

      </div>

      <div className="overflow-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="py-3 text-left">
                Customer
              </th>

              <th className="py-3 text-left">
                Type
              </th>

              <th className="py-3 text-left">
                Amount
              </th>

              <th className="py-3 text-left">
                Status
              </th>

              <th className="py-3 text-left">
                Date
              </th>

            </tr>

          </thead>

          <tbody>

            {
              transactions?.map(
                (transaction) => (

                  <tr
                    key={
                      transaction._id
                    }
                    className="border-b"
                  >

                    <td className="py-3">
                      {
                        transaction
                          ?.farmer
                          ?.name
                      }
                    </td>

                    <td className="py-3 capitalize">

                      <span
                        className={`px-3 py-1 rounded-full text-white text-sm
                        ${
                          transaction.type ===
                          "credit"
                            ? "bg-red-500"
                            : transaction.type ===
                              "payment"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {
                          transaction.type
                        }
                      </span>

                    </td>

                    <td className="py-3 font-bold">
                      ₹
                      {
                        transaction.amount
                      }
                    </td>

                    <td className="py-3">
                      {
                        transaction.status
                      }
                    </td>

                    <td className="py-3">
                      {
                        new Date(
                          transaction.createdAt
                        ).toLocaleDateString()
                      }
                    </td>

                  </tr>
                )
              )
            }

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default RecentTransactions;