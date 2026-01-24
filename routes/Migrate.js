const express = require("express");
const Route = express.Router();
const RouteName = "/migrate";
const MigrateController = require("../controllers/MigrateController");
const multer = require("multer");
var upload = multer({ dest: "import/" });
const {
  uploadAndExtractZip,
  deleteAllData,
} = require("../controllers/uploadController");
const {
  verifyTokenWithRole,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

Route.get(RouteName + "/deploydata", MigrateController.deploydata);

Route.get(RouteName + "/tablelist", MigrateController.tablelist);

Route.get(
  RouteName + "/export-csv/:tableName",
  verifyTokenWithbus_id,
  MigrateController.exportCsv
);

Route.get(RouteName + "/export-all-csv", MigrateController.exportAllCsv);

Route.post(
  RouteName + "/importcsv",
  upload.single("csvFile"),
  MigrateController.importCsv
);

// API Endpoint สำหรับอัปโหลดไฟล์ zip
Route.post(
  RouteName + "/import-all-csv",
  upload.single("zipFile"),
  async (req, res) => {
    const zipFilePath = req.file.path;
    try {
      //   await deleteAllData();x
      await uploadAndExtractZip(zipFilePath);
      res.send("File uploaded and data updated successfully.");
    } catch (error) {
      console.error("Error processing zip file:", error);
      res.status(500).send("Error processing zip file.");
    }
  }
);

module.exports = Route;
