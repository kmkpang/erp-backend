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

class QuotationSaleController {
  static async getBusiness(req, res) {
    try {
      Business.hasMany(Bank, { foreignKey: "bank_id" });

      const business = await Business.findAll({
        include: [
          {
            model: Bank,
          },
        ],
      });

      return ResponseManager.SuccessResponse(req, res, 200, business);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getCustomer(req, res) {
    try {
      Customer.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Customer, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      const customer = await Customer.findAll({
        where: { bus_id: bus_id },
      });

      return ResponseManager.SuccessResponse(req, res, 200, customer);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async addCustomer(req, res) {
    try {
      Customer.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Customer, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      const addCustomer = await Customer.findOne({
        where: {
          cus_name: req.body.cus_name,
          bus_id: bus_id,
        },
      });
      if (addCustomer) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer already exists"
        );
      }

      const addCustomerPhone = await Customer.findOne({
        where: {
          cus_tel: req.body.cus_tel,
          bus_id: bus_id,
        },
      });
      if (addCustomerPhone) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer Contact already exists"
        );
      }

      const addCustomerTax = await Customer.findOne({
        where: {
          cus_tax: req.body.cus_tax,
          bus_id: bus_id,
        },
      });
      if (addCustomerTax) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer tax already exists"
        );
      }
      const insert_cate = await Customer.create({
        cus_name: req.body.cus_name,
        cus_address: req.body.cus_address,
        cus_tel: req.body.cus_tel,
        cus_email: req.body.cus_email,
        cus_tax: req.body.cus_tax,
        cus_purchase: req.body.cus_purchase,
        bus_id: bus_id,
        Status: "active",
      });

