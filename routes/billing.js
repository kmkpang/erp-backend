const express = require("express");
const Route = express.Router();
const RouteName = "/Billing";
const {
  verifyTokenWithRole,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

const BillingController = require("../controllers/BillingController");

const multer = require("multer");
var upload = multer({ dest: "import/" });
var type = upload.single("file");

Route.post(
  RouteName + "/createBilling",
  verifyTokenWithbus_id,
  BillingController.createBilling,
);

Route.put(
  RouteName + "/editBilling/:id",
  verifyTokenWithbus_id,
  BillingController.editBilling,
);

Route.get(
  RouteName + "/getBilling",
  verifyTokenWithbus_id,
  BillingController.getBilling,
);

Route.delete(RouteName + "/deleteBilling/:id", BillingController.deleteBilling);

Route.get(
  RouteName + "/checkLatestBilling",
  verifyTokenWithbus_id,
  BillingController.checkLatestBilling,
);

Route.post(
  RouteName + "/addDirectBilling",
  verifyTokenWithbus_id,
  BillingController.addDirectBilling,
);

module.exports = Route;
