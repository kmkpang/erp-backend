const express = require("express");
const sequelize = require("./database");
const cors = require("cors");
const app = express();
var bodyParser = require("body-parser");

// Sync Sequelize models with the database
sequelize.sync().then(async () => {
  try {
    await sequelize.query(`
      ALTER TABLE billings ADD COLUMN IF NOT EXISTS pay_bank VARCHAR(150);
      ALTER TABLE billings ADD COLUMN IF NOT EXISTS pay_number VARCHAR(50);
      ALTER TABLE billings ADD COLUMN IF NOT EXISTS pay_branch VARCHAR(100);
      ALTER TABLE billings ADD COLUMN IF NOT EXISTS pay_date VARCHAR(40);
      ALTER TABLE businesses ALTER COLUMN bus_address TYPE VARCHAR(255);
      ALTER TABLE customers ALTER COLUMN cus_tel DROP NOT NULL;
      ALTER TABLE customers ALTER COLUMN cus_email DROP NOT NULL;
      ALTER TABLE customers ALTER COLUMN cus_purchase DROP NOT NULL;
      SELECT setval('company_people_company_person_id_seq', (SELECT MAX(company_person_id) FROM company_people));
    `);
    console.log("Database columns check/update completed.");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
});

const authRoute = require("./routes/Auth");
const productRoute = require("./routes/Product");
const employeeRoute = require("./routes/Employee");
const migrateRoute = require("./routes/Migrate");
const QuotationSale = require("./routes/quotation");
const InvoiceRoute = require("./routes/invoice");
const BillingRoute = require("./routes/billing");
const DashboardRoute = require("./routes/dashboard");

// Routes
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(authRoute);
app.use(productRoute);
app.use(employeeRoute);
app.use(migrateRoute);
app.use(QuotationSale);
app.use(InvoiceRoute);
app.use(BillingRoute);
app.use(DashboardRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
