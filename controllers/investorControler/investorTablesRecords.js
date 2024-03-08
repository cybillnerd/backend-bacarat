const mongoose = require("mongoose");
const ContractGameTable = require("../../model/GameTable");
const { validationResult } = require("express-validator");
const WithdrawalRequest = require("../../model/WithdrawalRequest");
const InvestorShares = require("../../model/InvestorShares");

const getRecords = async (req, res) => {
  try {
    const tableID = req.params.tableID;

    // Check if tableID is provided
    if (!tableID) {
      return res.status(400).json({ error: "Table ID is required" });
    }

    // Query the InvestorShares model based on the tableID
    const investorShares = await InvestorShares.findOne({ TableID: tableID }).populate("investors");

    // Check if the investorShares record is found
    if (!investorShares) {
      return res.status(404).json({ error: "Investor records not found for the given table ID" });
    }

    // Return the investor records in the response
    return res.status(200).json({
      investorRecords: investorShares.investors,
    });
  } catch (error) {
    console.error("Error getting investor records:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getRecords,
};
