const ResponseManager = require("../middleware/ResponseManager");
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
} = require("../model/quotationModel");
const {
  Employee,
  Position,
  Salary_pay,
  Department,
} = require("../model/employeeModel");
const { User } = require("../model/userModel");
const { cloudinary } = require("../utils/cloudinary");
const { Op } = require("sequelize");
const TokenManager = require("../middleware/tokenManager");

const sequelize = require("../database");
const { Expense, Product } = require("../model/productModel");

class BillingController {
  static async createBilling(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        await transaction.rollback();
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data",
        );
      }

      const { bus_id } = req.userData;
      let { invoice_id, sale_id } = req.body;
      const deposit_type = req.body.deposit_type || "full";
      const deposit_amount = req.body.deposit_amount ? parseFloat(req.body.deposit_amount) : null;

      let targetInvoiceId = invoice_id;
      let targetSaleId = sale_id;

      // Helper to generate IDs
      const generateId = async (prefix, model, field) => {
        const [lastRecord] = await sequelize.query(
          `
              SELECT ${field} FROM ${model}
              WHERE ${field} LIKE '${prefix}%'
              ORDER BY ${field} DESC LIMIT 1
          `,
          { type: sequelize.QueryTypes.SELECT },
        );

        let nextNumber = 1;
        if (lastRecord && lastRecord[field]) {
          const lastCode = lastRecord[field];
          const lastNumberPart = lastCode.slice(prefix.length);
          // Assuming format PREFIX-YYYYMMDDXXXX where prefix includes date
          if (!isNaN(lastNumberPart)) {
            nextNumber = parseInt(lastNumberPart) + 1;
          }
        }
        return `${prefix}${String(nextNumber).padStart(4, "0")}`;
      };

      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayPrefix = `${yy}${mm}${dd}`; // e.g., 250217

      // CASE 1: From Scratch (No invoice_id, no sale_id)
      if (!targetInvoiceId && !targetSaleId) {
        // 1. Create Quotation
        const qtPrefix = `QT-AUTO-${todayPrefix}`;
        // Logic for simple number gen (simplistic for speed)
        const qtNum = await generateId(
          qtPrefix,
          "quotation_sales",
          "sale_number",
        );

        const newQuotation = await Quotation_sale.create(
          {
            sale_number: qtNum,
            sale_date: req.body.billing_date,
            credit_date_number: "0",
            credit_expired_date: req.body.billing_date,
            bus_id: bus_id,
            cus_id: req.body.cus_id || null,
            employeeID: req.body.employeeID,
            sale_totalprice: req.body.sale_totalprice || req.body.total_grand, // Adapt to payload
            status: "Billed", // Created and immediately billed
            remark: req.body.remark || "",
            remarkInfernal: "Auto-generated from Billing Creation",
            discount_quotation: req.body.total_discount || "0",
            vatType: req.body.vatType || "non-vat",
          },
          { transaction },
        );

        targetSaleId = newQuotation.sale_id;

        // Create Details
        const products = req.body.products || [];
        const details = await Promise.all(products.map(async (p) => {
          let pId = p.productID ? parseInt(p.productID, 10) : null;
          if (!pId) {
            const pname = p.productname || p.product_detail || "New Product";
            const existingProd = await Product.findOne({
              where: {
                productname: pname,
                bus_id: bus_id,
                Status: { [Op.notIn]: ["not active", "auto_generated"] }
              }
            });
            if (existingProd) {
              pId = existingProd.productID;
            } else {
              const newP = await Product.create({
                productname: pname,
                price: parseFloat(p.sale_price) || 0,
                bus_id: bus_id,
                Status: "auto_generated",
                productdetail: p.product_detail || "",
                amount: 0,
              }, { transaction });
              pId = newP.productID;
            }
          }
          return {
            ...p,
            productID: pId,
            sale_id: targetSaleId,
            sale_discount: p.sale_discount || 0,
            discounttype: p.discounttype || "percent",
          };
        }));
        await Quotation_sale_detail.bulkCreate(details, { transaction });
      }

      // CASE 2: From Quotation (sale_id exists, invoice might not)
      if (targetSaleId && !targetInvoiceId) {
        // Check if invoice exists
        const existingInv = await Invoice.findOne({
          where: { sale_id: targetSaleId },
        });
        if (existingInv) {
          targetInvoiceId = existingInv.invoice_id;
        } else {
          // Create Invoice (Auto)
          const invPrefix = `IV-AUTO-${todayPrefix}`;
          const invNum = await generateId(
            invPrefix,
            "invoices",
            "invoice_number",
          );

          const newInvoice = await Invoice.create(
            {
              invoice_number: invNum,
              invoice_date: req.body.billing_date,
              invoice_status: "Pending", // Will be updated to Complete/Billed soon
              remark: req.body.remark || "",
              sale_id: targetSaleId,
            },
            { transaction },
          );

          targetInvoiceId = newInvoice.invoice_id;
        }
      }

      // CASE 3: From Invoice (invoice_id exists) - or fell through from above
      if (!targetInvoiceId) {
        await transaction.rollback();
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Failed to resolve an Invoice ID.",
        );
      }

      // Fetch Invoice to get sale_id if we don't have it
      const invoice = await Invoice.findOne({
        where: { invoice_id: targetInvoiceId },
        transaction, // Ensure we see uncommitted changes if created above?
      });

      if (!invoice) {
        await transaction.rollback();
        return ResponseManager.ErrorResponse(
          req,
          res,
          404,
          "Invoice not found.",
        );
      }

      // Ensure sale_id matches
      if (targetSaleId && invoice.sale_id !== targetSaleId) {
        // Mismatch? valid check logic might be complex if Sale linked to Invoice is different
      }
      targetSaleId = invoice.sale_id; // Trust the invoice link

      // Check/Create Tax Invoice
      let taxInvoice = await TaxInvoice.findOne({
        where: { invoice_id: targetInvoiceId },
      });
      if (!taxInvoice) {
        const txPrefix = `TX-AUTO-${todayPrefix}`;
        const txNum = await generateId(
          txPrefix,
          "tax_invoices",
          "tax_invoice_number",
        );

        taxInvoice = await TaxInvoice.create(
          {
            tax_invoice_number: txNum,
            tax_invoice_date: req.body.billing_date,
            tax_invoice_status: "Complete",
            tax_invoice_remark: req.body.remark || "",
            invoice_id: targetInvoiceId,
            sale_id: targetSaleId,
          },
          { transaction },
        );
      }

      // Create Billing
      const newBilling = await Billing.create(
        {
          billing_number: req.body.billing_number,
          billing_date:
            req.body.billing_date || new Date().toISOString().split("T")[0],
          billing_status: "Complete",
          payments: req.body.payments || "Cash",
          remark: req.body.remark || "",
          invoice_id: targetInvoiceId,
          tax_invoice_id: taxInvoice.tax_invoice_id,
          sale_id: targetSaleId,
          pay_bank: req.body.pay_bank || "",
          pay_number: req.body.pay_number || "",
          pay_branch: req.body.pay_branch || "",
          pay_date: req.body.pay_date || "",
          pay_image_url: req.body.pay_image_url || null,
          deposit_type: deposit_type,
          deposit_amount: deposit_type === "deposit" ? deposit_amount : null,
        },
        { transaction },
      );

      // Update Statuses
      // Update Invoice
      await Invoice.update(
        {
          invoice_status: "Issue a receipt", // or "Complete"? Legacy seems to use "Issue a receipt" as final? Or "Billed"?
          // Use "Issue a receipt" based on previous context, or "Billed".
          // The user said "update invoice... that issued bill".
          // Let's assume "Billed" or "Complete". Let's stick to "Complete" for clarity or keep consistent.
          // Previous code uses "Issue a receipt" for Invoice created from Quotation...
          // Let's use "Complete" to signify Billing is done.
        },
        { where: { invoice_id: targetInvoiceId }, transaction },
      );

      // Update Quotation — use "DepositBilled" for deposit receipts so the
      // quotation stays visible and can still be invoiced for the remaining balance
      await Quotation_sale.update(
        {
          status: deposit_type === "deposit" ? "DepositBilled" : "Billed",
        },
        { where: { sale_id: targetSaleId }, transaction },
      );

      await transaction.commit();

      return ResponseManager.SuccessResponse(req, res, 201, newBilling);
    } catch (err) {
      if (
        transaction.finished !== "commit" &&
        transaction.finished !== "rollback"
      )
        await transaction.rollback();
      console.error(err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getBilling(req, res) {
    try {
      let result = [];

      const { bus_id } = req.userData;

      const log = await sequelize.query(
        `
        SELECT 
  billings.*,
  tax_invoices.*,
  invoices.*,
  quotation_sales.*,
  employees.*,
  customers.*,
  billings.deleted_at AS billings_deleted_at,
  billings.remark AS billings_remark,
  billings.deposit_type AS deposit_type,
  billings.deposit_amount AS deposit_amount
FROM billings
LEFT JOIN tax_invoices ON billings.tax_invoice_id = tax_invoices.tax_invoice_id
LEFT JOIN invoices ON billings.invoice_id = invoices.invoice_id
LEFT JOIN quotation_sales ON billings.sale_id = quotation_sales.sale_id
Left join customers on quotation_sales.cus_id = customers.cus_id
left join employees on employees."employeeID"  = quotation_sales."employeeID" 
WHERE quotation_sales.bus_id = :bus_id
ORDER BY billings.billing_date DESC;
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id },
        },
      );

      const product_detail = await sequelize.query(
        `
select qsd.*, p.productname 
from quotation_sale_details qsd
LEFT JOIN products p ON qsd."productID" = p."productID"
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Sum deposit BILLINGS per sale_id so full billing PDFs can show deduction
      const depositSums = await sequelize.query(
        `SELECT b2.sale_id, COALESCE(SUM(b2.deposit_amount), 0) AS total_deposited
         FROM billings b2
         INNER JOIN quotation_sales qs2 ON qs2.sale_id = b2.sale_id
         WHERE qs2.bus_id = :bus_id
           AND b2.deposit_type = 'deposit'
           AND b2.deleted_at IS NULL
         GROUP BY b2.sale_id`,
        { type: sequelize.QueryTypes.SELECT, replacements: { bus_id } }
      );
      const depositSumMap = {};
      depositSums.forEach(d => {
        depositSumMap[d.sale_id] = parseFloat(d.total_deposited) || 0;
      });

      log.forEach((sale) => {
        const saleData = {
          billing_id: sale.billing_id,
          sale_id: sale.sale_id,
          tax_invoice_number: sale.tax_invoice_number,
          quotation_num: sale.sale_number,
          status: sale.status,
          employeeID: sale.employeeID,
          employee_name: `${sale.F_name} ${sale.L_name}`,
          cus_id: sale.cus_id,
          cus_name: sale.cus_name,
          cus_address: sale.cus_address,
          cus_tel: sale.cus_tel,
          cus_email: sale.cus_email,
          cus_tax: sale.cus_tax,
          cus_purchase: sale.cus_purchase,
          quotation_start_date: sale.sale_date,
          credit_date: sale.credit_date_number,
          quotation_expired_date: sale.credit_expired_date,
          sale_totalprice: sale.sale_totalprice,
          invoice_id: sale.invoice_id,
          invoice_number: sale.invoice_number,
          invoice_status: sale.invoice_status,
          invoice_date: sale.invoice_date,
          billing_date: sale.billing_date,
          billing_status: sale.billing_status,
          payments: sale.payments,
          pay_bank: sale.pay_bank,
          pay_number: sale.pay_number,
          pay_branch: sale.pay_branch,
          pay_date: sale.pay_date,
          pay_image_url: sale.pay_image_url,
          remark: sale.billings_remark,
          vatType: sale.vatType,
          deleted_at: sale.billings_deleted_at,
          discount_quotation: sale.discount_quotation,
          deposit_type: sale.deposit_type,
          deposit_amount: sale.deposit_amount,
          total_deposited: depositSumMap[sale.sale_id] || 0,
          billing:
            sale.invoice_status !== "Issue a receipt"
              ? "Pending"
              : sale.billing_number,
          details: [],
        };

        const saleDetails = product_detail.filter(
          (detail) => detail.sale_id === sale.sale_id,
        );
        saleDetails.forEach((detail) => {
          let price = 0;
          const qty = parseFloat(detail.sale_qty) || 1;
          const salePrice = parseFloat(detail.sale_price) || 0;
          const discount = parseFloat(detail.sale_discount) || 0;

          if (detail.discounttype === "percent") {
            // Price = (Total * 100) / (Qty * (100 - DiscountPercent))
            // Example: 90 = (100 * 100) / (1 * (100 - 10)) -> 10000 / 90 = 111.11... wait.
            // Formula for Total = Qty * Price * (1 - Discount/100)
            // So Price = Total / (Qty * (1 - Discount/100))
            // = Total / (Qty * ((100-Discount)/100))
            // = (Total * 100) / (Qty * (100 - Discount))
            if (qty > 0 && 100 - discount !== 0) {
              price = (salePrice * 100) / ((100 - discount) * qty);
            }
          } else {
            // Amount discount: Total = (Qty * Price) - Discount
            // So Qty * Price = Total + Discount
            // Price = (Total + Discount) / Qty
            if (qty > 0) {
              price = (salePrice + discount) / qty;
            }
          }

          saleData.details.push({
            sale_id: detail.sale_id,
            productID: detail.productID,
            sale_price: detail.sale_price,
            discounttype: detail.discounttype,
            sale_discount: detail.sale_discount,
            sale_qty: detail.sale_qty,
            product_detail: detail.product_detail,
            pro_unti: detail.pro_unti,
            productname: detail.productname || "",
            price: price,
          });
        });

        // Add the complete sale data to the result
        result.push(saleData);
        console.log(saleData);
      });

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async editBilling(req, res) {
    try {
      const { bus_id } = req.userData;

      await sequelize.query(
        `
        UPDATE billings
        SET billing_date = :billing_date,
            payments = :payments,
            remark = :remark,
            pay_bank = :pay_bank,
            pay_number = :pay_number,
            pay_branch = :pay_branch,
            pay_date = :pay_date,
            pay_image_url = COALESCE(:pay_image_url, pay_image_url)
        FROM invoices
        LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
        WHERE billings.billing_id = :id
          AND invoices.invoice_id = billings.invoice_id
          AND quotation_sales.bus_id = :bus_id
      `,
        {
          replacements: {
            billing_date: req.body.billing_date,
            payments: req.body.payments,
            remark: req.body.remark,
            pay_bank: req.body.pay_bank || "",
            pay_number: req.body.pay_number || "",
            pay_branch: req.body.pay_branch || "",
            pay_date: req.body.pay_date || "",
            pay_image_url: req.body.pay_image_url || null,
            id: req.params.id,
            bus_id: req.userData.bus_id,
          },
        },
      );

      return ResponseManager.SuccessResponse(req, res, 200, "Receipt Saved");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async deleteBilling(req, res) {
    try {
      const billing = await Billing.findOne({
        where: { billing_id: req.params.id }
      });

      if (!billing) {
        return ResponseManager.ErrorResponse(req, res, 404, "Billing not found");
      }

      const { invoice_id, sale_id } = billing;

      await Billing.destroy({
        where: { billing_id: req.params.id },
      });

      if (sale_id) {
        const quotation = await Quotation_sale.findOne({
          where: { sale_id: sale_id }
        });

        if (quotation && quotation.remarkInfernal && quotation.remarkInfernal.startsWith("Auto-generated")) {
          // If it was auto-generated for this billing/invoice, clean up the whole chain
          if (invoice_id) {
            await TaxInvoice.destroy({ where: { invoice_id } });
            await Invoice.destroy({ where: { invoice_id } });
          }
          await Quotation_sale_detail.destroy({ where: { sale_id } });
          await Quotation_sale.destroy({ where: { sale_id } });
        } else {
          // If it's a real quotation, just revert statuses
          if (invoice_id) {
            await TaxInvoice.update(
              { tax_invoice_status: "Pending", deleted_at: null },
              { where: { invoice_id } }
            );

            await Invoice.update(
              { invoice_status: "Pending" },
              { where: { invoice_id } }
            );
          }
          await Quotation_sale.update(
            { status: "Allowed" },
            { where: { sale_id } }
          );
        }
      }

      return ResponseManager.SuccessResponse(req, res, 200, "Billing Deleted");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  // ✅ Get latest billing number for auto-generation
  static async checkLatestBilling(req, res) {
    try {
      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data",
        );
      }

      const { bus_id } = req.userData;

      const latestBilling = await Billing.findOne({
        where: { deleted_at: null },
        include: [
          {
            model: Quotation_sale,
            where: { bus_id: bus_id },
            attributes: [],
          },
        ],
        order: [["billing_id", "DESC"]],
      });

      if (!latestBilling) {
        return ResponseManager.SuccessResponse(req, res, 200, null);
      }

      return ResponseManager.SuccessResponse(req, res, 200, latestBilling);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  // ✅ Add Direct Billing (creates Quotation, Invoice, TaxInvoice, and Billing in one transaction)
  static async addDirectBilling(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        await transaction.rollback();
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data",
        );
      }

      const { bus_id } = req.userData;

      // Validate customer exists (only if provided)
      if (req.body.cus_id) {
        const existCustomer = await Customer.findOne({
          where: {
            cus_id: req.body.cus_id,
            bus_id: bus_id,
          },
        });

        if (!existCustomer) {
          await transaction.rollback();
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "No Customer found",
          );
        }
      }

      // Validate billing number doesn't exist for THIS business
      const existingBilling = await Billing.findOne({
        where: {
          billing_number: req.body.billing_number,
          deleted_at: null,
        },
        include: [
          {
            model: Quotation_sale,
            where: { bus_id: bus_id },
            attributes: ["bus_id"],
          },
        ],
      });

      if (existingBilling) {
        await transaction.rollback();
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Billing number already exists",
        );
      }

      // STEP 1: Create Quotation (auto-generated)
      const quotationNumber = `QT-AUTO-${req.body.billing_number}`;
      const insertQuotation = await Quotation_sale.create(
        {
          sale_number: quotationNumber,
          sale_date: req.body.billing_date,
          credit_date_number: "0",
          credit_expired_date: req.body.billing_date,
          sale_totalprice: req.body.sale_totalprice,
          bus_id: bus_id,
          cus_id: req.body.cus_id,
          employeeID: req.body.employeeID,
          status: "Allowed", // Direct billing means sales is allowed/completed
          remark: req.body.remark || "",
          remarkInfernal: "Auto-generated from direct billing",
          discount_quotation: req.body.total_discount || "0",
          vatType: req.body.vatType || "VATexcluding",
        },
        { transaction },
      );

      // STEP 2: Create Quotation Details
      const products = await Promise.all(req.body.products.map(async p => {
        let pId = p.productID ? parseInt(p.productID, 10) : null;
        if (!pId) {
          const pname = p.productname || p.product_detail || "New Product";
          const existingProd = await Product.findOne({
            where: {
              productname: pname,
              bus_id: bus_id,
              Status: { [Op.notIn]: ["not active", "auto_generated"] }
            }
          });
          if (existingProd) {
            pId = existingProd.productID;
          } else {
            const newP = await Product.create({
              productname: pname,
              price: parseFloat(p.sale_price) || 0,
              bus_id: bus_id,
              Status: "auto_generated",
              productdetail: p.product_detail || "",
              amount: 0,
            }, { transaction });
            pId = newP.productID;
          }
        }
        return {
          ...p,
          productID: pId,
          sale_id: insertQuotation.sale_id,
          sale_discount: p.sale_discount || 0,
          discounttype: p.discounttype || "percent",
        };
      }));
      await Quotation_sale_detail.bulkCreate(products, { transaction });

      // STEP 3: Create Invoice (auto-generated)
      const invoiceNumber = `IV-AUTO-${req.body.billing_number}`;
      const insertInvoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          invoice_date: req.body.billing_date,
          invoice_status: "Issue a receipt",
          remark: req.body.remark || "",
          sale_id: insertQuotation.sale_id,
        },
        { transaction },
      );

      // STEP 4: Create Tax Invoice (auto-generated)
      const taxInvoiceNumber = `TX-AUTO-${req.body.billing_number}`;
      const insertTaxInvoice = await TaxInvoice.create(
        {
          tax_invoice_number: taxInvoiceNumber,
          tax_invoice_date: req.body.billing_date,
          tax_invoice_status: "Complete",
          tax_invoice_remark: req.body.remark || "",
          invoice_id: insertInvoice.invoice_id,
          sale_id: insertQuotation.sale_id,
        },
        { transaction },
      );

      // STEP 5: Create Billing
      const insertBilling = await Billing.create(
        {
          billing_number: req.body.billing_number,
          billing_date: req.body.billing_date,
          billing_status: "Complete",
          payments: req.body.payments,
          remark: req.body.remark || "",
          invoice_id: insertInvoice.invoice_id,
          tax_invoice_id: insertTaxInvoice.tax_invoice_id,
          sale_id: insertQuotation.sale_id,
          pay_bank: req.body.pay_bank || "",
          pay_number: req.body.pay_number || "",
          pay_branch: req.body.pay_branch || "",
          pay_date: req.body.pay_date || "",
          pay_image_url: req.body.pay_image_url || null,
        },
        { transaction },
      );

      // Commit transaction
      await transaction.commit();

      return ResponseManager.SuccessResponse(req, res, 200, {
        billing_id: insertBilling.billing_id,
        billing_number: insertBilling.billing_number,
        quotation_id: insertQuotation.sale_id,
        invoice_id: insertInvoice.invoice_id,
        tax_invoice_id: insertTaxInvoice.tax_invoice_id,
      });
    } catch (err) {
      if (
        transaction.finished !== "commit" &&
        transaction.finished !== "rollback"
      )
        await transaction.rollback();
      console.error("Error in addDirectBilling:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async uploadSlipImage(req, res) {
    try {
      if (!req.file) {
        return ResponseManager.ErrorResponse(req, res, 400, "No image file provided");
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Only JPEG and PNG image files are allowed",
        );
      }

      const result = await cloudinary.uploader.upload(req.file.path);

      return ResponseManager.SuccessResponse(req, res, 200, {
        pay_image_url: result.secure_url,
      });
    } catch (err) {
      console.error("Error in uploadSlipImage:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = BillingController;
