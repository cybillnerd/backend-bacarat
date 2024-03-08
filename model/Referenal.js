const mongoose = require("mongoose");

const ReferelSchema = new mongoose.Schema({
  MyAddress: { type: String, required: true },
  MyReferalAddress: { type: String, required : true }, 
  DateTime: { type: Date, default: Date.now },
});
const ReferalShares = mongoose.model("Referals", ReferelSchema);

module.exports = ReferalShares;



// Referral System (Smart Contract):
// *  A referral system is implemented for advocates/referrers who introduce new players to join.
// *  Each referrer has a login portal with a decentralized wallet (Polygon enabled).
// *  Referrers are assigned unique weblinks that they can share with potential players for signup.
// *  When a new player signs up using the referral link, their wallet ID is associated with the referrer's wallet ID, creating a lifetime connection in the system.
// *  Whenever this player signs in with their wallet and plays, 0.1% of their bet wins commission goes to the referrer's wallet.
// *  If the player changes their wallet, the commission will not be attributed to the referrer.
 