// routes/gameTableRoutes.js
const express = require("express");
const router = express.Router();
const PNLRecords = require("../controllers/pnlControler")


router.get('/Details/:table_ID', PNLRecords.Table_PNL_Details);



module.exports = router;