      return ResponseManager.SuccessResponse(req, res, 200, insert_cate);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async editCustomer2(req, res) {
    try {
      const editemp = await Company_person.findOne({
        where: {
          company_person_id: req.params.id,
        },
      });
      if (editemp) {
        const existingUser = await Company_person.findOne({
          where: {
            company_person_name: req.body.company_person_name,
            company_person_id: { [Op.ne]: req.params.id },
          },
        });

        if (existingUser) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Customer already exists"
          );
          return;
        }
        await Company_person.update(
          {
            company_person_name: req.body.company_person_name,
            company_person_address: req.body.company_person_address,
            company_person_tel: req.body.company_person_tel,
            company_person_email: req.body.company_person_email,
            company_person_customer: req.body.company_person_customer,
          },
          {
            where: {
              company_person_id: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Updated"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async editCustomer(req, res) {
    try {
      const editemp = await Customer.findOne({
        where: {
          cus_id: req.params.id,
        },
      });
      if (editemp) {
        const existingUser = await Customer.findOne({
          where: {
            cus_name: req.body.cus_name,
            cus_id: { [Op.ne]: req.params.id },
          },
        });

        if (existingUser) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Customer already exists"
          );
          return;
        }

        const addCustomerPhone = await Customer.findOne({
          where: {
            cus_tel: req.body.cus_tel,

            cus_id: { [Op.ne]: req.params.id },
          },
        });
        if (addCustomerPhone) {
          return ResponseManager.SuccessResponse(
            req,
            res,
            400,
            "Customer Contact already exists"
          );
        }

        const addCustomerTax = await Customer.findOne({
          where: {
            cus_tax: req.body.cus_tax,

            cus_id: { [Op.ne]: req.params.id },
          },
        });
        if (addCustomerTax) {
          return ResponseManager.SuccessResponse(
            req,
            res,
            400,
            "Customer tax already exists"
          );
        }

        await Customer.update(
          {
            cus_name: req.body.cus_name,
            cus_address: req.body.cus_address,
            cus_tel: req.body.cus_tel,
            cus_email: req.body.cus_email,
            cus_tax: req.body.cus_tax,
            cus_purchase: req.body.cus_purchase,
          },
          {
            where: {
              cus_id: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Updated"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async deleteCustomer(req, res) {
    try {
      const deleteproduct = await Customer.findOne({
        where: {
          cus_id: req.params.id,
        },
      });
      if (deleteproduct) {
        // await Customer.destroy({
        //   where: {
        //     cus_id: req.params.id,
        //   },
        // });

        const updatedData = {
          Status: "not active",
        };

        await Customer.update(updatedData, {
          where: {
            cus_id: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Customer found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async deleteCustomer2(req, res) {
    try {
      const deleteproduct = await Company_person.findOne({
        where: {
          company_person_id: req.params.id,
        },
      });
      if (deleteproduct) {
        // await Customer.destroy({
        //   where: {
        //     cus_id: req.params.id,
        //   },
        // });

        const updatedData = {
          company_person_status: "not active",
        };

        await Company_person.update(updatedData, {
          where: {
            company_person_id: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Customer found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async addBusiness(req, res) {
    try {
      const checkBusiness = await Business.findOne({
        where: {
          bus_name: req.body.bus_name,
        },
      });
      if (!checkBusiness) {
        const allowedMimeTypes = ["image/jpeg", "image/png"];

        if (req.file && !allowedMimeTypes.includes(req.file.mimetype)) {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Only JPEG and PNG image files are allowed"
          );
        }

        if (req.file && req.file.size > 5 * 1024 * 1024) {
          res.status(400).json({ error: "File size exceeds 5 MB limit" });
        }
        const result = await cloudinary.uploader.upload(req.file.path);

        const createbank = await Bank.create({
          bank_name: req.body.bank_name,
          bank_account: req.body.bank_account,
          bank_number: req.body.bank_number,
        });
        if (createbank) {
          await Business.create({
            bus_name: req.body.bus_name,
            bus_address: req.body.bus_address,
            bus_website: req.body.bus_website,
            bus_tel: req.body.bus_tel,
            bus_tax: req.body.bus_tax,
            bus_logo: result.secure_url,
            bank_id: createbank.bank_id,
          });
        }
        return ResponseManager.SuccessResponse(req, res, 200, "Success");
      } else {
        let productUpdateData = {
          bus_name: req.body.bus_name,
          bus_address: req.body.bus_address,
          bus_website: req.body.bus_website,
          bus_tax: req.body.bus_tax,
          bus_tel: req.body.bus_tel,
          bank_name: req.body.bank_name,
          bank_account: req.body.bank_account,
          bank_number: req.body.bank_number,
        };

        if (req.file) {
          const allowedMimeTypes = ["image/jpeg", "image/png"];

          if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return ResponseManager.ErrorResponse(
              req,
              res,
              400,
              "Only JPEG and PNG image files are allowed"
            );
          }

          if (req.file.size > 5 * 1024 * 1024) {
            return ResponseManager.ErrorResponse(
              req,
              res,
              400,
              "File size exceeds 5 MB limit"
            );
          }

          const result = await cloudinary.uploader.upload(req.file.path);

          console.log("processssssss", result);

          console.log("==========test Before:", result.secure_url);
          productUpdateData.bus_logo = result.secure_url;

          console.log("==========test After:", productUpdateData.bus_logo);
        }

        await Business.update(productUpdateData, {
          where: {
            bus_id: 1,
          },
        });
        await Bank.update(productUpdateData, {
          where: {
            bank_id: 1,
          },
        });
        return ResponseManager.SuccessResponse(req, res, 200, "Success");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async addQuotationSaleOld(req, res) {
    try {
      const addCustomer = await Customer.findOne({
        where: {
          cus_email: req.body.cus_email,
        },
      });
      if (addCustomer) {
        const sale_chk = await Quotation_sale.findOne({
          where: {
            sale_number: req.body.sale_number,
          },
        });

        if (sale_chk) {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Quotation already exists"
          );
        } else {
          const insert_Quo = await Quotation_sale.create({
            sale_number: req.body.sale_number,
            sale_date: req.body.sale_date,
            credit_date_number: req.body.credit_date_number,
            credit_expired_date: req.body.credit_expired_date,
            sale_totalprice: req.body.sale_totalprice,
            bus_id: req.body.bus_id,
            cus_id: req.body.cus_id,
            employeeID: req.body.employeeID,
            discount_quotation: req.body.discount_quotation,
          });

          const products = req.body.products;
          for (let i = 0; i < products.length; i++) {
            products[i].sale_id = insert_Quo.sale_id;
          }
          console.log(insert_Quo.sale_id);

          await Quotation_sale_detail.bulkCreate(products);

          return ResponseManager.SuccessResponse(req, res, 200, "Success");
        }
      } else {
        const sale_chk = await Quotation_sale.findOne({
          where: {
            sale_number: req.body.sale_number,
          },
        });

        if (sale_chk) {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Quotation already exists"
          );
        } else {
          const insert_Customer = await Customer.create({
            cus_name: req.body.cus_name,
            cus_address: req.body.cus_address,
            cus_tel: req.body.cus_tel,
            cus_email: req.body.cus_email,
            cus_tax: req.body.cus_tax,
            cus_purchase: req.body.cus_purchase,
          });

          if (insert_Customer) {
            const insert_Quo = await Quotation_sale.create({
              sale_number: req.body.sale_number,
              sale_date: req.body.sale_date,
              credit_date_number: req.body.credit_date_number,
              credit_expired_date: req.body.credit_expired_date,
              sale_totalprice: req.body.sale_totalprice,
              bus_id: req.body.bus_id,
              cus_id: req.body.cus_id,
              employeeID: req.body.employeeID,
              status: req.body.status,
            });

            const products = req.body.products;
            for (let i = 0; i < products.length; i++) {
              products[i].sale_id = insert_Quo.sale_id;
            }
            console.log(insert_Quo.sale_id);

            await Quotation_sale_detail.bulkCreate(products);

            return ResponseManager.SuccessResponse(req, res, 200, "Success");
          }
        }
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async addQuotationSale(req, res) {
    console.log("Received sale_number:     ", req.body.sale_number);
    console.log("Received data:    ", req.body);
    try {
      Quotation_sale.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Quotation_sale, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      const existQuatationSale = await Quotation_sale.findOne({
        where: {
          sale_number: req.body.sale_number,
          bus_id: bus_id,
        },
      });

      if (existQuatationSale) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Quotation already exists"
        );
      }

      const existCustomer = await Customer.findOne({
        where: {
          cus_id: req.body.cus_id,
          bus_id: bus_id,
        },
      });

      if (!existCustomer) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Customer found"
        );
      }

      const insert_Quo = await Quotation_sale.create({
        sale_number: req.body.sale_number,
        sale_date: req.body.sale_date,
        credit_date_number: req.body.credit_date_number,
        credit_expired_date: req.body.credit_expired_date,
        sale_totalprice: req.body.sale_totalprice,
        bus_id: req.body.bus_id,
        cus_id: req.body.cus_id,
        employeeID: req.body.employeeID,
        status: req.body.status,
        remark: req.body.remark,
        remarkInfernal: req.body.remarkInfernal,
        discount_quotation: req.body.discount_quotation,
        vatType: req.body.vatType,
      });

      const products = req.body.products;
      for (let i = 0; i < products.length; i++) {
        products[i].sale_id = insert_Quo.sale_id;
      }
      console.log(insert_Quo.sale_id);
      await Quotation_sale_detail.bulkCreate(products);

      return ResponseManager.SuccessResponse(req, res, 200, insert_Quo);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async editQuotationSale(req, res) {
    try {
      const { bus_id } = req.userData;
      const existQuatationSale = await Quotation_sale.findOne({
        where: {
          sale_id: req.params.id,
        },
      });

      if (existQuatationSale) {
        const existingQuo = await Quotation_sale.findOne({
          where: {
            sale_number: req.body.sale_number,
            sale_id: { [Op.ne]: req.params.id },
            bus_id: bus_id,
          },
        });

        if (existingQuo) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Quotation already exists"
          );
          return;
        }
      }

      if (req.body.status === "Allowed") {
        const today = new Date();
        const invoiceDateStr = today.toISOString().split("T")[0];

        // const lastInvoice = await Invoice.findOne({
        //   order: [["invoice_number", "DESC"]],
        // });
        const lastInvoice = await Invoice.findOne({
          include: {
            model: Quotation_sale,
            where: { bus_id },
          },
          order: [["invoice_number", "DESC"]],
        });

        const QuotationOfInvoice = await Invoice.findOne({
          where: {
            sale_id: req.params.id,
          },
        });

        // let newInvoiceNumber;

        // if (!lastInvoice) {
        //   newInvoiceNumber = "IN-00000001";
        // } else {
        //   const lastNumber = parseInt(lastInvoice.invoice_number.slice(3));
        //   const nextNumber = lastNumber + 1;
        //   newInvoiceNumber = "IN-" + nextNumber.toString().padStart(8, "0");
        // }
        let newInvoiceNumber = "";
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const todayPrefix = `${yy}${mm}${dd}`; // เช่น 250424

        if (!lastInvoice || !lastInvoice.invoice_number) {
          newInvoiceNumber = `IN-${todayPrefix}0001`;
        } else {
          const lastDatePart = lastInvoice.invoice_number.slice(3, 9);
          const lastNumberPart = lastInvoice.invoice_number.slice(9);

          let nextNumber = 1;

          if (lastDatePart === todayPrefix) {
            nextNumber = parseInt(lastNumberPart) + 1;
          }

          const nextNumberStr = String(nextNumber).padStart(4, "0");
          newInvoiceNumber = `IN-${todayPrefix}${nextNumberStr}`;
        }

        if (!QuotationOfInvoice) {
          await Invoice.create({
            invoice_number: newInvoiceNumber,
            invoice_date: invoiceDateStr,
            invoice_status: "Pending",
            remark: "",
            sale_id: req.params.id,
          });

          await Quotation_sale.update(
            {
              deleted_at: new Date().toISOString(),
            },
            {
              where: {
                sale_id: req.params.id,
                bus_id: bus_id,
              },
            }
          );
        }
      }

      await Quotation_sale.update(
        {
          sale_date: req.body.sale_date,
          credit_date_number: req.body.credit_date_number,
          credit_expired_date: req.body.credit_expired_date,
          sale_totalprice: req.body.sale_totalprice,
          bus_id: req.body.bus_id,
          cus_id: req.body.cus_id,
          employeeID: req.body.employeeID,
          status: req.body.status,
          remark: req.body.remark,
          remarkInfernal: req.body.remarkInfernal,
          discount_quotation: req.body.discount_quotation,
          vatType: req.body.vatType,
        },
        {
          where: {
            sale_id: req.params.id,
            bus_id: bus_id,
          },
        }
      );

      const products = req.body.products;

      await Quotation_sale_detail.destroy({
        where: {
          sale_id: req.params.id,
        },
      });

      for (let i = 0; i < products.length; i++) {
        products[i].sale_id = req.params.id; // ใช้ sale_id ที่ส่งเข้ามา
        await Quotation_sale_detail.create(products[i]);
      }

      return ResponseManager.SuccessResponse(req, res, 200, "Quotation Saved");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getQuotation(req, res) {
    try {
      Quotation_sale.hasMany(Quotation_sale_detail, { foreignKey: "sale_id" });
      Quotation_sale_detail.belongsTo(Quotation_sale, {
        foreignKey: "sale_id",
      });

      Quotation_sale.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Quotation_sale, { foreignKey: "bus_id" });

      Business.hasMany(Bank, { foreignKey: "bank_id" });
      Bank.belongsTo(Business, { foreignKey: "bank_id" });

      Quotation_sale.belongsTo(Employee, { foreignKey: "employeeID" });
      Employee.hasMany(Quotation_sale, { foreignKey: "employeeID" });

      Quotation_sale.belongsTo(Customer, { foreignKey: "cus_id" });
      Customer.hasMany(Quotation_sale, { foreignKey: "cus_id" });

      Quotation_sale.hasOne(Invoice, { foreignKey: "sale_id" });
      Invoice.belongsTo(Quotation_sale, { foreignKey: "sale_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      let result = [];
      let quotationslist = [];

      quotationslist = await Quotation_sale.findAll({
        include: [
          { model: Quotation_sale_detail },
          { model: Employee },
          { model: Customer },
          { model: Business, include: [Bank] },
          { model: Invoice },
        ],
        where: { bus_id: bus_id },
        order: [["sale_number", "ASC"]], // <-- เรียงจากน้อยไปมาก
      });
      const today = new Date();
      console.log("-----------------------------------------");
      console.log(quotationslist);
      // return false

      for (let log of quotationslist) {
        const expiredDate = new Date(log.credit_expired_date);

        if (today > expiredDate) {
          log.status = "expired";

          await Quotation_sale.update(
            { status: "expired" },
            { where: { sale_id: log.sale_id } }
          );
        }

        result.push({
          sale_id: log.sale_id,
          quotation_num: log.sale_number,
          status: log.status,
          employeeID: log.employeeID,
          employee_name: log.employee.F_name + " " + log.employee.L_name,
          cus_id: log.cus_id,
          cus_name: log.customer.cus_name,
          cus_address: log.customer.cus_address,
          cus_tel: log.customer.cus_tel,
          cus_email: log.customer.cus_email,
          cus_tax: log.customer.cus_tax,
          cus_purchase: log.customer.cus_purchase,
          quotation_start_date: log.sale_date,
          credit_date: log.credit_date_number,
          quotation_expired_date: log.credit_expired_date,
          sale_totalprice: log.sale_totalprice,
          remark: log.remark,
          remarkInfernal: log.remarkInfernal,
          discount_quotation: log.discount_quotation,
          vatType: log.vatType,
          vat: log.vat,
          deleted_at: log.deleted_at,
          // bank_id: log.bank_id,
          invoice:
            !log.invoice || log.status !== "Allowed"
              ? "Pending"
              : log.invoice.invoice_number,
          //
          details: log.quotation_sale_details.map((detail) => ({
            sale_id: detail.sale_id,
            productID: detail.productID,
            sale_price: detail.sale_price,
            discounttype: detail.discounttype,
            sale_discount: detail.sale_discount,
            sale_qty: detail.sale_qty,
            product_detail: detail.product_detail,
            pro_unti: detail.pro_unti,
          })),
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
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
WHERE quotation_sales.bus_id = :bus_id
ORDER BY invoices.invoice_number ASC;
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id }, // <-- ปลอดภัยและสะอาด
        }
      );

      const product_detail = await sequelize.query(
        `
select * 
from quotation_sale_details
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
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
          (detail) => detail.sale_id === sale.sale_id
        );
        saleDetails.forEach((detail) => {
          saleData.details.push({
            sale_id: detail.sale_id,
            productID: detail.productID,
            sale_price: detail.sale_price,
            discounttype: detail.discounttype,
            sale_discount: detail.sale_discount,
            sale_qty: detail.sale_qty,
            product_detail: detail.product_detail,
            pro_unti: detail.pro_unti,
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
        }
      );

      const product_detail = await sequelize.query(
        `
select * 
from quotation_sale_details
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
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
          (detail) => detail.sale_id === sale.sale_id
        );
        saleDetails.forEach((detail) => {
          saleData.details.push({
            sale_id: detail.sale_id,
            productID: detail.productID,
            sale_price: detail.sale_price,
            discounttype: detail.discounttype,
            sale_discount: detail.sale_discount,
            sale_qty: detail.sale_qty,
            product_detail: detail.product_detail,
            pro_unti: detail.pro_unti,
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
            }
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
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Invoice Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Invoice found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  // static async getInvoice(req, res) {
  //   try {
  //     Quotation_sale.hasMany(Quotation_sale_detail, { foreignKey: "sale_id" });
  //     Quotation_sale_detail.belongsTo(Quotation_sale, {
  //       foreignKey: "sale_id",
  //     });

  //     Quotation_sale.belongsTo(Business, { foreignKey: "bus_id" });
  //     Business.hasMany(Quotation_sale, { foreignKey: "bus_id" });

  //     Business.hasMany(Bank, { foreignKey: "bank_id" });
  //     Bank.belongsTo(Business, { foreignKey: "bank_id" });

  //     Quotation_sale.belongsTo(Employee, { foreignKey: "employeeID" });
  //     Employee.hasMany(Quotation_sale, { foreignKey: "employeeID" });

  //     Quotation_sale.belongsTo(Customer, { foreignKey: "cus_id" });
  //     Customer.hasMany(Quotation_sale, { foreignKey: "cus_id" });

  //     Quotation_sale.hasOne(Invoice, { foreignKey: "sale_id" });
  //     Invoice.belongsTo(Quotation_sale, { foreignKey: "sale_id" });

  //     Invoice.hasOne(Billing, { foreignKey: "invoice_id" });
  //     Billing.belongsTo(Invoice, { foreignKey: "invoice_id" });

  //     const tokenData = await TokenManager.update_token(req);
  //     if (!tokenData) {
  //       return await ResponseManager.ErrorResponse(
  //         req,
  //         res,
  //         401,
  //         "Unauthorized: Invalid token data"
  //       );
  //     }

  //     const { bus_id } = req.userData;

  //     let result = [];
  //     let quotationslist = [];

  //     quotationslist = await Quotation_sale.findAll({
  //       include: [
  //         { model: Quotation_sale_detail },
  //         { model: Employee },
  //         { model: Customer },
  //         { model: Business, include: [Bank] },
  //         { model: Invoice, include: [Billing] },
  //       ],
  //       where: {
  //         status: "allowed",
  //         bus_id: bus_id,
  //       },
  //     });
  //     const today = new Date();

  //     for (let log of quotationslist) {
  //       // console.log("Invoice Date: ", log.invoice.invoice_date);
  //       // const expiredDate = new Date(log.invoice.invoice_date);

  //       result.push({
  //         sale_id: log.sale_id,
  //         quotation_num: log.sale_number,
  //         status: log.status,
  //         employeeID: log.employeeID,
  //         employee_name: log.employee.F_name + " " + log.employee.L_name,
  //         cus_id: log.cus_id,
  //         cus_name: log.customer.cus_name,
  //         cus_address: log.customer.cus_address,
  //         cus_tel: log.customer.cus_tel,
  //         cus_email: log.customer.cus_email,
  //         cus_tax: log.customer.cus_tax,
  //         cus_purchase: log.customer.cus_purchase,
  //         quotation_start_date: log.sale_date,
  //         credit_date: log.credit_date_number,
  //         quotation_expired_date: log.credit_expired_date,
  //         sale_totalprice: log.sale_totalprice,
  //         invoice_id: log.invoice.invoice_id,
  //         invoice_number: log.invoice.invoice_number,
  //         invoice_status: log.invoice.invoice_status,
  //         invoice_date: log.invoice.invoice_date,
  //         invoice_remark: log.invoice.remark,
  //         billing:
  //           !log.invoice.billing ||
  //           log.invoice.invoice_status !== "issue a receipt"
  //             ? "pending"
  //             : log.invoice.billing.billing_number,
  //         details: log.quotation_sale_details.map((detail) => ({
  //           sale_id: detail.sale_id,
  //           productID: detail.productID,
  //           sale_price: detail.sale_price,
  //           sale_discount: detail.sale_discount,
  //           sale_qty: detail.sale_qty,
  //         })),
  //       });
  //     }

  //     return ResponseManager.SuccessResponse(req, res, 200, result);
  //   } catch (err) {
  //     return ResponseManager.CatchResponse(req, res, err.message);
  //   }
  // }
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
            "Invoice already exists"
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
            }
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
  // static async editTaxInvoice(req, res) {
  //   try {
  //     const { bus_id } = req.userData;

  //     const existQuatationSale = await TaxInvoice.findOne({
  //       where: {
  //         invoice_id: req.params.id,
  //       },
  //     });

  //     if (existQuatationSale) {
  //       const existingQuo = await TaxInvoice.findOne({
  //         where: {
  //           invoice_number: req.body.invoice_number,
  //           invoice_id: { [Op.ne]: req.params.id },
  //         },
  //         include: {
  //           model: Quotation_sale,
  //           where: { bus_id },
  //         },
  //       });

  //       if (existingQuo) {
  //         await ResponseManager.ErrorResponse(
  //           req,
  //           res,
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
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Invoice Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Invoice found");
      }
    } catch (err) {
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
  billings.remark AS billings_remark
FROM billings
LEFT JOIN tax_invoices ON billings.tax_invoice_id = tax_invoices.tax_invoice_id
LEFT JOIN invoices ON billings.invoice_id = invoices.invoice_id
LEFT JOIN quotation_sales ON billings.sale_id = quotation_sales.sale_id
Left join customers on quotation_sales.cus_id = customers.cus_id
left join employees on employees."employeeID"  = quotation_sales."employeeID" 
WHERE quotation_sales.bus_id = :bus_id
ORDER BY invoices.invoice_number ASC;
      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id }, // <-- ปลอดภัยและสะอาด
        }
      );

      const product_detail = await sequelize.query(
        `
select * 
from quotation_sale_details
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

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
          remark: sale.billings_remark,
          vatType: sale.vatType,
          deleted_at: sale.billings_deleted_at,
          discount_quotation: sale.discount_quotation,
          billing:
            sale.invoice_status !== "Issue a receipt"
              ? "Pending"
              : sale.billing_number,
          details: [],
        };

        // Filter product details for the current sale
        const saleDetails = product_detail.filter(
          (detail) => detail.sale_id === sale.sale_id
        );
        saleDetails.forEach((detail) => {
          saleData.details.push({
            sale_id: detail.sale_id,
            productID: detail.productID,
            sale_price: detail.sale_price,
            discounttype: detail.discounttype,
            sale_discount: detail.sale_discount,
            sale_qty: detail.sale_qty,
            product_detail: detail.product_detail,
            pro_unti: detail.pro_unti,
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
  // static async getBilling(req, res) {
  //   try {
  //     Quotation_sale.hasMany(Quotation_sale_detail, { foreignKey: "sale_id" });
  //     Quotation_sale_detail.belongsTo(Quotation_sale, {
  //       foreignKey: "sale_id",
  //     });

  //     Quotation_sale.belongsTo(Business, { foreignKey: "bus_id" });
  //     Business.hasMany(Quotation_sale, { foreignKey: "bus_id" });

  //     Business.hasMany(Bank, { foreignKey: "bank_id" });
  //     Bank.belongsTo(Business, { foreignKey: "bank_id" });

  //     Quotation_sale.belongsTo(Employee, { foreignKey: "employeeID" });
  //     Employee.hasMany(Quotation_sale, { foreignKey: "employeeID" });

  //     Quotation_sale.belongsTo(Customer, { foreignKey: "cus_id" });
  //     Customer.hasMany(Quotation_sale, { foreignKey: "cus_id" });

  //     Quotation_sale.hasOne(Invoice, { foreignKey: "sale_id" });
  //     Invoice.belongsTo(Quotation_sale, { foreignKey: "sale_id" });

  //     Invoice.hasOne(Billing, { foreignKey: "invoice_id" });
  //     Billing.belongsTo(Invoice, { foreignKey: "invoice_id" });

  //     const tokenData = await TokenManager.update_token(req);
  //     if (!tokenData) {
  //       return await ResponseManager.ErrorResponse(
  //         req,
  //         res,
  //         401,
  //         "Unauthorized: Invalid token data"
  //       );
  //     }

  //     const { bus_id } = req.userData;

  //     let result = [];
  //     let quotationslist = [];

  //     quotationslist = await Quotation_sale.findAll({
  //       include: [
  //         { model: Quotation_sale_detail },
  //         { model: Employee },
  //         { model: Customer },
  //         { model: Business, include: [Bank] },
  //         {
  //           model: Invoice,
  //           where: {
  //             invoice_status: "Issue a receipt",
  //           },
  //           include: [Billing],
  //         },
  //       ],
  //       where: {
  //         bus_id: bus_id,
  //       },
  //     });
  //     const today = new Date();

  //     for (let log of quotationslist) {
  //       result.push({
  //         sale_id: log.sale_id,
  //         quotation_num: log.sale_number,
  //         status: log.status,
  //         employeeID: log.employeeID,
  //         employee_name: log.employee.F_name + " " + log.employee.L_name,
  //         cus_id: log.cus_id,
  //         cus_name: log.customer.cus_name,
  //         cus_address: log.customer.cus_address,
  //         cus_tel: log.customer.cus_tel,
  //         cus_email: log.customer.cus_email,
  //         cus_tax: log.customer.cus_tax,
  //         cus_purchase: log.customer.cus_purchase,
  //         quotation_start_date: log.sale_date,
  //         credit_date: log.credit_date_number,
  //         quotation_expired_date: log.credit_expired_date,
  //         sale_totalprice: log.sale_totalprice,
  //         invoice_id: log.invoice.invoice_id,
  //         invoice_number: log.invoice.invoice_number,
  //         invoice_status: log.invoice.invoice_status,
  //         invoice_date: log.invoice.invoice_date,
  //         billing_id: log.invoice?.billing?.billing_id,
  //         billing_number: log.invoice?.billing?.billing_number,
  //         billing_date: log.invoice?.billing?.billing_date,
  //         billing_status: log.invoice?.billing?.billing_status,
  //         payments: log.invoice?.billing?.payments,
  //         remark: log.invoice?.billing?.remark,
  //         vatType: log.vatType,
  //         details: log.quotation_sale_details.map((detail) => ({
  //           sale_id: detail.sale_id,
  //           productID: detail.productID,
  //           sale_price: detail.sale_price,
  //           discounttype: detail.discounttype,
  //           sale_discount: detail.sale_discount,
  //           sale_qty: detail.sale_qty,
  //           product_detail: detail.product_detail,
  //           pro_unti: detail.pro_unti,
  //         })),
  //       });
  //     }

  //     return ResponseManager.SuccessResponse(req, res, 200, result);
  //   } catch (err) {
  //     return ResponseManager.CatchResponse(req, res, err.message);
  //   }
  // }
  static async editBilling(req, res) {
    try {
      const { bus_id } = req.userData;

      const existQuatationSale = await Billing.findOne({
        where: {
          billing_id: req.params.id,
        },
      });

      if (existQuatationSale) {
        // const existingQuo = await Billing.findOne({
        //   where: {
        //     billing_number: req.body.billing_number,
        //     billing_id: { [Op.ne]: req.params.id },
        //   },
        //   include: [
        //     {
        //       model: Invoice,
        //       include: [
        //         {
        //           model: Quotation_sale,
        //           where: { bus_id }, // กรองตาม bus_id
        //         },
        //       ],
        //     },
        //   ],
        // });
        // const [existingQuo] = await sequelize.query(`
        //   SELECT billings.*
        //   FROM billings
        //   LEFT JOIN invoices ON invoices.invoice_id = billings.invoice_id
        //   LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
        //   WHERE billings.billing_number = '${req.body.billing_number}'
        //     AND billings.billing_id != '${req.params.id}'
        //     AND quotation_sales.bus_id = '${req.userData.bus_id}'
        // `);
        // if (existingQuo) {
        //   await ResponseManager.ErrorResponse(
        //     req,
        //     res,
        //     400,
        //     "Receipt already exists"
        //   );
        //   return;
        // }
      }

      // await Billing.update(
      //   {
      //     billing_date: req.body.billing_date,
      //     payments: req.body.payments,
      //     remark: req.body.remark,
      //   },
      //   {
      //     where: {
      //       billing_id: req.params.id,
      //     },
      //   }
      // );
      await sequelize.query(`
        UPDATE billings
        SET billing_date = '${req.body.billing_date}',
            payments = '${req.body.payments}',
            remark = '${req.body.remark}'
        FROM invoices
        LEFT JOIN quotation_sales ON quotation_sales.sale_id = invoices.sale_id
        WHERE billings.billing_id = '${req.params.id}'
          AND invoices.invoice_id = billings.invoice_id
          AND quotation_sales.bus_id = '${req.userData.bus_id}'
      `);

      return ResponseManager.SuccessResponse(req, res, 200, "Receipt Saved");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async deleteBilling(req, res) {
    try {
      // const deleteqto = await Billing.findOne({
      //   where: {
      //     billing_id: req.params.id,
      //   },
      // });
      // if (deleteqto) {
      //   const data_Billing = await Billing.findOne({
      //     where: {
      //       billing_id: req.params.id,
      //     },
      //   });
      //   const invoice_updated = await TaxInvoice.update(
      //     {
      //       tax_invoice_status: "Pending",
      //     },
      //     {
      //       where: {
      //         invoice_id: data_Billing.invoice_id,
      //       },
      //     }
      //   );
      //   if (invoice_updated) {
      await Billing.destroy({
        where: {
          invoice_id: req.params.id,
        },
      });

      await TaxInvoice.update(
        { tax_invoice_status: "Pending", deleted_at: "" },
        {
          where: {
            invoice_id: req.params.id,
          },
        }
      );

      return ResponseManager.SuccessResponse(req, res, 200, "Billing Deleted ");
      // } else {
      //   return ResponseManager.ErrorResponse(req, res, 400, "No Billing found");
      // }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async deleteQuotation(req, res) {
    try {
      const deleteqto = await Quotation_sale.findOne({
        where: {
          sale_id: req.params.id,
        },
      });
      if (deleteqto) {
        await Quotation_sale.destroy({
          where: {
            sale_id: req.params.id,
          },
        });

        await Quotation_sale.destroy({
          where: {
            sale_id: req.params.id,
          },
        });
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
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Quotation Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Quotation found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async exportFileQuotationData(req, res) {
    const { id } = req.params;

    try {
      const fileRecord = await Quotation_sale.findOne({
        where: { sale_id: id },
      });

      if (!fileRecord) {
        return res.status(404).json({ message: "File not found" });
      }

      const utf8Content = iconv.decode(fileRecord.file, "utf8");

      const tempDir = os.tmpdir();
      const filePath = path.join(tempDir, fileRecord.pdfname);
      fs.writeFileSync(filePath, utf8Content);

      res.download(filePath, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ message: "Error downloading file" });
        } else {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      return ResponseManager.CatchResponse(req, res, error.message);
    }
  }
  static async checkLastestQuotation(req, res) {
    try {
      Quotation_sale.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Quotation_sale, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      const lastestSale = await Quotation_sale.findOne({
        where: { bus_id: bus_id },
        order: [["sale_number", "DESC"]],
      });

      if (!lastestSale) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Quotation found"
        );
      }

      return ResponseManager.SuccessResponse(req, res, 200, lastestSale);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getBusinessByID(req, res) {
    try {
      Business.hasMany(Bank, { foreignKey: "bank_id" });
      Business.hasMany(User, { foreignKey: "bus_id" });
      User.belongsTo(Business, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);

      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id, userId } = req.userData;

      const business = await User.findOne({
        include: [
          {
            model: Business,
            include: [
              {
                model: Bank,
              },
            ],
          },
        ],
        where: {
          bus_id: bus_id,
          userID: userId,
        },
      });
      // console.log(userId);

      return ResponseManager.SuccessResponse(req, res, 200, business);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getBank(req, res) {
    try {
      const tokenData = await TokenManager.update_token(req);

      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const business = await Bank.findAll();

      return ResponseManager.SuccessResponse(req, res, 200, business);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async editBusiness(req, res) {
    try {
      const editproduct = await Business.findOne({
        where: {
          bus_id: req.params.id,
        },
      });

      if (editproduct) {
        if (req.file && req.file.size > 5 * 1024 * 1024) {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "File size exceeds 5 MB limit"
          );
          // res.status(400).json({ error: "File size exceeds 5 MB limit" });
        } else {
          let productUpdateData = {
            bus_name: req.body.bus_name,
            bus_address: req.body.bus_address,
            bus_website: req.body.bus_website,
            bus_tax: req.body.bus_tax,
            bus_tel: req.body.bus_tel,
            bank_name: req.body.bank_name,
            bank_account: req.body.bank_account,
            bank_number: req.body.bank_number,
          };

          if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            productUpdateData.bus_logo = result.secure_url;
          }

          await Business.update(productUpdateData, {
            where: {
              bus_id: req.params.id,
            },
          });
          await Bank.update(productUpdateData, {
            where: {
              bank_id: req.body.bank_id,
            },
          });
        }

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          req.body.bank_name
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Business found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async deleteQuotataion_img(req, res) {
    try {
      await Quotation_img.destroy({
        where: {
          quotation_id: req.body.quotation_id,
        },
      });
      return ResponseManager.SuccessResponse(
        req,
        res,
        200,
        "delete image quotataion suucess"
      );
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err);
    }
  }

  static async AddQuotation_img(req, res) {
    try {
      const today = new Date();
      const DateString = today.toISOString().split("T")[0];

      // const tokenData = await TokenManager.update_token(req);
      // if (!tokenData) {
      //   return await ResponseManager.ErrorResponse(
      //     req,
      //     res,
      //     401,
      //     "Unauthorized: Invalid token data"
      //   );
      // }

      // const { bus_id } = req.userData;

      const editproduct = await Quotation_img.findOne({
        where: {
          quotation_id: req.body.quotation_id,
        },
      });

      if (editproduct) {
        await Quotation_img.destroy({
          where: {
            quotation_id: req.body.quotation_id,
          },
        });
      }
      // return false;

      if (!req.file) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Please choose a product image file"
        );
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "File size exceeds 5 MB limit"
        );
      }

      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Only JPEG and PNG image files are allowed"
        );
      }

      const result = await cloudinary.uploader.upload(req.file.path);

      const insert_product = await Quotation_img.create({
        quotation_id: req.body.quotation_id,
        quotation_img: result.secure_url,
      });
      return ResponseManager.SuccessResponse(req, res, 200, insert_product);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, req.body);
    }
  }

  static async AddExpense_img(req, res) {
    try {
      // return ResponseManager.SuccessResponse(req, res, 200);

      console.log("File received:", req.file);
      console.log("Request body:", req.body);

      const today = new Date();
      const DateString = today.toISOString().split("T")[0];

      // const editproduct = await Expense.findOne({
      //   where: {
      //     expense_id: req.body.expense_id,
      //   },
      // });

      // if (editproduct) {
      //   await Quotation_img.destroy({
      //     where: {
      //       quotation_id: req.body.quotation_id,
      //     },
      //   });
      // }
      // return false;

      if (!req.file) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Please choose a product image file"
        );
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "File size exceeds 5 MB limit"
        );
      }
      const allowedMimeTypes = ["image/jpeg", "image/png"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Only JPEG and PNG image files are allowed"
        );
      }

      // const result = await cloudinary.uploader.upload(req.file.path);

      if (req.file) {
        let productUpdateData = {};
        const result = await cloudinary.uploader.upload(req.file.path);
        productUpdateData.expense_image = result.secure_url;

        await Expense.update(productUpdateData, {
          where: {
            expense_id: req.body.expense_id,
          },
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, insert_product);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, req.body);
    }
  }

  static async getQuotation_img(req, res) {
    try {
      const business = await Quotation_img.findAll();

      return ResponseManager.SuccessResponse(req, res, 200, business);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async Edit_getQuotation_img(req, res) {
    try {
      const editproduct = await Quotation_img.findOne({
        where: {
          quotation_id: req.params.id,
        },
      });

      if (editproduct) {
        // if (req.file && req.file.size > 5 * 1024 * 1024) {
        //   res.status(400).json({ error: "File size exceeds 5 MB limit" });
        // }

        // let productUpdateData = {};

        // if (req.file) {
        //   const result = await cloudinary.uploader.upload(req.file.path);
        //   productUpdateData.quotation_img = result.secure_url;
        // }

        // await Quotation_img.update(productUpdateData, {
        //   where: {
        //     quotation_id: req.params.id,
        //   },
        // });

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "quptation img Updated"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getCompanyPerson(req, res) {
    try {
      const log = await sequelize.query(
        `
        SELECT * 
        FROM company_people
        LEFT JOIN customers ON customers.cus_id = company_people.company_person_customer
        LEFT JOIN businesses ON businesses.bus_id = company_people.bus_id
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      // Use 'let' if you intend to modify the array
      let customer = log;

      // If you want to filter by `bus_id`, you can add filtering logic here
      if (bus_id) {
        customer = customer.filter((person) => person.bus_id === bus_id);
      }

      return ResponseManager.SuccessResponse(req, res, 200, customer);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async addCustomer2(req, res) {
    try {
      Customer.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Customer, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { bus_id } = req.userData;

      const addCustomer = await Company_person.findOne({
        where: {
          company_person_name: req.body.company_person_name,
          bus_id: bus_id,
        },
      });
      if (addCustomer) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer already exists"
        );
      }

      const insert_cate = await Company_person.create({
        company_person_name: req.body.company_person_name,
        company_person_address: req.body.company_person_address,
        company_person_tel: req.body.company_person_tel,
        company_person_email: req.body.company_person_email,
        company_person_customer: req.body.company_person_customer,
        company_person_status: "active",
        bus_id: bus_id,
        Status: "active",
      });

      return ResponseManager.SuccessResponse(req, res, 200, insert_cate);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async GetSaleReportByProductType(req, res) {
    try {
      const { bus_id } = req.userData;
      const { startDate, endDate } = req.body; // รับ bus_id, startDate, และ endDate จาก req.body

      const log = await sequelize.query(
        `
      SELECT 
    CASE 
        WHEN products."productTypeID" = 1 THEN 'สินค้า'
        WHEN products."productTypeID" = 2 THEN 'บริการ'
        ELSE 'Other'
    END AS product_type,
    SUM(quotation_sale_details."sale_price") AS total_sale_price
FROM 
    public.quotation_sale_details
LEFT JOIN 
    public.billings ON public.billings."sale_id" = public.quotation_sale_details."sale_id"
LEFT JOIN 
    public.products ON public.products."productID" = public.quotation_sale_details."productID"
LEFT JOIN 
    public.product_categories ON public.products."categoryID" = public.product_categories."categoryID"
WHERE 
    public.products."bus_id" = :bus_id
    AND public.billings."billing_date"::date BETWEEN :startDate AND :endDate
GROUP BY 
    product_type;

      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id, startDate, endDate }, // ส่ง bus_id ผ่าน replacements เพื่อป้องกัน SQL Injection
        }
      );

      // ส่งผลลัพธ์กลับไปยัง client
      return ResponseManager.SuccessResponse(req, res, 200, log);
    } catch (err) {
      // ส่งข้อผิดพลาดหากเกิดปัญหา
      console.error("Error in GetSaleReportByProductType:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async GetSaleReportByCategory(req, res) {
    try {
      const { bus_id } = req.userData;
      const { startDate, endDate } = req.body; // รับ bus_id, startDate, และ endDate จาก req.body

      const log = await sequelize.query(
        `
SELECT 
    public.product_categories."categoryName",
    SUM(public.quotation_sale_details."sale_price") AS total_sale_price
FROM 
    public.quotation_sale_details
LEFT JOIN 
    public.billings ON public.billings."sale_id" = public.quotation_sale_details."sale_id"
LEFT JOIN 
    public.products ON public.products."productID" = public.quotation_sale_details."productID"
LEFT JOIN 
    public.product_categories ON public.products."categoryID" = public.product_categories."categoryID"
WHERE 
    public.products."bus_id" = :bus_id
    AND public.billings."billing_date"::date BETWEEN :startDate AND :endDate
GROUP BY 
    public.product_categories."categoryName";

      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id, startDate, endDate }, // ส่ง bus_id ผ่าน replacements เพื่อป้องกัน SQL Injection
        }
      );

      // ส่งผลลัพธ์กลับไปยัง client
      return ResponseManager.SuccessResponse(req, res, 200, log);
    } catch (err) {
      // ส่งข้อผิดพลาดหากเกิดปัญหา
      console.error("Error in GetSaleReportByProductType:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async GetSaleReportByProdcutRank(req, res) {
    try {
      const { bus_id } = req.userData;
      const { startDate, endDate } = req.body; // รับ bus_id, startDate, และ endDate จาก req.body

      const log = await sequelize.query(
        `
WITH RankedProducts AS (
    SELECT 
        public.products."productname",
        SUM(public.quotation_sale_details."sale_price") AS total_sale_price,
        ROW_NUMBER() OVER (ORDER BY SUM(public.quotation_sale_details."sale_price") DESC) AS rank
    FROM 
        public.quotation_sale_details
    LEFT JOIN 
        public.billings ON public.billings."sale_id" = public.quotation_sale_details."sale_id"
    LEFT JOIN 
        public.products ON public.products."productID" = public.quotation_sale_details."productID"
    WHERE 
        public.products."bus_id" = :bus_id
        AND public.products."productTypeID" != 2
           AND public.billings."billing_date"::date BETWEEN :startDate AND :endDate
    GROUP BY 
        public.products."productname"
),
AggregatedProducts AS (
    SELECT 
        CASE 
            WHEN rank <= 7 THEN "productname"
            ELSE 'Others'
        END AS product,
        SUM(total_sale_price) AS total_sale_price
    FROM RankedProducts
    GROUP BY 
        CASE 
            WHEN rank <= 7 THEN "productname"
            ELSE 'Others'
        END
)
SELECT 
    product,
    total_sale_price
FROM 
    AggregatedProducts
ORDER BY 
    total_sale_price DESC;


      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id, startDate, endDate }, // ส่ง bus_id ผ่าน replacements เพื่อป้องกัน SQL Injection
        }
      );

      // ส่งผลลัพธ์กลับไปยัง client
      return ResponseManager.SuccessResponse(req, res, 200, log);
    } catch (err) {
      // ส่งข้อผิดพลาดหากเกิดปัญหา
      console.error("Error in GetSaleReportByProductType:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async GetSaleReportByService(req, res) {
    try {
      const { bus_id } = req.userData;
      const { startDate, endDate } = req.body; // รับ bus_id, startDate, และ endDate จาก req.body

      const log = await sequelize.query(
        `
SELECT 
    public.products.productname AS product_name,
    SUM(public.quotation_sale_details."sale_price") AS total_sale_price
FROM 
    public.quotation_sale_details
LEFT JOIN 
    public.billings ON public.billings."sale_id" = public.quotation_sale_details."sale_id"
LEFT JOIN 
    public.products ON public.products."productID" = public.quotation_sale_details."productID"
WHERE 
    public.products."bus_id" = :bus_id
    AND public.products."productTypeID" = 2
    AND public.billings."billing_date"::date BETWEEN :startDate AND :endDate
	GROUP BY 
    public.products."productname"
ORDER BY 
    total_sale_price DESC;


      `,
        {
          type: sequelize.QueryTypes.SELECT,
          replacements: { bus_id, startDate, endDate }, // ส่ง bus_id ผ่าน replacements เพื่อป้องกัน SQL Injection
        }
      );

      // ส่งผลลัพธ์กลับไปยัง client
      return ResponseManager.SuccessResponse(req, res, 200, log);
    } catch (err) {
      // ส่งข้อผิดพลาดหากเกิดปัญหา
      console.error("Error in GetSaleReportByProductType:", err);
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = QuotationSaleController;
