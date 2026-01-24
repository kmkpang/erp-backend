const express = require("express");
const Route = express.Router();
const RouteName = "/Quotation";
const {
  verifyTokenWithRole,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

const QuotationSaleController = require("../controllers/QuotationSaleController");

const multer = require("multer");
var upload = multer({ dest: "import/" });
var type = upload.single("file");

Route.get(RouteName + "/getBusiness", QuotationSaleController.getBusiness);
Route.get(
  RouteName + "/getCustomer",
  verifyTokenWithbus_id,
  QuotationSaleController.getCustomer
);
Route.post(
  RouteName + "/addCustomer",
  verifyTokenWithbus_id,
  QuotationSaleController.addCustomer
);
Route.put(
  RouteName + "/editCustomer/:id",
  QuotationSaleController.editCustomer
);
Route.put(
  RouteName + "/editCustomer2/:id",
  QuotationSaleController.editCustomer2
);
Route.delete(
  RouteName + "/deleteCustomer/:id",
  QuotationSaleController.deleteCustomer
);
Route.delete(
  RouteName + "/deleteCustomer2/:id",
  QuotationSaleController.deleteCustomer2
);
Route.post(
  RouteName + "/addBusiness",
  upload.single("file"),
  QuotationSaleController.addBusiness
);
Route.post(
  RouteName + "/addQuotationSale",
  upload.single("file"),
  verifyTokenWithbus_id,
  QuotationSaleController.addQuotationSale
);
Route.put(
  RouteName + "/editQuotationSale/:id",
  verifyTokenWithbus_id,
  QuotationSaleController.editQuotationSale
);
Route.get(
  RouteName + "/getQuotation",
  verifyTokenWithbus_id,
  QuotationSaleController.getQuotation
);
Route.delete(
  RouteName + "/deleteQuotation/:id",
  QuotationSaleController.deleteQuotation
);
Route.put(
  RouteName + "/editInvoice/:id",
  verifyTokenWithbus_id,
  QuotationSaleController.editInvoice
);
Route.get(
  RouteName + "/getInvoice",
  verifyTokenWithbus_id,
  QuotationSaleController.getInvoice
);
Route.get(
  RouteName + "/getTaxInvoice",
  verifyTokenWithbus_id,
  QuotationSaleController.getTaxInvoice
);
Route.put(
  RouteName + "/editTaxInvoice/:id",
  verifyTokenWithbus_id,
  QuotationSaleController.editTaxInvoice
);
Route.delete(
  RouteName + "/deleteTaxInvoice/:id",
  QuotationSaleController.deleteTaxInvoice
);
Route.delete(
  RouteName + "/deleteInvoice/:id",
  QuotationSaleController.deleteInvoice
);
Route.put(
  RouteName + "/editBilling/:id",
  verifyTokenWithbus_id,
  QuotationSaleController.editBilling
);
Route.get(
  RouteName + "/getBilling",
  verifyTokenWithbus_id,
  QuotationSaleController.getBilling
);
Route.delete(
  RouteName + "/deleteBilling/:id",
  QuotationSaleController.deleteBilling
);
Route.get(
  RouteName + "/getBusinessByID",
  verifyTokenWithbus_id,
  QuotationSaleController.getBusinessByID
);

Route.get(
  RouteName + "/getBank",
  verifyTokenWithbus_id,
  QuotationSaleController.getBank
);
Route.put(
  RouteName + "/editBusiness/:id",
  upload.single("file"),
  QuotationSaleController.editBusiness
);
Route.get(
  RouteName + "/checkLastestQuotation",
  verifyTokenWithbus_id,
  QuotationSaleController.checkLastestQuotation
);
Route.get(
  RouteName + "/exportFileQuotationData/:id",
  QuotationSaleController.exportFileQuotationData
);
Route.post(
  RouteName + "/AddQuotation_img",
  // verifyTokenWithbus_id,
  type,
  QuotationSaleController.AddQuotation_img
);
Route.delete(
  RouteName + "/deleteQuotataion_img",
  QuotationSaleController.deleteQuotataion_img
);
Route.get(
  RouteName + "/getQuotation_img",
  QuotationSaleController.getQuotation_img
);
Route.put(
  RouteName + "/Edit_getQuotation_img/:id",
  type,
  QuotationSaleController.Edit_getQuotation_img
);

Route.get(
  RouteName + "/getCompanyPerson",
  verifyTokenWithbus_id,
  QuotationSaleController.getCompanyPerson
);
Route.post(
  RouteName + "/addCustomer2",
  verifyTokenWithbus_id,
  QuotationSaleController.addCustomer2
);

Route.post(
  RouteName + "/get_sale_report_product_type",
  verifyTokenWithbus_id,
  QuotationSaleController.GetSaleReportByProductType
);
Route.post(
  RouteName + "/get_sale_report_category",
  verifyTokenWithbus_id,
  QuotationSaleController.GetSaleReportByCategory
);
Route.post(
  RouteName + "/get_sale_report_product_rank",
  verifyTokenWithbus_id,
  QuotationSaleController.GetSaleReportByProdcutRank
);
Route.post(
  RouteName + "/get_sale_report_service",
  verifyTokenWithbus_id,
  QuotationSaleController.GetSaleReportByService
);

Route.post(
  RouteName + "/AddExpense_img",
  upload.single("file"),
  QuotationSaleController.AddExpense_img
);
module.exports = Route;
