const express = require("express");
const Route = express.Router();
const RouteName = "/auth";
const AuthController = require("../controllers/AuthController");
const {
  verifyTokenWithRole,
  logUserActivity,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");
const { cloudinary } = require("../utils/cloudinary");
const multer = require("multer");
var upload = multer({ dest: "upload/" });
var type = upload.single("file");

Route.get(RouteName + "/", AuthController.index);
Route.post(RouteName + "/login", AuthController.login);
Route.post(RouteName + "/getToken/:username", AuthController.getToken);
Route.post(RouteName + "/checkAuthen", AuthController.checkAuthen);
Route.post(
  RouteName + "/RegisterUsers",
  verifyTokenWithbus_id,
  AuthController.RegisterUsers
);
Route.post(
  RouteName + "/RegisterNewUsers",
  type,
  AuthController.RegisterNewUsers
);
Route.delete(RouteName + "/DeleteUsers/:id", AuthController.DeleteUsers);
Route.put(
  RouteName + "/EditUsers/:id",
  verifyTokenWithbus_id,
  AuthController.EditUsers
);
Route.get(RouteName + "/GetRole", AuthController.GetRole);
Route.post(RouteName + "/AddRole", AuthController.AddRole);
Route.put(RouteName + "/EditRole/:id", AuthController.EditRole);
Route.delete(RouteName + "/DeleteRole/:id", AuthController.DeleteRole);

Route.get(
  RouteName + "/GetUsers",
  verifyTokenWithbus_id,
  AuthController.GetUsers
);
Route.get(RouteName + "/GetUserByID/:id", AuthController.GetUserByID);
Route.put(RouteName + "/forgetPassword", AuthController.forgetPassword);
Route.post(RouteName + "/checkEmail", AuthController.checkEmail);

Route.get("/protected-route", verifyTokenWithRole("SUPERUSER"), (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

module.exports = Route;
