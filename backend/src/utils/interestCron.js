import cron from "node-cron";

import calculateInterest from "./interestCalculator.js";



// runs everyday at midnight

const startInterestCron = () => {

  cron.schedule("0 0 * * *", async () => {

    console.log("Running Daily Interest Cron Job");

    await calculateInterest();

  });

};

export default startInterestCron;