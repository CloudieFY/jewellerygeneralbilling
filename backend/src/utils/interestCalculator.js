import Transaction from "../models/Transaction.js";
import Farmer from "../models/Farmer.js";
import Settings from "../models/Settings.js";



const calculateInterest = async () => {
  try {

    console.log(
      "Running Automatic Interest Calculation..."
    );



    // ================= SETTINGS =================

    let settings =
      await Settings.findOne();

    // create default settings

    if (!settings) {

      settings =
        await Settings.create({
          monthlyInterestRate: 2,
        });
    }



    // ================= CHECK IF AUTO INTEREST ENABLED =================

    if (!settings.autoInterestEnabled) {

      console.log(
        "Automatic Interest Disabled"
      );

      return;
    }



    const interestRate =
      settings.monthlyInterestRate;



    // ================= CURRENT DATE =================

    const today = new Date();



    // ================= FIND OVERDUE CREDIT TRANSACTIONS =================

    const overdueTransactions =
      await Transaction.find({

        type: "credit",

        dueDate: {
          $exists: true,
          $lt: today,
        },

        interestApplied: false,
      });



    console.log(
      `Found ${overdueTransactions.length} overdue transactions`
    );



    // ================= PROCESS TRANSACTIONS =================

    for (const transaction of overdueTransactions) {

      // find farmer

      const farmer =
        await Farmer.findById(
          transaction.farmer
        );

      if (!farmer) continue;



      // ================= CALCULATE INTEREST =================

      const interestAmount =
        (transaction.amount * interestRate) / 100;



      // ================= CREATE INTEREST TRANSACTION =================

      await Transaction.create({

        farmer: farmer._id,

        type: "interest",

        amount: interestAmount,

        description:
          `Automatic ${interestRate}% monthly interest added`,

        paymentMode: "cash",

        status: "completed",
      });



      // ================= UPDATE FARMER DUE =================

      farmer.dueAmount += interestAmount;

      await farmer.save();



      // ================= MARK ORIGINAL TRANSACTION =================

      transaction.interestApplied = true;



      // better month format

      transaction.interestMonth =
        today.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });



      await transaction.save();



      console.log(
        `Interest Added To Farmer: ${farmer.name}`
      );
    }

  } catch (error) {

    console.log(
      "Interest Calculation Error:",
      error.message
    );
  }
};

export default calculateInterest;