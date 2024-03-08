// controllers/gamerController/checkWin.js
const mongoose = require("mongoose");
const Gamer = require("../../model/gamer");
const ContractGameTable = require("../../model/GameTable");
const GameCoins = require("../../model/gamePoint");
const ReferalShares = require("../../model/Referenal");

const SendCoinToReferral = async ({
  gamer_Address,
  winAmount,
  ReferalAmountPercentage = 0.1,
}) => {
  try {
    const ReferalAddress = await ReferalShares.findOne({
      MyAddress: gamer_Address,
    });
    if (ReferalAddress) {
      const ref_Address = ReferalAddress.MyReferalAddress;
      const Bonus = winAmount * ReferalAmountPercentage;
      const existingUser = await GameCoins.findOne({ address: ref_Address });

      if (existingUser) {
        // If user exists, update game points
        existingUser.gamePoints += Bonus;
        await existingUser.save();
      } else {
        // If user does not exist, create a new user
        const newUser = new GameCoins({
          address: ref_Address,
          gamePoints: Bonus,
        });
        await newUser.save();
      }
    }
  } catch (error) {
    console.log(error.message, "refereal Error");
  }
};

const checkWin = async (req, res) => {
  try {
    const { _id, OriginalBetWin, result } = req.body;

    // Find the gamer based on _id
    const gamer = await Gamer.findOne({ _id });

    if (!gamer) {
      return res.status(404).json({ error: "Gamer not found" });
    }

    // Find the game coins record for the gamer using gamer _id
    const gameCoins = await GameCoins.findOne({ address: gamer.gamer_Address });

    if (!gameCoins) {
      return res
        .status(404)
        .json({ error: "Game coins not found for the gamer" });
    }

    // Find the game table based on the gamer's table ID
    const gamertableID = gamer.betInformation.table_ID;
    const gameTable = await ContractGameTable.findOne({ _id: gamertableID });

    if (!gameTable) {
      return res.status(404).json({ error: "Game table not found" });
    }

    // for referal
    const gamer_Address = gamer.gamer_Address;
    const ReferalAmountPercentage = gameTable.Referal_Percentage;

    let winAmount = 0; // Define winAmount in the appropriate scope

    // Update the win_or_lose field and set the end date based on user input
    gamer.betInformation.win_or_lose = result; // 'win', 'lose', or 'tie'
    gamer.betInformation.OriginalBetWin = OriginalBetWin;
    gamer.betInformation.endDate = Date.now();
    await gamer.save();

    // Update game coins based on the result
    if (result === "win") {
      // Multiply game coins by winners reward
      const betAmount = parseInt(gamer.betInformation.betAmount);
      const WinnerReward = gameTable.winners_Rewards;

      if (!isNaN(betAmount) && !isNaN(WinnerReward)) {
        winAmount = betAmount * WinnerReward; // Update winAmount
        gameCoins.gamePoints =
          parseInt(gameCoins.gamePoints) + parseInt(winAmount);

        // send the  0.1 percentage to the referral
        SendCoinToReferral({
          gamer_Address,
          winAmount,
          ReferalAmountPercentage,
        });

        console.log("referalopen -----------------------------");
        // Check if referral address exists
        const ReferalAddress = await ReferalShares.findOne({
          MyAddress: gamer_Address,
        });

        console.log("referalopen -----------------------------");
        if (ReferalAddress) {
          console.log("found referal address");
          // Add referral information to the gamer document
          gamer.referal_Information.referal_Address =
            ReferalAddress.MyReferalAddress;
          gamer.referal_Information.Reward_Ammount =
            winAmount * ReferalAmountPercentage;
          gamer.referal_Information.Date = Date.now();
        } else {
          console.log("not found referal address");
          // Set referral information to null if not available
          gamer.referal_Information = null;
        }

        console.log("referalclose -----------------------------");
      } else {
        console.error("Invalid bet amount or winners reward");
      }
    }

    // Update game coins based on the result
    if (result === "win") {
      // Subtract the win amount from Running_Token
      gameTable.Running_Token -= winAmount;
    } else if (result === "lose") {
      // Deduct game coins
      gameCoins.gamePoints =
        gameCoins.gamePoints - gamer.betInformation.betAmount; // Deduct bet amount for loss

      // Add the loss amount to Running_Token
      gameTable.Running_Token += parseInt(gamer.betInformation.betAmount);
    }

    // Check if Running_Token is equal to or less than Stop_Loss
    if (gameTable.Running_Token <= gameTable.Stop_Loss) {
      gameTable.status = "inactive";
    }

    await gamer.save(); // Save the updated gamer document
    await gameCoins.save();
    await gameTable.save();

    res
      .status(200)
      .json({ message: `Gamer result updated: ${result}, Game coins updated`,   gamer: gamer, });
  } catch (error) {
    console.error("Error checking win:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = checkWin;
