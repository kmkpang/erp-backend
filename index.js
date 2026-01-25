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

// Routes
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());
app.use(authRoute);
app.use(productRoute);
app.use(employeeRoute);
app.use(migrateRoute);
app.use(QuotationSale);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
