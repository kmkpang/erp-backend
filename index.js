const express = require("express");
const sequelize = require("./database");
const cors = require("cors");
const app = express();
var bodyParser = require("body-parser");

// Sync Sequelize models with the database
sequelize.sync();

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
