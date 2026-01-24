const express = require("express");
const Route = express.Router();
const RouteName = "/product";
const {
  verifyTokenWithRole,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

const ProductController = require("../controllers/ProductController");
const { cloudinary } = require("../utils/cloudinary");

const multer = require("multer");
var upload = multer({ dest: "upload/" });
var type = upload.single("file");

Route.get(
  RouteName + "/getProduct",
  verifyTokenWithbus_id,
  ProductController.getProduct
);
Route.get(RouteName + "/getProductType", ProductController.getProductType);
Route.post(
  RouteName + "/getProductByProductType/:id",
  verifyTokenWithbus_id,
  ProductController.getProductByProductType
);
Route.post(
  RouteName + "/AddProduct",
  type,
  verifyTokenWithbus_id,
  ProductController.AddProduct
);
Route.put(RouteName + "/EditProduct/:id", type, ProductController.EditProduct);
Route.delete(RouteName + "/DeleteProduct/:id", ProductController.DeleteProduct);
Route.post(
  RouteName + "/AddCategory",
  verifyTokenWithbus_id,
  ProductController.AddCategory
);
Route.put(RouteName + "/EditCategory/:id", ProductController.EditCategory);
Route.delete(
  RouteName + "/DeleteCategory/:id",
  verifyTokenWithbus_id,
  ProductController.DeleteCategory
);
Route.post(RouteName + "/AddTransaction", ProductController.AddTransaction);
Route.put(
  RouteName + "/EditTransaction/:id",
  ProductController.EditTransaction
);
Route.post(RouteName + "/AddProductType", ProductController.AddProductType);
Route.delete(
  RouteName + "/DeleteProductType/:id",
  ProductController.DeleteProductType
);
Route.get(
  RouteName + "/getCategory",
  verifyTokenWithbus_id,
  ProductController.getCategory
);
Route.get(
  RouteName + "/getTransaction",
  verifyTokenWithbus_id,
  ProductController.getTransaction
);

Route.get(
  RouteName + "/getExpenses",
  verifyTokenWithbus_id,
  ProductController.getExpenses
);

Route.post(
  RouteName + "/addExpenses",
  verifyTokenWithbus_id,
  ProductController.addExpenses
);

Route.put(
  RouteName + "/editExpenses/:id",
  verifyTokenWithbus_id,
  ProductController.editExpenses
);

Route.delete(
  RouteName + "/deleteExpenses/:id",
  verifyTokenWithbus_id,
  ProductController.deleteExpenses
);

Route.put(RouteName + "/cut_strock_product", type, ProductController.CutStock);
module.exports = Route;
