const fs = require("fs");
const { User, Role, UserActivity } = require("../model/userModel"); // call model
const {
  Product,
  productType,
  productCategory,
  Transaction,
} = require("../model/productModel"); // call model
const {
  Employee,
  Position,
  Salary_pay,
  Department,
} = require("../model/employeeModel"); // call model
const ResponseManager = require("../middleware/ResponseManager");
const pgp = require("pg-promise")();
const sequelize = require("../database");
const archiver = require("archiver");
const path = require("path");
const csv = require("csv-parser");
const { QueryTypes } = require("sequelize");
const multer = require("multer");
var upload = multer({ dest: "import/" });
const unzipper = require("unzipper");
const TokenManager = require("../middleware/tokenManager");

const sourceDB = pgp({
  connectionString:
    "postgres://postgres:123456@localhost:5432/Test_VueJS_Project",
});
const { Sequelize, DataTypes } = require("sequelize");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

class MigrateController {
  static async deploydata(req, res) {
    try {
      const userMove = await sourceDB.query("SELECT * FROM users");
      const salaryMove = await sourceDB.query("SELECT * FROM salary_payments");
      const rolesMove = await sourceDB.query("SELECT * FROM roles");
      const productsMove = await sourceDB.query("SELECT * FROM products");
      const producttypesMove = await sourceDB.query(
        "SELECT * FROM product_types"
      );
      const producttransactionsMove = await sourceDB.query(
        "SELECT * FROM product_transactions"
      );
      const productcategoriesMove = await sourceDB.query(
        "SELECT * FROM product_categories"
      );
      const positionsMove = await sourceDB.query("SELECT * FROM positions");
      const employeesMove = await sourceDB.query("SELECT * FROM employees");
      const departmentsMove = await sourceDB.query("SELECT * FROM departments");
      const UserActivitiesMove = await sourceDB.query(
        'SELECT * FROM public."UserActivities"'
      );

      // Insert data into the destination database using bulkCreate
      await User.destroy({ truncate: true });
      await Salary_pay.destroy({ truncate: true });
      await Role.destroy({ truncate: true });
      await Product.destroy({ truncate: true });
      await productType.destroy({ truncate: true });
      await Transaction.destroy({ truncate: true });
      await productCategory.destroy({ truncate: true });
      await Position.destroy({ truncate: true });
      await Employee.destroy({ truncate: true });
      await Department.destroy({ truncate: true });
      await UserActivity.destroy({ truncate: true });

      await User.bulkCreate(userMove);
      await Salary_pay.bulkCreate(salaryMove);
      await Role.bulkCreate(rolesMove);
      await Product.bulkCreate(productsMove);
      await productType.bulkCreate(producttypesMove);
      await Transaction.bulkCreate(producttransactionsMove);
      await productCategory.bulkCreate(productcategoriesMove);
      await Position.bulkCreate(positionsMove);
      await Employee.bulkCreate(employeesMove);
      await Department.bulkCreate(departmentsMove);
      await UserActivity.bulkCreate(UserActivitiesMove);

      res.status(200).json({ message: "Data moved successfully" });
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      pgp.end();
    }
  }

