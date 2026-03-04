const express = require("express");
const Route = express.Router();
const RouteName = "/Invoice";
const {
  verifyTokenWithRole,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

const InvoiceController = require("../controllers/InvoiceController");

const multer = require("multer");
var upload = multer({ dest: "import/" });
var type = upload.single("file");

Route.put(
  RouteName + "/editInvoice/:id",
  verifyTokenWithbus_id,
  InvoiceController.editInvoice,
);
Route.get(
  RouteName + "/getInvoice",
  verifyTokenWithbus_id,
  InvoiceController.getInvoice,
);

// Tax Invoice Routes
Route.get(
  RouteName + "/getTaxInvoice",
  verifyTokenWithbus_id,
  InvoiceController.getTaxInvoice,
);
Route.put(
  RouteName + "/editTaxInvoice/:id",
  verifyTokenWithbus_id,
  InvoiceController.editTaxInvoice,
);
Route.delete(
  RouteName + "/deleteTaxInvoice/:id",
  InvoiceController.deleteTaxInvoice,
);
Route.delete(RouteName + "/deleteInvoice/:id", InvoiceController.deleteInvoice);

// Create Invoice
Route.post(
  RouteName + "/createInvoice",
  verifyTokenWithbus_id,
  InvoiceController.createInvoice,
);

// Deposit Summary
Route.get(
  RouteName + "/getDepositSummary/:sale_id",
  verifyTokenWithbus_id,
  InvoiceController.getDepositSummary,
);

module.exports = Route;
