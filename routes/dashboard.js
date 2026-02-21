const express = require("express");
const Route = express.Router();
const RouteName = "/Dashboard";
const DashboardController = require("../controllers/DashboardController");
const { verifyTokenWithbus_id } = require("../middleware/verifytokenwithrole");

Route.get(
  RouteName + "/getSummaryStats",
  verifyTokenWithbus_id,
  DashboardController.getSummaryStats
);

Route.get(
  RouteName + "/getSalesTrends",
  verifyTokenWithbus_id,
  DashboardController.getSalesTrends
);

Route.get(
  RouteName + "/getTopRanking",
  verifyTokenWithbus_id,
  DashboardController.getTopRanking
);

module.exports = Route;
