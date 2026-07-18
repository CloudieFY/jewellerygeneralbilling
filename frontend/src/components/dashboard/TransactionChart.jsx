import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = [
  "#16a34a",
  "#2563eb",
  "#dc2626",
];

const TransactionChart = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl shadow text-center text-slate-700">
        <h2 className="text-xl font-bold mb-5">Transactions</h2>
        <p>No transaction chart data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      <h2 className="text-xl font-bold mb-5">
        Transactions
      </h2>

      <PieChart
        width={350}
        height={300}
      >

        <Pie
          data={data}
          dataKey="value"
          outerRadius={100}
          label
        >

          {
            data.map(
              (
                entry,
                index
              ) => (

                <Cell
                  key={index}
                  fill={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                />
              )
            )
          }

        </Pie>

        <Tooltip />

      </PieChart>

    </div>
  );
};

export default TransactionChart;