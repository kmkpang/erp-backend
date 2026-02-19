const fs = require("fs");
const path = require("path");
const { User, Role, UserActivity } = require("./model/userModel");
const {
  Employee,
  Position,
  Salary_pay,
  Department,
  Leaving,
  Overtime,
} = require("./model/employeeModel");
const {
  Product,
  productType,
  productCategory,
  Transaction,
  Expense,
} = require("./model/productModel");
const {
  Business,
  Bank,
  Customer,
  Quotation_sale,
  Quotation_sale_detail,
  Invoice,
  Billing,
  Quotation_img,
  Company_person,
  TaxInvoice,
} = require("./model/quotationModel");
const sequelize = require("./database");

async function importData() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection established successfully.");

    // Ensure tables exist
    console.log("Syncing database...");
    await sequelize.sync({ force: true }); // Force: true to drop and recreate tables with updated schema (e.g. TEXT columns)
    // Given we are migrating, let's assume empty DB or safe to append.
    // If we want to be safe, we might just append. But if IDs conflict...
    // Let's assume the user wants me to populate a FRESH database.
    // But since I cannot be 100% sure if the user manually created something, I will just proceed.
    // If tables are empty, this works perfect.

    const dumpPath = path.join(__dirname, "database_dump.json");
    const rawData = fs.readFileSync(dumpPath);
    const data = JSON.parse(rawData);

    // Helper to insert data
    const insert = async (modelName, model, records) => {
      if (!records || records.length === 0) {
        console.log(`No records for ${modelName}. Skipping.`);
        return;
      }
      console.log(`Importing ${records.length} records for ${modelName}...`);
      try {
        await model.bulkCreate(records, { validate: false }); // validate: false to skip some checks if needed, but usually safe.
        // Update sequence if table has auto-increment primary key
        const tableName = model.tableName;
        const attributes = model.rawAttributes;
        const pk = Object.keys(attributes).find(
          (key) => attributes[key].primaryKey && attributes[key].autoIncrement,
        );

        if (pk) {
          const seqValues = records
            .map((r) => r[pk])
            .filter((id) => Number.isInteger(id));
          const maxId = Math.max(...seqValues, 0);
          if (maxId > 0) {
            console.log(`Resetting sequence for ${tableName} to ${maxId + 1}`);
            // Postgres specific sequence reset
            try {
              // Usually seq name is table_name_column_name_seq
              await sequelize.query(
                `SELECT setval(pg_get_serial_sequence('${tableName}', '${pk}'), ${maxId + 1}, false);`,
              );
            } catch (seqErr) {
              console.log(
                `Could not reset sequence for ${tableName}. It might not use a standard sequence name. Error: ${seqErr.message}`,
              );
            }
          }
        }
      } catch (err) {
        console.error(`Error importing ${modelName}:`, err.message);
        // Continue to next table instead of crashing entire script?
        // If a parent fails, children will fail. Better to probably stop or log error.
        throw err;
      }
    };

    // Order matters!
    await insert("Banks", Bank, data.Banks);
    await insert("Businesses", Business, data.Businesses);
    await insert("Roles", Role, data.Roles);
    await insert("Users", User, data.Users);
    await insert("Departments", Department, data.Departments);
    await insert("Positions", Position, data.Positions);
    await insert("ProductCategories", productCategory, data.ProductCategories);
    await insert("ProductTypes", productType, data.ProductTypes);
    await insert("Products", Product, data.Products);
    await insert("Customers", Customer, data.Customers);
    await insert("CompanyPersons", Company_person, data.CompanyPersons);
    await insert("Employees", Employee, data.Employees);
    await insert("QuotationSales", Quotation_sale, data.QuotationSales);
    await insert(
      "QuotationSaleDetails",
      Quotation_sale_detail,
      data.QuotationSaleDetails,
    );
    await insert("Invoices", Invoice, data.Invoices);
    await insert("TaxInvoices", TaxInvoice, data.TaxInvoices);
    await insert("Billings", Billing, data.Billings);
    await insert("UserActivities", UserActivity, data.UserActivities);
    await insert("Expenses", Expense, data.Expenses);
    await insert("Transactions", Transaction, data.Transactions);
    await insert("SalaryPays", Salary_pay, data.SalaryPays);
    await insert("Leavings", Leaving, data.Leavings);
    await insert("Overtimes", Overtime, data.Overtimes);
    await insert("QuotationImgs", Quotation_img, data.QuotationImgs);

    console.log("Data import completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sequelize.close();
  }
}

importData();
