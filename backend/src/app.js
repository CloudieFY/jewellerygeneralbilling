import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import farmerRoutes from "./routes/farmer.routes.js";
import villageRoutes from "./routes/village.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import productRoutes from "./routes/product.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
      <body style="font-family: sans-serif; max-width: 640px; margin: 40px auto; line-height: 1.6;">
        <h1>BillFlow API</h1>
        <p>This is the backend server. It does not serve the web app UI.</p>
        <p>Open the frontend instead:</p>
        <p><a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
      </body>
    </html>
  `);
});

app.use("/api/auth", authRoutes);

app.use("/api/farmers", farmerRoutes);

app.use("/api/villages", villageRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/products", productRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/invoices", invoiceRoutes);

app.use("/api/reports", reportRoutes);


export default app;
