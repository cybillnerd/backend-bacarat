const ReferalShares = require("../../model/Referenal");
const Gamer = require("../../model/gamer");

const addReferralInformation = async (req, res) => {
  try {
    const { myAddress, myReferalAddress } = req.body;

    // Check if there is already an entry for the given MyAddress
    const existingUser = await ReferalShares.findOne({ MyAddress: myAddress });

    if (!existingUser) {
      // If no account found, create a new account with referral information
      const newUser = new ReferalShares({
        MyAddress: myAddress,
        MyReferalAddress: myReferalAddress,
      });

      await newUser.save();

      res.json({
        success: true,
        message: "Referral information added successfully.",
        data: {
          MyAddress: newUser.MyAddress,
          MyReferalAddress: newUser.MyReferalAddress,
        },
      });
    } else {
      // If an entry already exists, return a message
      return res.json({
        success: true,
        message: "Referral information already exists and cannot be changed.",
        data: {
          MyAddress: existingUser.MyAddress,
          MyReferalAddress: existingUser.MyReferalAddress,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getDetails = async (req, res) => {
  try {
    // Extract referral address from request parameters
    const { referral_Address } = req.params;

    // Check if referral address is provided
    if (!referral_Address) {
      return res.status(400).json({ error: "Referral address is required" });
    }

    // Query the Gamer model to find gamers with the provided referral address
    const gamers = await Gamer.find({
      "referal_Information.referal_Address": referral_Address,
    });
    // Calculate total referral rewards using reduce
    console.log(referral_Address);
    // Check if any gamers were found
    if (!gamers || gamers.length === 0) {
      return res
        .status(404)
        .json({ error: "No gamers found with the provided referral address" });
    }

    // Prepare the response with game information for each gamer
    const gameInfo = await Promise.all(
      gamers.map(async (gamer) => {
        // Fetch rewards information from the ReferalShares collection
        const rewardsInfo = await ReferalShares.findOne({
          MyReferalAddress: gamer.referal_Information.referal_Address,
        });

        return {
          gamer_Address: gamer.gamer_Address,
          betInformation: gamer.betInformation,
          referal_Information: {
            Reward_Ammount: gamer.referal_Information.Reward_Ammount,
            referal_Address: rewardsInfo ? rewardsInfo.MyReferalAddress : null,
            // Add other reward information if needed
          },
        };
      })
    );

    // Calculate total referral rewards
    const totalReferralRewards = gameInfo.reduce(
      (total, game) => total + (game.referal_Information.Reward_Ammount || 0),
      0
    );

    const uniqueGamerAddresses = [
      ...new Set(gamers.map((gamer) => gamer.gamer_Address)),
    ];

    const organizedGameInfo = uniqueGamerAddresses.map((uniqueAddress) => {
      // Get all documents associated with the unique gamer_Address
      const documentsForAddress = gamers.filter(
        (gamer) => gamer.gamer_Address === uniqueAddress
      );

      // Calculate total referral rewards for the unique gamer_Address
      const totalReferralRewards = documentsForAddress.reduce(
        (total, doc) => total + (doc.referal_Information.Reward_Ammount || 0),
        0
      );

      // Calculate total betAmount for the unique gamer_Address
      const totalBetAmount = documentsForAddress.reduce(
        (total, doc) => total + (doc.betInformation.betAmount || 0),
        0
      );

      return {
        gamer_Address: uniqueAddress,
        totalReferralRewards,
        // totalBetAmount,
      };
    });

    // Send the game information and total referral rewards in the response
    res.status(200).json({
      //  gameInfo,
      totalReferralRewards,
      organizedGameInfo,
    });
  } catch (error) {
    console.error("Error fetching game information:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const referralList = async (req, res) => {
  try {
    const referrals = await ReferalShares.find({});
    res.status(200).json({
      message: "List of referrals fetched successfully",
      referrals: referrals,
    });
  } catch (error) {
    console.error("Error fetching game information:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addReferralInformation,
  getDetails,
  referralList,
};
