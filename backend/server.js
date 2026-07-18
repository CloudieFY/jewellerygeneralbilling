const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const { default: app } = await import("./src/app.js");
  const { default: connectDB } = await import("./src/configs/db.js");
  const { default: startCronJobs } = await import("./src/utils/interestCron.js");

  // database connection
  await connectDB();

  // start automatic cron jobs
  startCronJobs();

  // server
  app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
  });
};

try {
  await startServer();
} catch (error) {
  console.error("Server Startup Error:", error.message);
  process.exit(1);
}
