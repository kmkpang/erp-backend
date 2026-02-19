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

async function exportData() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection established successfully.");

    const models = {
      Users: User,
      Roles: Role,
      UserActivities: UserActivity,
      Employees: Employee,
      Positions: Position,
      SalaryPays: Salary_pay,
      Departments: Department,
      Leavings: Leaving,
      Overtimes: Overtime,
      Products: Product,
      ProductTypes: productType,
      ProductCategories: productCategory,
      Transactions: Transaction,
      Expenses: Expense,
      Businesses: Business,
      Banks: Bank,
      Customers: Customer,
      QuotationSales: Quotation_sale,
      QuotationSaleDetails: Quotation_sale_detail,
      Invoices: Invoice,
      Billings: Billing,
      QuotationImgs: Quotation_img,
      CompanyPersons: Company_person,
      TaxInvoices: TaxInvoice,
    };

    const data = {};

    for (const [name, model] of Object.entries(models)) {
      console.log(`Fetching data for ${name}...`);
      const rows = await model.findAll({ raw: true });
      data[name] = rows;
      console.log(`Fetched ${rows.length} rows for ${name}.`);
    }

    const outputPath = path.join(__dirname, "database_dump.json");
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Data successfully exported to ${outputPath}`);
  } catch (error) {
    console.error("Error exporting data:", error);
  } finally {
    await sequelize.close();
  }
}

exportData();
