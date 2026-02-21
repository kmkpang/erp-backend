const { Quotation_sale, Quotation_sale_detail, Invoice, Billing, Customer } = require("../model/quotationModel");
const { Product, Expense } = require("../model/productModel");
const ResponseManager = require("../middleware/ResponseManager");
const { Op } = require("sequelize");
const sequelize = require("../database");
const moment = require("moment");
const TokenManager = require("../middleware/tokenManager");

class DashboardController {
  static async getSummaryStats(req, res) {
    try {
      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(req, res, 401, "Unauthorized");
      }
      
      // Define associations
      Invoice.belongsTo(Quotation_sale, { foreignKey: "sale_id" });
      Invoice.hasOne(Billing, { foreignKey: "invoice_id" });
      Quotation_sale.hasOne(Invoice, { foreignKey: "sale_id" });
      Billing.belongsTo(Invoice, { foreignKey: "invoice_id" });

      const { bus_id } = req.userData;
      const currentMonth = moment().format("YYYY-MM");
      const lastMonth = moment().subtract(1, "month").format("YYYY-MM");

      // 1. Monthly Sales (Current vs Last Month)
      const currentMonthSales = await Quotation_sale.sum("sale_totalprice", {
        where: {
          bus_id,
          sale_date: { [Op.like]: `${currentMonth}%` },
          status: { [Op.ne]: "expired" }
        }
      }) || 0;

      const lastMonthSales = await Quotation_sale.sum("sale_totalprice", {
        where: {
          bus_id,
          sale_date: { [Op.like]: `${lastMonth}%` },
          status: { [Op.ne]: "expired" }
        }
      }) || 0;

      // 2. Pending Invoices (Invoiced but not yet Billed)
      // We look for Invoices that don't have a linked Billing record
      const pendingInvoicesCount = await Invoice.count({
        distinct: true,
        col: "invoice_id",
        include: [{
          model: Quotation_sale,
          where: { bus_id },
          attributes: []
        }, {
          model: Billing,
          required: false,
          attributes: []
        }],
        where: {
          "$billing.billing_id$": null
        }
      });

      // 3. Total Overdue (Credit expired and not fully billed)
      const today = moment().format("YYYY-MM-DD");
      const overdueAmount = await Quotation_sale.sum("sale_totalprice", {
        include: [{
          model: Invoice,
          attributes: [],
          include: [{ model: Billing, required: false, attributes: [] }]
        }],
        where: {
          bus_id,
          credit_expired_date: { [Op.lt]: today },
          status: "Invoiced",
          "$invoice.billing.billing_id$": null
        }
      }) || 0;

      // 4. Expenses this month
      const currentMonthExpenses = await Expense.sum("expense_amount", {
        where: {
          bus_id,
          expense_date: { [Op.like]: `${currentMonth}%` }
        }
      }) || 0;

      return ResponseManager.SuccessResponse(req, res, 200, {
        monthlySales: currentMonthSales,
        lastMonthSales,
        pendingInvoicesCount,
        overdueAmount,
        currentMonthExpenses,
        estimatedProfit: currentMonthSales - currentMonthExpenses
      });
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getSalesTrends(req, res) {
    try {
      const { bus_id } = req.userData;
      
      // Hourly/Daily sales for the last 30 days
      const thirtyDaysAgo = moment().subtract(30, "days").format("YYYY-MM-DD");
      
      const salesByDay = await Quotation_sale.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("sale_date")), "date"],
          [sequelize.fn("SUM", sequelize.col("sale_totalprice")), "total"]
        ],
        where: {
          bus_id,
          sale_date: { [Op.gte]: thirtyDaysAgo },
          status: { [Op.ne]: "expired" }
        },
        group: [sequelize.fn("DATE", sequelize.col("sale_date"))],
        order: [[sequelize.fn("DATE", sequelize.col("sale_date")), "ASC"]]
      });

      return ResponseManager.SuccessResponse(req, res, 200, salesByDay);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getTopRanking(req, res) {
    try {
      const { bus_id } = req.userData;

      // Define associations
      Quotation_sale_detail.belongsTo(Product, { foreignKey: "productID" });
      Quotation_sale_detail.belongsTo(Quotation_sale, { foreignKey: "sale_id" });
      Quotation_sale.belongsTo(Customer, { foreignKey: "cus_id" });

      // Top Products
      const topProducts = await Quotation_sale_detail.findAll({
        attributes: [
          "productID",
          [sequelize.fn("SUM", sequelize.col("sale_qty")), "total_qty"],
          [sequelize.fn("SUM", sequelize.literal('sale_qty * sale_price')), "total_revenue"]
        ],
        include: [
          {
            model: Product,
            attributes: ["productname"]
          },
          {
            model: Quotation_sale,
            where: { bus_id },
            attributes: []
          }
        ],
        group: ["quotation_sale_details.productID", "product.productID"],
        order: [[sequelize.literal("total_revenue"), "DESC"]],
        limit: 5
      });

      // Top Customers
      const topCustomers = await Quotation_sale.findAll({
        attributes: [
          "cus_id",
          [sequelize.fn("SUM", sequelize.col("sale_totalprice")), "total_spend"]
        ],
        include: [{ model: Customer, attributes: ["cus_name"] }],
        where: { bus_id },
        group: ["quotation_sales.cus_id", "customer.cus_id"],
        order: [[sequelize.literal("total_spend"), "DESC"]],
        limit: 5
      });

      return ResponseManager.SuccessResponse(req, res, 200, {
        topProducts,
        topCustomers
      });
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = DashboardController;
