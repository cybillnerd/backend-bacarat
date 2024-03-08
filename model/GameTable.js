const mongoose = require("mongoose");

const gameTableSchema = new mongoose.Schema({
  // Table Details
  table_ID: { type: String, required: true },
  Region: { type: String, required: true },
  status: { type: String, default: "active" },
  Bankers_Address: { type: String },
  Contract_TimePeriod: {
    StartTime: { type: Date, default: Date.now },
    EndTime: { type: Date, default: Date.now },
  },
  Running_Token: { type: Number, default: 0 }, // have to set the the running toen from the backend
  Based_Token: { type: Number, default: 0 }, //initails cpoints /points are on the table
  Stop_Loss: { type: Number, default: 0 }, // if rinnign token hits otr below the stop lsss  set status to in active

  // Gamers Details
  winners_Rewards: { type: Number, default: 0 },
  bet_Size: { type: Number },
  gamers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Gamer" }],

  // Investor Details
  per_Share_Cost: { type: Number },
  Remaining_Shares: { type: Number, default: 0 },
  investors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Investor" }],
  total_Investor_Seats: { type: Number },
  Minimum_Investment: { type: String }, // Min Investmetn that investor can do
  Max_Investment: { type: String }, // Max Investment that investor can do

  // PNL_Details:[PnlDetails],
  DailyProfits: [
    {
      date: { type: Date, default: Date.now },
      totalProfit: { type: Number, default: 0 },
    },
  ],
  WeeklyProfits: [
    {
      startDate: { type: Date },
      endDate: { type: Date },
      totalProfit: { type: Number, default: 0 },
    },
  ],
  MonthlyProfits: [
    {
      month: { type: Number, default: new Date().getMonth() + 1 },
      totalProfit: { type: Number, default: 0 },
    },
  ],

  // Comission Percentage
  investor_ProfitPercentage: { type: String }, // Investor Profit Percentage
  Referal_Percentage: { type: Number, default: 0.1 }, // Investor Profit Percentage ( 10%, 5% ETC )
});

const ContractGameTable = mongoose.model("gameTable", gameTableSchema);

module.exports = ContractGameTable;
