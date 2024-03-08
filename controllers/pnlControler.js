// controllers/gameTableController.js
const ContractGameTable = require("../model/GameTable");

// Assume you have a running game state object
const gameState = {
  totalWin: 0,
  totalLoss: 0,
  totalAmountWin: 0,
  totalAmountLoss: 0,
  totalWinnerAmountByReward: 0,
};

// Function to update PNL based on game events
const updatePNL = (event) => {
  if (event.result === "win") {
    gameState.totalWin += 1;
    gameState.totalAmountWin += event.betAmount;
    gameState.totalWinnerAmountByReward += event.betAmount * event.reward;
  } else if (event.result === "lose") {
    gameState.totalLoss += 1;
    gameState.totalAmountLoss += event.betAmount;
  }
};

// Function to calculate real-time overall PNL
const calculateRealTimeOverallPNL = () => {
  return gameState.totalAmountLoss - gameState.totalWinnerAmountByReward;
};

// Function to calculate last N days PNL
const calculateLastNDaysPNL = (gamersByDate, days) => {
  const currentDate = new Date();
  const lastNDaysPNL = Object.entries(gamersByDate)
    .filter(([date]) => {
      const dateObj = new Date(date);
      const timeDifference = currentDate - dateObj;
      const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
      return daysDifference <= days;
    })
    .reduce((totalPNL, [, dateData]) => totalPNL + dateData.totalPNL, 0);

  return lastNDaysPNL;
};

// CalculateAllTablePNL
const Table_PNL_Details = async (req, res) => {
  try {
    const { table_ID } = req.params;

    // Find the game table by table_ID and populate the 'gamers' field
    const gameTable = await ContractGameTable.findOne({
      _id: table_ID,
    }).populate("gamers");

    if (!gameTable) {
      return res.status(404).json({ error: "Game table not found" });
    }

    // Group gamers' data by date and calculate total win, total loss, and total amount won and lost
    const gamersByDate = gameTable.gamers.reduce((result, gamer) => {
      const date = new Date(gamer.betInformation.startDate)
        .toISOString()
        .split("T")[0];

      if (!result[date]) {
        result[date] = {
          gamers: [],
          totalWin: 0,
          totalLoss: 0,
          totalGames: 0,
          totalAmountWin: 0,
          totalAmountLoss: 0,
          totalWinnerAmountByReward: 0,
          totalPNL: 0,
        };
      }

      result[date].gamers.push({
        _id: gamer._id,
        gamer_Address: gamer.gamer_Address,
        result: gamer.betInformation.win_or_lose,
        betOn: gamer.betInformation.betOn,
        Ammount: gamer.betInformation.betAmount,
        startTime: gamer.betInformation.startDate,
        EndTime: gamer.betInformation.endDate,
        OriginalBetWin: gamer.betInformation.OriginalBetWin,
      });

      // Count the total number of games played
      result[date].totalGames += 1;

      // Calculate total win and total loss
      if (gamer.betInformation.win_or_lose === "win") {
        result[date].totalWin += 1;
        result[date].totalAmountWin += gamer.betInformation.betAmount;

        // Calculate total winner amount multiplied by the reward amount
        result[date].totalWinnerAmountByReward +=
          gamer.betInformation.betAmount * gameTable.winners_Rewards;
      } else if (gamer.betInformation.win_or_lose === "lose") {
        result[date].totalLoss += 1;
        result[date].totalAmountLoss += gamer.betInformation.betAmount;
      }

      // Calculate PNL for each date
      result[date].totalPNL =
        result[date].totalAmountLoss +
        gameTable.Running_Token -
        result[date].totalWinnerAmountByReward;

      // Update real-time game state for PNL calculation
      updatePNL({
        result: gamer.betInformation.win_or_lose,
        betAmount: gamer.betInformation.betAmount,
        reward: gameTable.winners_Rewards,
      });

      return result;
    }, {});

    // Calculate overall totals for the entire table
    const overallTotal = Object.values(gamersByDate).reduce(
      (result, dateData) => {
        result.totalGames += dateData.totalGames;
        result.totalWin += dateData.totalWin;
        result.totalLoss += dateData.totalLoss;
        result.totalAmountWin += dateData.totalAmountWin;
        result.totalAmountLoss += dateData.totalAmountLoss;
        result.totalWinnerAmountByReward += dateData.totalWinnerAmountByReward;
        result.totalPNL += dateData.totalPNL;

        return result;
      },
      {
        totalGames: 0,
        totalWin: 0,
        totalLoss: 0,
        totalAmountWin: 0,
        totalAmountLoss: 0,
        totalWinnerAmountByReward: 0,
        totalPNL: 0,
      }
    );

    // Calculate count of winners and losers for each date
    const winnersLosersByDate = Object.keys(gamersByDate).reduce(
      (result, date) => {
        const winnersCount = gamersByDate[date].gamers.filter(
          (gamer) => gamer.result === "win"
        ).length;
        const losersCount = gamersByDate[date].gamers.filter(
          (gamer) => gamer.result === "lose"
        ).length;

        result[date] = {
          winnersCount,
          losersCount,
          totalWin: gamersByDate[date].totalWin,
          totalLoss: gamersByDate[date].totalLoss,
          totalGames: gamersByDate[date].totalGames,
          totalAmountWin: gamersByDate[date].totalAmountWin,
          totalAmountLoss: gamersByDate[date].totalAmountLoss,
          totalWinnerAmountByReward:
            gamersByDate[date].totalWinnerAmountByReward,
          totalPNL: gamersByDate[date].totalPNL,
        };
        return result;
      },
      {}
    );

    // Calculate last 7 days PNL
    const last7DaysPNL = calculateLastNDaysPNL(gamersByDate, 7);

    // Calculate last 30 days PNL
    const last30DaysPNL = calculateLastNDaysPNL(gamersByDate, 30);
    const OveralltablePNL = calculateRealTimeOverallPNL();
    // You can customize the response format based on your requirements
    const gameTableDetails = {
      table_ID: gameTable.table_ID,
      table_ID: gameTable._id,
      status: gameTable.status,
      total_Investor_Seats: gameTable.total_Investor_Seats,
      per_Share_Cost: gameTable.per_Share_Cost,
      winners_Rewards: gameTable.winners_Rewards,
      bet_Size: gameTable.bet_Size,
      Bankers_Address: gameTable.Bankers_Address,
      BaseToken: gameTable.Based_Token,
      gamersByDate,
      winnersLosersByDate,
      overallTotal, // Include overall totals for the entire table
      last7DaysPNL, // Include last 7 days PNL
      last30DaysPNL, // Include last 30 days PNL
      Overall_Table_PNL: OveralltablePNL + gameTable.Based_Token,
      investors: gameTable.investors,
      Region: gameTable.Region,
    };

    res.status(200).json({ success: true, gameTable: gameTableDetails });
  } catch (error) {
    console.error("Error getting game table details:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { Table_PNL_Details };
