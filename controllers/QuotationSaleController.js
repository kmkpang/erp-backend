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
          "Unauthorized: Invalid token data",
        );
      }

      const { bus_id } = req.userData;

      const customers = await Customer.findAll({
        where: { bus_id: bus_id, Status: "active" },
        raw: true,
      });

      const companyPersons = await Company_person.findAll({
        where: { bus_id: bus_id, company_person_status: "active" },
        raw: true,
      });

      const customersWithDetails = customers.map((customer) => {
        const contactPerson = companyPersons.find(
          (cp) => cp.company_person_customer === customer.cus_id,
        );
        return {
          ...customer,
          cusPurchasePhone: contactPerson
            ? contactPerson.company_person_tel
            : "",
          cusPurchaseEmail: contactPerson
            ? contactPerson.company_person_email
            : "",
          // Remark is not stored in DB, returning empty
          cusPurchaseRemark: "",
        };
      });

      return ResponseManager.SuccessResponse(
        req,
        res,
        200,
        customersWithDetails,
      );
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
          "Unauthorized: Invalid token data",
        );
      }

      const { bus_id } = req.userData;

      const addCustomer = await Customer.findOne({
        where: {
          cus_name: req.body.cus_name,
          bus_id: bus_id,
          Status: "active",
        },
      });
      if (addCustomer) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer already exists",
        );
      }

      // const addCustomerPhone = await Customer.findOne({
      //   where: {
      //     cus_tel: req.body.cus_tel,
      //     bus_id: bus_id,
      //     Status: "active",
      //   },
      // });
      // if (addCustomerPhone) {
      //   return ResponseManager.SuccessResponse(
      //     req,
      //     res,
      //     400,
      //     "Customer Contact already exists"
      //   );
      // }

      const addCustomerTax = await Customer.findOne({
        where: {
          cus_tax: req.body.cus_tax,
          bus_id: bus_id,
          Status: "active",
        },
      });
      if (addCustomerTax) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Customer tax already exists",
        );
      }
      const insert_cate = await Customer.create({
        cus_name: req.body.cus_name,
        cus_address: req.body.cus_address,
        cus_tel: req.body.cus_tel || null,
        cus_email: req.body.cus_email || null,
        cus_tax: req.body.cus_tax,
        cus_purchase: req.body.cus_purchase || null,
        bus_id: bus_id,
        Status: "active",
      });

      if (insert_cate) {
        // Create Company_person to store contact details
        await Company_person.create({
          company_person_name: req.body.cus_purchase || "-",
          company_person_tel: req.body.cus_purchase_phone || "-",
          company_person_email: req.body.cus_purchase_email || "-",
          company_person_address: req.body.cus_address || "-", // Use company address as required field
          company_person_customer: insert_cate.cus_id,
          company_person_status: "active",
          bus_id: bus_id,
          Status: "active",
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, insert_cate);
    } catch (err) {
      console.error("Error in addCustomer:", err);
      if (err.errors) {
        err.errors.forEach((e) =>
          console.error(
            "Validation error details:",
            e.message,
            e.path,
            e.value,
          ),
        );
      }
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
            "Customer already exists",
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
          },
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Updated",
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async editCustomer(req, res) {
    try {
      // const { bus_id } = req.userData; // Removed because it causes error if userData is undefined
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
            "Customer already exists",
          );
          return;
        }

        // const addCustomerPhone = await Customer.findOne({
        //   where: {
        //     cus_tel: req.body.cus_tel,
        //
        //     cus_id: { [Op.ne]: req.params.id },
        //   },
        // });
        // if (addCustomerPhone) {
        //   return ResponseManager.SuccessResponse(
        //     req,
        //     res,
        //     400,
        //     "Customer Contact already exists"
        //   );
        // }

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
            "Customer tax already exists",
          );
        }

        await Customer.update(
          {
            cus_name: req.body.cus_name,
            cus_address: req.body.cus_address,
            cus_tel: req.body.cus_tel || null,
            cus_email: req.body.cus_email || null,
            cus_tax: req.body.cus_tax,
            cus_purchase: req.body.cus_purchase || null,
          },
          {
            where: {
              cus_id: req.params.id,
            },
          },
        );

        // Update or Create Company_person
        const existingPerson = await Company_person.findOne({
          where: {
            company_person_customer: req.params.id,
          },
        });

        if (existingPerson) {
          await Company_person.update(
            {
              company_person_name: req.body.cus_purchase || "-",
              company_person_tel: req.body.cus_purchase_phone || "-",
              company_person_email: req.body.cus_purchase_email || "-",
              company_person_address: req.body.cus_address || "-",
            },
            {
              where: {
                company_person_customer: req.params.id,
              },
            },
          );
        } else {
          await Company_person.create({
            company_person_name: req.body.cus_purchase || "-",
            company_person_tel: req.body.cus_purchase_phone || "-",
            company_person_email: req.body.cus_purchase_email || "-",
            company_person_address: req.body.cus_address || "-",
            company_person_customer: req.params.id,
            company_person_status: "active",
            bus_id: editemp.bus_id, // Use existing bus_id from database
            Status: "active",
          });
        }

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Customer Updated",
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
          "Customer Deleted",
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Customer found",
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
          "Customer Deleted",
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Customer found",
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
            "Only JPEG and PNG image files are allowed",
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
              "Only JPEG and PNG image files are allowed",
            );
          }

          if (req.file.size > 5 * 1024 * 1024) {
            return ResponseManager.ErrorResponse(
              req,
              res,
              400,
              "File size exceeds 5 MB limit",
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
            "Quotation already exists",
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
            "Quotation already exists",
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
          "Unauthorized: Invalid token data",
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
          "Quotation already exists",
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
          "No Customer found",
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
            "Quotation already exists",
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
            },
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
        },
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

      Quotation_sale_detail.belongsTo(Product, { foreignKey: "productID" });

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

      let result = [];
      let quotationslist = [];

      quotationslist = await Quotation_sale.findAll({
        include: [
          {
            model: Quotation_sale_detail,
            include: [{ model: Product, attributes: ["productname"] }],
          },
          { model: Employee },
          { model: Customer },
          { model: Business, include: [Bank] },
          { model: Invoice },
        ],
        where: {
          bus_id: bus_id,
          [Op.or]: [
            { remarkInfernal: { [Op.is]: null } },
            { 
              remarkInfernal: { 
                [Op.notIn]: ["Auto-generated from direct billing", "Auto-generated from Billing Creation"]
              } 
            }
          ]
        },
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
            { where: { sale_id: log.sale_id } },
          );
        }

        result.push({
          sale_id: log.sale_id,
          quotation_num: log.sale_number,
          status: log.status,
          employeeID: log.employeeID,
          employee_name: log.employee
            ? log.employee.F_name + " " + log.employee.L_name
            : "",
          cus_id: log.cus_id,
          cus_name: log.customer ? log.customer.cus_name : "",
          cus_address: log.customer ? log.customer.cus_address : "",
          cus_tel: log.customer ? log.customer.cus_tel : "",
          cus_email: log.customer ? log.customer.cus_email : "",
          cus_tax: log.customer ? log.customer.cus_tax : "",
          cus_purchase: log.customer ? log.customer.cus_purchase : "",
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
          details: log.quotation_sale_details.map((detail) => {
            let price = 0;
            const qty = parseFloat(detail.sale_qty) || 1;
            const salePrice = parseFloat(detail.sale_price) || 0;
            const discount = parseFloat(detail.sale_discount) || 0;

            if (detail.discounttype === "percent") {
              if (qty > 0 && 100 - discount !== 0) {
                price = (salePrice * 100) / ((100 - discount) * qty);
              }
            } else {
              if (qty > 0) {
                price = (salePrice + discount) / qty;
              }
            }

            return {
              sale_id: detail.sale_id,
              productID: detail.productID,
              productname: detail.product ? detail.product.productname : "",
              sale_price: detail.sale_price,
              discounttype: detail.discounttype,
              sale_discount: detail.sale_discount,
              sale_qty: detail.sale_qty,
              product_detail: detail.product_detail,
              pro_unti: detail.pro_unti,
              price: price,
            };
          }),
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, result);
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
          "Quotation Deleted",
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Quotation found",
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
          "Unauthorized: Invalid token data",
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
          "No Quotation found",
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
          "Unauthorized: Invalid token data",
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
          "Unauthorized: Invalid token data",
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
            "File size exceeds 5 MB limit",
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
          req.body.bank_name,
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Business found",
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
        "delete image quotataion suucess",
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
          "Please choose a product image file",
        );
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "File size exceeds 5 MB limit",
        );
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
          "Please choose a product image file",
        );
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "File size exceeds 5 MB limit",
        );
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
          "quptation img Updated",
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
        },
      );

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
          "Unauthorized: Invalid token data",
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
          "Customer already exists",
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
}

module.exports = QuotationSaleController;
