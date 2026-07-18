import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SalesChart = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl shadow text-center text-slate-700">
        <h2 className="text-xl font-bold mb-5">Sales Chart</h2>
        <p>No sales chart data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow">

      <h2 className="text-xl font-bold mb-5">
        Sales Chart
      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart data={data}>

          <XAxis
            dataKey="month"
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="sales"
            stroke="#16a34a"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
};

export default SalesChart;