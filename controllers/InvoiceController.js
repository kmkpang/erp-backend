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
const { Expense } = require("../model/productModel");

class InvoiceController {
  static async createInvoice(req, res) {
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
      let { sale_id } = req.body;

      // Case 1: Create from Existing Quotation
      if (sale_id) {
        const existingInvoice = await Invoice.findOne({
          where: { sale_id: sale_id },
        });

        if (existingInvoice) {
          await transaction.rollback();
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Invoice for this quotation already exists.",
          );
        }

        const quotation = await Quotation_sale.findOne({
          where: { sale_id: sale_id, bus_id: bus_id },
        });

        if (!quotation) {
          await transaction.rollback();
          return ResponseManager.ErrorResponse(
            req,
            res,
            404,
            "Quotation not found or does not belong to this business.",
          );
        }

        // Generate Invoice Number
        // ... (Logic to generate invoice number is repetitive, maybe extract to helper? Keeping inline for now)
        const today = new Date();
        const invoiceDateStr =
          req.body.inv_date || today.toISOString().split("T")[0];

        const lastInvoice = await Invoice.findOne({
          include: {
            model: Quotation_sale,
            where: { bus_id },
          },
          order: [["invoice_number", "DESC"]],
        });

        let newInvoiceNumber = "";
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayPrefix = `${yy}${mm}${dd}`;

        if (req.body.inv_num && req.body.inv_num !== "IV") {
          // Use provided number if valid? Or always auto-gen?
          // User usually wants to manage numbers or have them auto-gen.
          // If checking for duplicate manually:
          // const checkDup = ...
          // Let's assume auto-generation priority if "IV" or empty, else usage.
          newInvoiceNumber = req.body.inv_num;
        } else {
          if (!lastInvoice || !lastInvoice.invoice_number) {
            newInvoiceNumber = `IV-${todayPrefix}0001`;
          } else {
            const lastCode = lastInvoice.invoice_number;
            // Check format to ensure safe parsing
            if (lastCode.startsWith(`IV-${todayPrefix}`)) {
              const lastNumberPart = lastCode.slice(9);
              const nextNumber = parseInt(lastNumberPart) + 1;
              const nextNumberStr = String(nextNumber).padStart(4, "0");
              newInvoiceNumber = `IV-${todayPrefix}${nextNumberStr}`;
            } else {
              newInvoiceNumber = `IV-${todayPrefix}0001`;
            }
          }
        }

        const newInvoice = await Invoice.create(
          {
            invoice_number: newInvoiceNumber,
            invoice_date: invoiceDateStr,
            invoice_status: "Pending",
            remark: req.body.remark || "",
            sale_id: sale_id,
          },
          { transaction },
        );

        // Update Quotation Status
        await Quotation_sale.update(
          {
            status: "Invoiced", // Update to Invoiced as per requirement
          },
          {
            where: {
              sale_id: sale_id,
            },
            transaction,
          },
        );

        await transaction.commit();
        return ResponseManager.SuccessResponse(
          req,
          res,
          201,
          newInvoice,
          "Invoice created successfully.",
        );
      } else {
        // Case 2: Create from Scratch (Auto-Create Quotation first)
        // Need customer info, products, etc.

        // Generate Quotation Number (Hidden/Auto)
        const lastQuotation = await Quotation_sale.findOne({
          where: { bus_id },
          order: [["sale_number", "DESC"]],
        });

        // ... (Simple Auto Gen for Quotation) ...
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayPrefix = `${yy}${mm}${dd}`;

        let newQuotationNumber = `QT-${todayPrefix}0001`; // Fallback

        if (
          lastQuotation &&
          lastQuotation.sale_number &&
          lastQuotation.sale_number.startsWith(`QT-${todayPrefix}`)
        ) {
          const lastNumberPart = lastQuotation.sale_number.slice(9);
          const nextNumber = parseInt(lastNumberPart) + 1;
          newQuotationNumber = `QT-${todayPrefix}${String(nextNumber).padStart(4, "0")}`;
        }

        const newQuotation = await Quotation_sale.create(
          {
            sale_number: newQuotationNumber,
            sale_date: req.body.inv_date,
            bus_id: bus_id,
            cus_id: req.body.cus_id,
            employeeID: req.body.employeeID,
            sale_totalprice: req.body.total_grand,
            status: "Invoiced", // Created and immediately invoiced
            remark: req.body.remark || "",
            remarkInfernal: "Auto-generated from Invoice Creation",
            discount_quotation: req.body.discount_invoice || "0",
            vatType: req.body.vatType || "non-vat",
            credit_date_number: req.body.credit_date_number || "0",
            credit_expired_date: req.body.credit_expired_date,
          },
          { transaction },
        );

        // Create Details
        const products = req.body.products || [];
        const details = products.map((p) => ({
          ...p,
          sale_id: newQuotation.sale_id,
        }));
        await Quotation_sale_detail.bulkCreate(details, { transaction });

        const newInvoice = await Invoice.create(
          {
            invoice_number: req.body.inv_num,
            invoice_date: req.body.inv_date,
            invoice_status: "Pending",
            remark: req.body.remark || "",
            sale_id: newQuotation.sale_id,
          },
          { transaction },
        );

        await transaction.commit();
        return ResponseManager.SuccessResponse(
          req,
          res,
          201,
          newInvoice,
          "Invoice created successfully.",
        );
      }
    } catch (err) {
      if (
        transaction.finished !== "commit" &&
        transaction.finished !== "rollback"
      )
        await transaction.rollback();
      console.error("Error in createInvoice:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getInvoice(req, res) {
    try {
      let result = [];

      const { bus_id } = req.userData;

      const log = await sequelize.query(
        `
        select   *, 
  invoices.deleted_at AS invoice_deleted_at,
  invoices.remark AS invoices_remark
from invoices
Left join quotation_sales on quotation_sales.sale_id = invoices.sale_id
Left join businesses on businesses.bus_id = quotation_sales.bus_id
Left join banks on banks.bank_id = businesses.bank_id
Left join customers on quotation_sales.cus_id = customers.cus_id
left join employees on employees."employeeID"  = quotation_sales."employeeID" 
Left join billings on billings.invoice_id = invoices.invoice_id 
WHERE quotation_sales.bus_id = :bus_id AND invoices.invoice_number NOT LIKE '%IV-AUTO%'
ORDER BY invoices.invoice_number ASC;
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id }, // <-- ปลอดภัยและสะอาด
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

      log.forEach((sale) => {
        const saleData = {
          sale_id: sale.sale_id,
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
          invoice_remark: sale.invoices_remark,
          vatType: sale.vatType,
          discount_quotation: sale.discount_quotation,
          deleted_at: sale.invoice_deleted_at,
          billing:
            sale.invoice_status !== "Issue a receipt"
              ? "Pending"
              : sale.billing_number,
          details: [],
        };

        // Filter product details for the current sale
        const saleDetails = product_detail.filter(
          (detail) => detail.sale_id === sale.sale_id,
        );
        saleDetails.forEach((detail) => {
          let price = 0;
          const qty = detail.sale_qty || 1;
          const salePrice = detail.sale_price || 0;
          const discount = detail.sale_discount || 0;

          if (detail.discounttype === "percent") {
            if (qty > 0 && 100 - discount !== 0) {
              price = (salePrice * 100) / ((100 - discount) * qty);
            }
          } else {
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
      });

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getTaxInvoice(req, res) {
    try {
      let result = [];

      const { bus_id } = req.userData;

      const log = await sequelize.query(
        `
  SELECT 
  tax_invoices.tax_invoice_id AS tax_id_alias,
  tax_invoices.sale_id AS sale_id_alias,
  tax_invoices.invoice_id AS invoice_id_alias,
  tax_invoices.deleted_at AS tax_invoice_deleted_at,
  * 
FROM tax_invoices
Left join invoices on invoices.invoice_id = tax_invoices.invoice_id
Left join quotation_sales on quotation_sales.sale_id = invoices.sale_id
Left join businesses on businesses.bus_id = quotation_sales.bus_id
Left join banks on banks.bank_id = businesses.bank_id
Left join customers on quotation_sales.cus_id = customers.cus_id
left join employees on employees."employeeID"  = quotation_sales."employeeID" 
Left join billings on billings.invoice_id = invoices.invoice_id 
WHERE quotation_sales.bus_id = :bus_id
ORDER BY tax_invoices.tax_invoice_number ASC;
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id }, // <-- ปลอดภัยและสะอาด
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

      log.forEach((sale) => {
        const saleData = {
          tax_invoice_id: sale.tax_id_alias,
          sale_id: sale.sale_id_alias,
          quotation_num: sale.sale_number,
          tax_invoice_number: sale.tax_invoice_number,
          tax_invoice_date: sale.tax_invoice_date,
          tax_invoice_status: sale.tax_invoice_status,
          tax_invoice_remark: sale.tax_invoice_remark,
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
          invoice_id: sale.invoice_id_alias,
          invoice_number: sale.invoice_number,
          invoice_status: sale.invoice_status,
          invoice_date: sale.invoice_date,
          invoice_remark: sale.remark,
          vatType: sale.vatType,
          deleted_at: sale.tax_invoice_deleted_at,
          discount_quotation: sale.discount_quotation,
          billing:
            sale.invoice_status !== "Issue a receipt"
              ? "Pending"
              : sale.billing_number,
          details: [],
        };

        // Filter product details for the current sale
        const saleDetails = product_detail.filter(
          (detail) => detail.sale_id === sale.sale_id,
        );
        saleDetails.forEach((detail) => {
          let price = 0;
          const qty = detail.sale_qty || 1;
          const salePrice = detail.sale_price || 0;
          const discount = detail.sale_discount || 0;

          if (detail.discounttype === "percent") {
            if (qty > 0 && 100 - discount !== 0) {
              price = (salePrice * 100) / ((100 - discount) * qty);
            }
          } else {
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
        console.log(log);
        // Add the complete sale data to the result
        result.push(saleData);
      });

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async editTaxInvoice(req, res) {
    try {
      const { bus_id } = req.userData;

      const existQuatationSale = await TaxInvoice.findOne({
        where: {
          invoice_id: req.params.id,
        },
      });

      // if (existQuatationSale) {
      //   const existingQuo = await TaxInvoice.findOne({
      //     where: {
      //       invoice_number: req.body.invoice_number,
      //       invoice_id: { [Op.ne]: req.params.id },
      //     },
      //     include: {
      //       model: Quotation_sale,
      //       where: { bus_id },
      //     },
      //   });

      //   if (existingQuo) {
      //     await ResponseManager.ErrorResponse(
      //       req,
      //       res,
      //       400,
      //       "Invoice already exists"
      //     );
      //     return;
      //   }
      // }
      // console.log("req.body.tax_invoice_status", req.body.invoice_status);

      // console.log("-------------->>billingOfInvoice", billingOfInvoice);
      if (req.body.invoice_status === "Issue a receipt") {
        const today = new Date();
        const BillingDateStr = today.toISOString().split("T")[0];

        // const lastBilling = await Billing.findOne({
        //   order: [["billing_number", "DESC"]],
        // }); // return billing object อันสุดท้าย ถ้ามี ถ้าไม่มี เป็น null
        const [lastBilling] = await sequelize.query(`
          SELECT billings.*
          FROM billings
          LEFT JOIN invoices ON invoices.invoice_id = billings.invoice_id
          LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
          WHERE quotation_sales.bus_id = '${bus_id}'
          ORDER BY billings.billing_number DESC
          LIMIT 1
        `);

        const billingOfInvoice = await Billing.findOne({
          where: {
            invoice_id: req.params.id,
          },
        });

        let newBillingNumber = "";

        // สร้าง prefix วันที่แบบ yyMMdd
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayPrefix = `${yy}${mm}${dd}`; // เช่น 250424

        if (
          !lastBilling ||
          lastBilling.length === 0 ||
          !lastBilling[0].billing_number
        ) {
          newBillingNumber = `BI-${todayPrefix}0001`;
        } else {
          const lastCode = lastBilling[0].billing_number; // เช่น BI-2504240003
          const lastDatePart = lastCode.slice(3, 9);
          const lastNumberPart = lastCode.slice(9);

          let nextNumber = 1;

          if (lastDatePart === todayPrefix) {
            nextNumber = parseInt(lastNumberPart) + 1;
          }

          const nextNumberStr = String(nextNumber).padStart(4, "0");
          newBillingNumber = `BI-${todayPrefix}${nextNumberStr}`;
        }

        if (!billingOfInvoice) {
          await Billing.create({
            billing_number: newBillingNumber,
            billing_date: BillingDateStr,
            billing_status: "Complete",
            payments: "Cash",
            remark: "",
            invoice_id: req.params.id,
            tax_invoice_id: req.body.tax_invoice_id,
            sale_id: req.body.sale_id,
          });

          await TaxInvoice.update(
            {
              deleted_at: new Date().toISOString(),
            },
            {
              where: {
                invoice_id: req.params.id,
              },
            },
          );
        }
      }

      // await Invoice.update(
      //   {
      //     invoice_date: req.body.invoice_date,
      //     invoice_status: req.body.invoice_status,
      //     remark: req.body.remark,
      //   },
      //   {
      //     where: {
      //       invoice_id: req.params.id,
      //     },
      //   }
      // );
      // const { bus_id } = req.userData;
      console.log("-------------->", req.params.id);

      await sequelize.query(`
        UPDATE tax_invoices
        SET tax_invoice_date = '${req.body.invoice_date}',
            tax_invoice_status = '${req.body.invoice_status}',
            tax_invoice_remark = '${req.body.remark}'
        FROM quotation_sales
        WHERE tax_invoices.invoice_id = '${req.params.id}'
          AND quotation_sales.sale_id = tax_invoices.sale_id
          AND quotation_sales.bus_id = '${req.userData.bus_id}'
      `);

      return ResponseManager.SuccessResponse(req, res, 200, "Invoice Saved");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async deleteTaxInvoice(req, res) {
    try {
      const deleteqto = await TaxInvoice.findOne({
        where: {
          invoice_id: req.params.id,
        },
      });
      if (deleteqto) {
        await TaxInvoice.destroy({
          where: {
            invoice_id: req.params.id,
          },
        });
        await Billing.destroy({
          where: {
            invoice_id: req.params.id,
          },
        });

        await Invoice.update(
          {
            invoice_status: "Pending",
            deleted_at: "",
          },
          {
            where: {
              invoice_id: req.params.id,
            },
          },
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Invoice Deleted",
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Invoice found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async editInvoice(req, res) {
    try {
      const { bus_id } = req.userData;

      const existQuatationSale = await Invoice.findOne({
        where: {
          invoice_id: req.params.id,
        },
      });

      if (existQuatationSale) {
        const existingQuo = await Invoice.findOne({
          where: {
            invoice_number: req.body.invoice_number,
            invoice_id: { [Op.ne]: req.params.id },
          },
          include: {
            model: Quotation_sale,
            where: { bus_id },
          },
        });

        if (existingQuo) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Invoice already exists",
          );
          return;
        }
      }

      if (req.body.invoice_status === "Issue a receipt") {
        const today = new Date();
        const BillingDateStr = today.toISOString().split("T")[0];

        // const lastBilling = await Billing.findOne({
        //   order: [["billing_number", "DESC"]],
        // }); // return billing object อันสุดท้าย ถ้ามี ถ้าไม่มี เป็น null
        const [lastBilling] = await sequelize.query(`
          SELECT tax_invoices.*
          FROM tax_invoices
          LEFT JOIN invoices ON invoices.invoice_id = tax_invoices.invoice_id
          LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
          WHERE quotation_sales.bus_id = '${bus_id}'
          ORDER BY tax_invoices.tax_invoice_number DESC
          LIMIT 1
        `);

        const billingOfInvoice = await TaxInvoice.findOne({
          where: {
            invoice_id: req.params.id,
          },
        });

        const Invoice_quotataion = await Invoice.findOne({
          where: {
            invoice_id: req.params.id,
          },
        });

        let newBillingNumber = "";

        // สร้าง prefix วันที่แบบ yyMMdd
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayPrefix = `${yy}${mm}${dd}`; // เช่น 250424

        if (
          !lastBilling ||
          lastBilling.length === 0 ||
          !lastBilling[0].tax_invoice_number
        ) {
          newBillingNumber = `IV-${todayPrefix}0001`;
        } else {
          const lastCode = lastBilling[0].tax_invoice_number; // เช่น BI-2504240003
          const lastDatePart = lastCode.slice(3, 9);
          const lastNumberPart = lastCode.slice(9);

          let nextNumber = 1;

          if (lastDatePart === todayPrefix) {
            nextNumber = parseInt(lastNumberPart) + 1;
          }

          const nextNumberStr = String(nextNumber).padStart(4, "0");
          newBillingNumber = `IV-${todayPrefix}${nextNumberStr}`;
        }

        if (!billingOfInvoice) {
          await TaxInvoice.create({
            tax_invoice_number: newBillingNumber,
            tax_invoice_date: BillingDateStr,
            tax_invoice_status: "Pending",
            tax_invoice_remark: "",
            invoice_id: req.params.id,
            sale_id: Invoice_quotataion.sale_id,
          });

          await Invoice.update(
            {
              deleted_at: new Date().toISOString(),
            },
            {
              where: {
                invoice_id: req.params.id,
              },
            },
          );
        }
      }

      // await Invoice.update(
      //   {
      //     invoice_date: req.body.invoice_date,
      //     invoice_status: req.body.invoice_status,
      //     remark: req.body.remark,
      //   },
      //   {
      //     where: {
      //       invoice_id: req.params.id,
      //     },
      //   }
      // );
      // Update Quotation Sale and Details (Products) linked to this invoice
      const invoice = await Invoice.findOne({
        where: { invoice_id: req.params.id },
      });

      if (invoice && invoice.sale_id) {
        await Quotation_sale.update(
          {
            sale_totalprice: req.body.total_grand,
            discount_quotation: req.body.total_discount,
            vatType: req.body.vatType,
          },
          {
            where: {
              sale_id: invoice.sale_id,
              bus_id: bus_id,
            },
          },
        );

        if (req.body.products && Array.isArray(req.body.products)) {
          await Quotation_sale_detail.destroy({
            where: {
              sale_id: invoice.sale_id,
            },
          });

          const newDetails = req.body.products.map((p) => ({
            ...p,
            sale_id: invoice.sale_id,
          }));

          await Quotation_sale_detail.bulkCreate(newDetails);
        }
      }

      // const { bus_id } = req.userData;

      await sequelize.query(`
        UPDATE invoices
        SET invoice_date = '${req.body.invoice_date}',
            invoice_status = '${req.body.invoice_status}',
            remark = '${req.body.remark}'
        FROM quotation_sales
        WHERE invoices.invoice_id = '${req.params.id}'
          AND quotation_sales.sale_id = invoices.sale_id
          AND quotation_sales.bus_id = '${req.userData.bus_id}'
      `);

      return ResponseManager.SuccessResponse(req, res, 200, "Invoice Saved");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  //           400,
  //           "Invoice already exists"
  //         );
  //         return;
  //       }
  //     }

  //     if (req.body.invoice_status === "Issue a receipt") {
  //       const today = new Date();
  //       const BillingDateStr = today.toISOString().split("T")[0];

  //       // const lastBilling = await Billing.findOne({
  //       //   order: [["billing_number", "DESC"]],
  //       // }); // return billing object อันสุดท้าย ถ้ามี ถ้าไม่มี เป็น null
  //       const [lastBilling] = await sequelize.query(`
  //        SELECT billings.*
  //         FROM billings
  //         LEFT JOIN invoices ON invoices.invoice_id = billings.invoice_id
  //         LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
  //         WHERE quotation_sales.bus_id = '${bus_id}'
  //         ORDER BY billings.billing_number DESC
  //         LIMIT 1
  //       `);

  //       const billingOfInvoice = await TaxInvoice.findOne({
  //         where: {
  //           invoice_id: req.params.id,
  //         },
  //       });

  //       const Invoice_quotataion = await Invoice.findOne({
  //         where: {
  //           invoice_id: req.params.id,
  //         },
  //       });

  //       let newBillingNumber = "";

  //       // สร้าง prefix วันที่แบบ yyMMdd
  //       const now = new Date();
  //       const yy = String(now.getFullYear()).slice(-2);
  //       const mm = String(now.getMonth() + 1).padStart(2, "0");
  //       const dd = String(now.getDate()).padStart(2, "0");
  //       const todayPrefix = `${yy}${mm}${dd}`; // เช่น 250424

  //       if (
  //         !lastBilling ||
  //         lastBilling.length === 0 ||
  //         !lastBilling[0].tax_invoice_number
  //       ) {
  //         newBillingNumber = `BI-${todayPrefix}0001`;
  //       } else {
  //         const lastCode = lastBilling[0].tax_invoice_number; // เช่น BI-2504240003
  //         const lastDatePart = lastCode.slice(3, 9);
  //         const lastNumberPart = lastCode.slice(9);

  //         let nextNumber = 1;

  //         if (lastDatePart === todayPrefix) {
  //           nextNumber = parseInt(lastNumberPart) + 1;
  //         }

  //         const nextNumberStr = String(nextNumber).padStart(4, "0");
  //         newBillingNumber = `BI-${todayPrefix}${nextNumberStr}`;
  //       }

  //       if (!billingOfInvoice) {
  //         await Billing.create({
  //           billing_number: newBillingNumber,
  //           billing_date: BillingDateStr,
  //           billing_status: "Complete",
  //           payments: "Cash",
  //           remark: "",
  //         });
  //       }
  //     }

  //     // await Invoice.update(
  //     //   {
  //     //     invoice_date: req.body.invoice_date,
  //     //     invoice_status: req.body.invoice_status,
  //     //     remark: req.body.remark,
  //     //   },
  //     //   {
  //     //     where: {
  //     //       invoice_id: req.params.id,
  //     //     },
  //     //   }
  //     // );
  //     // const { bus_id } = req.userData;

  //     await sequelize.query(`
  //       UPDATE invoices
  //       SET invoice_date = '${req.body.invoice_date}',
  //           invoice_status = '${req.body.invoice_status}',
  //           remark = '${req.body.remark}'
  //       FROM quotation_sales
  //       WHERE invoices.invoice_id = '${req.params.id}'
  //         AND quotation_sales.sale_id = invoices.sale_id
  //         AND quotation_sales.bus_id = '${req.userData.bus_id}'
  //     `);

  //     return ResponseManager.SuccessResponse(req, res, 200, "Invoice Saved");
  //   } catch (err) {
  //     return ResponseManager.CatchResponse(req, res, err.message);
  //   }
  // }
  static async deleteInvoice(req, res) {
    try {
      const deleteqto = await Invoice.findOne({
        where: {
          sale_id: req.params.id,
        },
      });
      if (deleteqto) {
        await Invoice.destroy({
          where: {
            sale_id: req.params.id,
          },
        });
        await TaxInvoice.destroy({
          where: {
            sale_id: req.params.id,
          },
        });
        await Billing.destroy({
          where: {
            sale_id: req.params.id,
          },
        });

        await Quotation_sale.update(
          {
            status: "Pending",
            deleted_at: "",
          },
          {
            where: {
              sale_id: req.params.id,
            },
          },
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Invoice Deleted",
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Invoice found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = InvoiceController;