  static async tablelist(req, res) {
    try {
      const query = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE';
      `;

      const [results, metadata] = await sequelize.query(query);

      const tableNames = results.map((row) => row.table_name);
      res.json({ tableNames });
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async exportCsv(req, res) {
    try {
      const tableName = req.params.tableName;

      const { bus_id } = req.userData;

      const data = await sequelize.query(
        `SELECT * FROM ${tableName} WHERE bus_id = :bus_id`,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { bus_id },
        }
      );

      if (data.length === 0) {
        return res.status(404).json({ error: "Table not found or empty" });
      }

      // รายชื่อ key ที่ต้องการลบ
      const excludedKeys = [
        "productID",
        "productTypeID",
        "categoryID",
        "productImg",
        "bus_id",
      ];

      // ลบคีย์ที่ไม่ต้องการออกจากข้อมูล
      const cleanedData = data.map((row) => {
        const newRow = { ...row };
        excludedKeys.forEach((key) => delete newRow[key]);
        return newRow;
      });

      // กำหนด header ตาม table (กรณี products)
      let header = [];

      if (tableName === "products") {
        header = [
          { id: "productname", title: "ชื่อสินค้า" },
          { id: "productdetail", title: "รายละเอียด" },
          { id: "amount", title: "จำนวน" },
          { id: "price", title: "ราคาขาย" },
          { id: "productcost", title: "ราคาทุน" },
          { id: "product_date", title: "วันที่เพิ่มสินค้า" },
          { id: "Status", title: "สถานะ" },
        ];
      } else {
        // ถ้าไม่ใช่ products ให้ใช้ชื่อ field เดิม
        header = Object.keys(cleanedData[0]).map((key) => ({
          id: key,
          title: key,
        }));
      }

      const filePath = path.join(__dirname, `../export/${tableName}.csv`);

      const csvWriter = createCsvWriter({
        path: filePath,
        header,
      });

      await csvWriter.writeRecords(cleanedData);

      res.download(filePath, `${tableName}.csv`, (err) => {
        if (err) {
          console.error("Error downloading CSV file:", err);
          res.status(500).json({ error: "Internal Server Error" });
        } else {
          console.log("CSV file downloaded successfully");
        }
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async exportAllCsv(req, res) {
    try {
      const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `;

      const [results, metadata] = await sequelize.query(query);

      if (!results || results.length === 0) {
        return res.status(404).json({ error: "No tables found" });
      }

      const tableNames = results.map((row) => row.table_name);

      const zipFilePath = path.join(
        `${__dirname}/../export/`,
        "exported_files.zip"
      );
      const zipStream = fs.createWriteStream(zipFilePath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      zipStream.on("close", () => {
        res.download(zipFilePath, "exported_files.zip", (err) => {
          if (err) {
            console.error("Error downloading zip file:", err);
            res.status(500).json({ error: "Internal Server Error" });
          } else {
            fs.unlinkSync(zipFilePath);

            for (const tableName of tableNames) {
              const csvFilePath = path.join(
                `${__dirname}/../export/`,
                `${tableName}.csv`
              );

              if (fs.existsSync(csvFilePath)) {
                fs.unlinkSync(csvFilePath);
                console.log(
                  `CSV file ${tableName}_export.csv removed successfully`
                );
              } else {
                console.log(
                  `CSV file ${tableName}_export.csv not found. Skipping...`
                );
              }
            }

            console.log("Zip file downloaded successfully");
          }
        });
      });

      archive.pipe(zipStream);

      for (const tableName of tableNames) {
        const data = await sequelize.query(`SELECT * FROM "${tableName}"`, {
          type: Sequelize.QueryTypes.SELECT,
        });

        if (data.length > 0) {
          const csvWriter = createCsvWriter({
            path: path.join(`${__dirname}/../export/`, `${tableName}.csv`),
            header: Object.keys(data[0]).map((key) => ({
              id: key,
              title: key,
            })),
          });

          await csvWriter.writeRecords(data);

          archive.append(
            fs.createReadStream(
              path.join(`${__dirname}/../export/`, `${tableName}.csv`)
            ),
            {
              name: `${tableName}.csv`,
            }
          );
        } else {
          console.log(`No data found for table: ${tableName}. Skipping...`);
          continue;
        }
      }

      archive.finalize();
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async importCsv(req, res) {
    try {
      const results = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", async () => {
          const tableName = req.body.tableName;
          const columns = results[0];

          try {
            await sequelize.transaction(async (transaction) => {
              await sequelize.query(
                `CREATE TABLE IF NOT EXISTS "${tableName}" (${Object.keys(
                  columns
                )
                  .map((key) => `"${key}" TEXT`)
                  .join(", ")})`,
                { transaction }
              );

              await sequelize.query(`DELETE FROM "${tableName}"`, {
                type: QueryTypes.DELETE,
                transaction,
              });

              for (const row of results) {
                const insertQuery = `INSERT INTO "${tableName}" (${Object.keys(
                  row
                )
                  .map((key) => `"${key}"`)
                  .join(", ")}) VALUES (${Object.values(row)
                  .map((value) => `'${value}'`)
                  .join(", ")})`;
                await sequelize.query(insertQuery, { transaction });
              }
            });

            res.status(200).json({
              message: "CSV file uploaded and data updated successfully",
            });
          } catch (error) {
            console.error("Error processing CSV data:", error);
            res.status(500).json({ error: "Failed to process CSV data" });
          }
        });
    } catch (error) {
      console.error("Error uploading CSV file:", error);
      res.status(500).json({ error: "Failed to upload CSV file" });
    }
  }

  static async importAllCsv(req, res) {
    try {
      const zipFilePath = req.file.path;
      const extractPath = path.join(__dirname, "extracted_files");

      await fs.promises.mkdir(extractPath, { recursive: true });
      await fs
        .createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise();

      const csvFiles = await fs.promises.readdir(extractPath);

      for (const csvFile of csvFiles) {
        const tableName = path.basename(csvFile, ".csv");
        console.log(tableName);

        const tableExists = await sequelize.query(
          `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = :tableName`,
          {
            type: QueryTypes.SELECT,
            replacements: { tableName },
          }
        );

        if (!tableExists.length) {
          console.error(`Table ${tableName} not found. Skipping.`);
          continue;
        }

        const csvFilePath = path.join(extractPath, csvFile);
        const uploadedData = await readUploadedCsv(csvFilePath);

        await sequelize.transaction(async (t) => {
          await sequelize.query(`DELETE FROM ${tableName}`, { transaction: t });
          await sequelize.models[tableName].bulkCreate(uploadedData, {
            transaction: t,
          });
        });

        console.log(`Data updated for table ${tableName}`);
      }
      res
        .status(200)
        .json({ message: "CSV files uploaded and data updated successfully" });

      await fs.promises.rm(extractPath, { recursive: true });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async updateAllTables(zipFilePath) {
    try {
      const extractedDir = "extracted_files";
      fs.mkdirSync(extractedDir);

      await fs
        .createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: extractedDir }))
        .promise();

      const csvFiles = fs.readdirSync(extractedDir);

      for (const csvFile of csvFiles) {
        if (csvFile.endsWith(".csv")) {
          const tableName = path.basename(csvFile, ".csv");
          const filePath = path.join(extractedDir, csvFile);
          await this.updateTableData(tableName, filePath);
        }
      }

      fs.rmdirSync(extractedDir, { recursive: true });
    } catch (error) {
      console.error("Error updating tables:", error);
      throw error;
    }
  }

  static async updateTableData(tableName, csvFilePath) {
    try {
      const data = await sequelize.query(`SELECT * FROM "${tableName}"`, {
        type: Sequelize.QueryTypes.SELECT,
      });

      if (data.length > 0) {
        const csvWriter = createCsvWriter({
          path: csvFilePath,
          header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
        });

        await csvWriter.writeRecords(data);
      }
    } catch (error) {
      console.error(`Error updating data for table ${tableName}:`, error);
      throw error;
    }
  }
}

async function readUploadedCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

module.exports = MigrateController;
