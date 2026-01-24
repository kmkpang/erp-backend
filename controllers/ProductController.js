const ResponseManager = require("../middleware/ResponseManager");
const {
  Product,
  productType,
  productCategory,
  Transaction,
  Expense,
} = require("../model/productModel");
const { Business, Billing } = require("../model/quotationModel");
const { cloudinary } = require("../utils/cloudinary");
const { Op } = require("sequelize");
const moment = require("moment");
const TokenManager = require("../middleware/tokenManager");

class ProductController {
  static async getProduct(req, res) {
    try {
      Product.belongsTo(productCategory, { foreignKey: "categoryID" });
      productCategory.hasMany(Product, { foreignKey: "categoryID" });
      Product.belongsTo(productType, { foreignKey: "productTypeID" });
      productType.hasMany(Product, { foreignKey: "productTypeID" });

      Product.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Product, { foreignKey: "bus_id" });

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

      var products = await Product.findAll({
        include: [productCategory, productType],
        where: { bus_id: bus_id },
      });

      // ตรวจสอบและอัพเดท status หาก amount = 0
      for (const product of products) {
        if (product.amount === 0 && product.productTypeID === 1) {
          // await product.update({ Status: "Discontinued" });
        } else if (product.amount > 0 && product.productTypeID === 1) {
          // await product.update({ Status: "active" });
        }
        // else if (
        //   product.Status === "Discontinued" &&
        //   product.amount > 0 &&
        //   product.productTypeID === 1
        // ) {
        //   await product.update({ Status: "active" });
        // } else {
        //   await product.update({ Status: "active" });
        // }
      }

      return ResponseManager.SuccessResponse(req, res, 200, products);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getProductType(req, res) {
    try {
      const productTypes = await productType.findAll();
      return ResponseManager.SuccessResponse(req, res, 200, productTypes);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getProductByProductType(req, res) {
    try {
      Product.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Product, { foreignKey: "bus_id" });

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

      const ProductByProductType = await Product.findAll({
        where: {
          productTypeID: req.params.id,
          bus_id: bus_id,
        },
      });
      return ResponseManager.SuccessResponse(
        req,
        res,
        200,
        ProductByProductType
      );
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddProduct(req, res) {
    try {
      Product.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Product, { foreignKey: "bus_id" });

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

      console.log(req.body.productname);

      const addproduct = await Product.findOne({
        where: {
          productname: req.body.productname.trim(),
          bus_id: bus_id,
        },
      });

      const today = new Date();
      const DateString = today.toISOString().split("T")[0];

      if (addproduct) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Product already exists"
        );
      } else {
        // if (!req.file) {
        //   return ResponseManager.ErrorResponse(
        //     req,
        //     res,
        //     400,
        //     "Please choose a product image file"
        //   );
        // }
        let result = [];
        if (req.file) {
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

          result = await cloudinary.uploader.upload(req.file.path);
        } else {
          result = [];
        }

        const insert_product = await Product.create({
          productTypeID: req.body.productTypeID,
          productname: req.body.productname,
          productdetail: req.body.productdetail,
          amount: req.body.amount,
          price: req.body.price,
          productcost: req.body.productcost,
          categoryID: req.body.categoryID,
          productImg: result.secure_url,
          product_date: DateString,
          bus_id: bus_id,
          Status: "Discontinued",
        });

        return ResponseManager.SuccessResponse(req, res, 200, insert_product);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditProduct(req, res) {
    try {
      const editproduct = await Product.findOne({
        where: {
          productID: req.params.id,
        },
      });

      if (editproduct) {
        if (req.file && req.file.size > 5 * 1024 * 1024) {
          res.status(400).json({ error: "File size exceeds 5 MB limit" });
        }

        // const existingProduct = await Product.findOne({
        //   where: {
        //     productname: req.body.productname,
        //     productID: { [Op.ne]: req.params.id },
        //   },
        // });

        // if (existingProduct) {
        //   return ResponseManager.ErrorResponse(
        //     req,
        //     res,
        //     400,
        //     "Product already exists"
        //   );
        // }

        let productUpdateData = {
          productTypeID: req.body.productTypeID,
          productname: req.body.productname,
          productdetail: req.body.productdetail,
          amount: req.body.amount,
          price: req.body.price,
          productcost: req.body.productcost,
          categoryID: req.body.categoryID,
          Status: req.body.Status,
        };

        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path);
          productUpdateData.productImg = result.secure_url;
        }

        await Product.update(productUpdateData, {
          where: {
            productID: req.params.id,
          },
        });

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Product Updated"
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No product found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeleteProduct(req, res) {
    try {
      const deleteproduct = await Product.findOne({
        where: {
          productID: req.params.id,
        },
      });
      if (deleteproduct) {
        // await Product.destroy({
        //   where: {
        //     productID: req.params.id,
        //   },
        // });
        const updatedData = {
          Status: "not active",
        };

        await Product.update(updatedData, {
          where: {
            productID: req.params.id,
          },
        });

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Product Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No product found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddCategory(req, res) {
    try {
      productCategory.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(productCategory, { foreignKey: "bus_id" });

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

      const addcate = await productCategory.findOne({
        where: {
          categoryName: req.body.categoryName,
          bus_id: bus_id,
        },
      });
      if (addcate) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Category already exist"
        );
      } else {
        const insert_cate = await productCategory.create({
          categoryName: req.body.categoryName,
          bus_id: bus_id,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, insert_cate);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditCategory(req, res) {
    try {
      const delcate = await productCategory.findOne({
        where: {
          categoryID: req.params.id,
        },
      });
      if (delcate) {
        const existingCate = await productCategory.findOne({
          where: {
            categoryName: req.body.categoryName,
            categoryID: { [Op.ne]: req.params.id }, // ตรวจสอบสินค้าที่ไม่ใช่สินค้าปัจจุบัน
          },
        });

        if (existingCate) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Category already exists"
          );
          return;
        }

        await productCategory.update(
          {
            categoryName: req.body.categoryName,
          },
          {
            where: {
              categoryID: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Category Updated"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Category found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  // static async DeleteCategory(req, res) {
  //   try {
  //     const deletecate = await productCategory.findOne({
  //       where: {
  //         categoryID: req.params.id,
  //       },
  //     });
  //     if (deletecate) {
  //       await productCategory.destroy({
  //         where: {
  //           categoryID: req.params.id,
  //         },
  //       });
  //       return ResponseManager.SuccessResponse(
  //         req,
  //         res,
  //         200,
  //         "Category Deleted"
  //       );
  //     } else {
  //       return ResponseManager.ErrorResponse(
  //         req,
  //         res,
  //         400,
  //         "No Category found"
  //       );
  //     }
  //   } catch (err) {
  //     return ResponseManager.CatchResponse(req, res, err.message);
  //   }
  // }
  static async DeleteCategory(req, res) {
    try {
      const categoryID = parseInt(req.params.id);

      const { bus_id } = req.userData;

      const addcate = await productCategory.findOne({
        where: {
          categoryName: "ไม่มีหมวดหมู่",
          bus_id: bus_id,
          categoryID: categoryID,
        },
      });

      // ห้ามลบ categoryID = 0
      if (addcate) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          403,
          "ไม่สามารถลบหมวดหมู่เริ่มต้นได้"
        );
      }

      const deletecate = await productCategory.findOne({
        where: { categoryID: categoryID },
      });

      if (deletecate) {
        await productCategory.destroy({
          where: { categoryID: categoryID },
        });

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Category Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Category found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddTransaction(req, res) {
    try {
      const timestamp = Date.now();
      const dateObject = new Date(timestamp);

      const DateString =
        dateObject.toLocaleDateString("en-GB") +
        " " +
        dateObject.toLocaleTimeString("en-GB");

      const getProductByid = await Product.findOne({
        where: {
          productID: req.body.productID,
        },
      });

      if (getProductByid) {
        const transactionType = req.body.transactionType;

        if (transactionType == "Receive") {
          await Transaction.create({
            productID: req.body.productID,
            transactionType: transactionType,
            transactionDetail: req.body.transactionDetail,
            quantity_added: req.body.quantity,
            quantity_removed: 0,
            transaction_date: DateString,
          });

          // ใช้ reduce เพื่อรวมค่าของ Quantity

          await Product.update(
            {
              amount: req.body.quantity + getProductByid.dataValues.amount,
              Status: "active",
            },
            {
              where: {
                productID: req.body.productID,
              },
            }
          );

          return ResponseManager.SuccessResponse(req, res, 200, "success");
        } else if (transactionType == "Issue") {
          if (getProductByid.dataValues.amount < req.body.quantity) {
            return ResponseManager.ErrorResponse(
              req,
              res,
              400,
              "product amount low than quantity"
            );
          } else {
            await Transaction.create({
              productID: req.body.productID,
              transactionType: transactionType,
              transactionDetail: req.body.transactionDetail,
              quantity_removed: req.body.quantity,
              quantity_added: 0,
              transaction_date: DateString,
            });

            await Product.update(
              {
                amount: getProductByid.dataValues.amount - req.body.quantity,
              },
              {
                where: {
                  productID: req.body.productID,
                },
              }
            );

            // อัปเดตจำนวนสินค้าในตาราง Product
            const updatedAmount =
              getProductByid.dataValues.amount - req.body.quantity;

            // หากจำนวนสินค้าเหลือ 0 ให้อัปเดตสถานะเป็น Discontinued
            if (updatedAmount === 0) {
              await Product.update(
                { Status: "Discontinued" },
                {
                  where: {
                    productID: req.body.productID,
                  },
                }
              );
            }

            return ResponseManager.SuccessResponse(
              req,
              res,
              200,
              "product issue success"
            );
          }
        } else {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Please select transaction type"
          );
        }
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Product Not found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditTransaction(req, res) {
    try {
      const getProductAmount = await Product.findOne({
        where: {
          productID: req.body.productID,
        },
      });

      const getProductByid = await Transaction.findOne({
        where: {
          transaction_id: req.params.id,
        },
      });
      if (getProductByid) {
        const transactionType = req.body.transactionType;

        if (
          transactionType == "Issue" &&
          getProductByid.transactionType == "Receive"
        ) {
          const quantityDifference =
            req.body.quantity + getProductByid.quantity_added;

          // อัปเดตจำนวนสินค้าใน Product โดยเพิ่ม quantity ที่มีการเปลี่ยนแปลง
          await Product.update(
            {
              amount: getProductAmount.amount - quantityDifference,
            },
            { where: { productID: req.body.productID } }
          );

          // อัปเดตสถานะหากจำนวนสินค้าหลังอัปเดตเหลือ 0
          const updatedProduct = await Product.findOne({
            where: { productID: req.body.productID },
          });

          if (updatedProduct.amount === 0) {
            await Product.update(
              { Status: "Discontinued" },
              { where: { productID: req.body.productID } }
            );
          }

          // อัปเดต Transaction เป็น receive
          await Transaction.update(
            {
              productID: req.body.productID,
              transactionType: transactionType,
              transactionDetail: req.body.transactionDetail,
              quantity_added: 0,
              quantity_removed: req.body.quantity,
            },
            { where: { transaction_id: req.params.id } }
          );
          return ResponseManager.SuccessResponse(
            req,
            res,
            200,
            "product receive success"
          );
        } else if (
          transactionType == "Receive" &&
          getProductByid.transactionType == "Issue"
        ) {
          const quantityDifference =
            req.body.quantity + getProductByid.quantity_removed;

          // อัปเดตจำนวนสินค้าใน Product โดยเพิ่ม quantity ที่มีการเปลี่ยนแปลง
          await Product.update(
            {
              amount: getProductAmount.amount + quantityDifference,
            },
            { where: { productID: req.body.productID } }
          );

          // อัปเดตสถานะให้กลับมาใช้งานได้หากจำนวนสินค้ากลายเป็นมากกว่า 0
          const updatedProduct = await Product.findOne({
            where: { productID: req.body.productID },
          });

          if (
            updatedProduct.amount > 0 &&
            updatedProduct.Status === "Discontinued"
          ) {
            await Product.update(
              { Status: "active" },
              { where: { productID: req.body.productID } }
            );
          }

          // อัปเดต Transaction เป็น receive
          await Transaction.update(
            {
              productID: req.body.productID,
              transactionType: transactionType,
              transactionDetail: req.body.transactionDetail,
              quantity_added: req.body.quantity,
              quantity_removed: 0,
            },
            { where: { transaction_id: req.params.id } }
          );
          return ResponseManager.SuccessResponse(
            req,
            res,
            200,
            "product receive success"
          );
        } else if (transactionType == "Receive") {
          await Transaction.update(
            {
              productID: req.body.productID,
              transactionType: transactionType,
              transactionDetail: req.body.transactionDetail,
              quantity_added: req.body.quantity,
              quantity_removed: 0,
            },
            {
              where: {
                transaction_id: req.params.id,
              },
            }
          );

          // คำนวณส่วนต่าง
          const quantityDifference =
            req.body.quantity - getProductByid.quantity_added;

          await Product.update(
            {
              amount: getProductAmount.amount + quantityDifference,
            },
            {
              where: {
                productID: req.body.productID,
              },
            }
          );

          return ResponseManager.SuccessResponse(
            req,
            res,
            200,
            "product receive success"
          );
        } else if (transactionType == "Issue") {
          if (getProductAmount.dataValues.amount < req.body.quantity) {
            return ResponseManager.ErrorResponse(
              req,
              res,
              400,
              "product amount low than quantity"
            );
          } else {
            await Transaction.update(
              {
                productID: req.body.productID,
                transactionType: transactionType,
                transactionDetail: req.body.transactionDetail,
                quantity_removed: req.body.quantity,
                quantity_added: 0,
              },
              {
                where: {
                  transaction_id: req.params.id,
                },
              }
            );
            // คำนวณส่วนต่าง
            const quantityDifference =
              req.body.quantity - getProductByid.quantity_removed;

            await Product.update(
              {
                amount: getProductAmount.amount - quantityDifference,
              },
              {
                where: {
                  productID: req.body.productID,
                },
              }
            );

            return ResponseManager.SuccessResponse(
              req,
              res,
              200,
              "product issue success"
            );
          }
        } else {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Please select transaction type"
          );
        }
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Product Not found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getTransaction(req, res) {
    try {
      Transaction.belongsTo(Product, { foreignKey: "productID" });
      Product.hasMany(Transaction, { foreignKey: "productID" });

      Product.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Product, { foreignKey: "bus_id" });

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
      let transaction_list = [];

      transaction_list = await Transaction.findAll({
        include: [
          {
            model: Product,
            where: { bus_id: bus_id },
          },
        ],
      });

      transaction_list.forEach((log) => {
        const dateOnly = log.transaction_date
          ? moment(log.transaction_date, "DD/MM/YYYY HH:mm:ss").format(
              "DD/MM/YYYY"
            )
          : "Invalid Date";

        result.push({
          id: log.transaction_id,
          Date: dateOnly,
          productID: log.productID,
          Product: log.product.productname,
          Transaction: log.transactionType,
          Detail: log.transactionDetail,
          Quantity:
            log.quantity_added === 0
              ? log.quantity_removed
              : log.quantity_added,
        });
      });

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddProductType(req, res) {
    try {
      const addcate = await productType.findOne({
        where: {
          productTypeName: req.body.productTypeName,
        },
      });
      if (addcate) {
        res.json({
          status: false,
          message: "ProductType already exists",
        });
      } else {
        const insert_cate = await productType.create({
          productTypeName: req.body.productTypeName,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, insert_cate);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeleteProductType(req, res) {
    try {
      const deletecate = await productType.findOne({
        where: {
          productTypeID: req.params.id,
        },
      });
      if (deletecate) {
        await productType.destroy({
          where: {
            productTypeID: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "ProductType Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No ProductType found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  // static async getCategory(req, res) {
  //   try {
  //     productCategory.belongsTo(Business, { foreignKey: "bus_id" });
  //     Business.hasMany(productCategory, { foreignKey: "bus_id" });

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

  //     const category_list = await productCategory.findAll({
  //       where: { bus_id: bus_id },
  //     });
  //     return ResponseManager.SuccessResponse(req, res, 200, category_list);
  //   } catch (err) {
  //     return ResponseManager.CatchResponse(req, res, err.message);
  //   }
  // }
  static async getCategory(req, res) {
    try {
      productCategory.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(productCategory, { foreignKey: "bus_id" });

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

      // ตรวจสอบว่าหมวด categoryID = 0 มีหรือยัง
      const defaultCategory = await productCategory.findOne({
        where: {
          bus_id: bus_id,
          categoryName: "ไม่มีหมวดหมู่",
        },
      });

      // ถ้ายังไม่มี ให้สร้าง default category
      if (!defaultCategory) {
        await productCategory.create({
          // categoryID: 0,
          categoryName: "ไม่มีหมวดหมู่",
          bus_id: bus_id,
        });
      }

      // ดึง category ทั้งหมด (รวมตัวที่เพิ่งสร้าง)
      const category_list = await productCategory.findAll({
        where: { bus_id: bus_id },
      });

      return ResponseManager.SuccessResponse(req, res, 200, category_list);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getExpenses(req, res) {
    try {
      Expense.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Expense, { foreignKey: "bus_id" });

      const { bus_id } = req.userData;

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const expenses = await Expense.findAll({
        where: { bus_id },
        include: [{ model: Business }],
      });

      return ResponseManager.SuccessResponse(req, res, 200, expenses);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async addExpenses(req, res) {
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

      const { bus_id } = req.userData;
      const {
        expense_date,
        expense_category,
        expense_amount,
        quantity_remark,
      } = req.body;

      // const newExpense = await Expense.create({
      //   expense_date,
      //   expense_category,
      //   expense_amount,
      //   quantity_remark,
      //   bus_id,
      // });

      const newExpense = await Expense.create({
        expense_date: req.body.expense_date,
        expense_category: req.body.expense_category,
        expense_amount: req.body.expense_amount,
        quantity_remark: req.body.quantity_remark,
        bus_id: bus_id,
      });

      console.log("newExpense");

      return ResponseManager.SuccessResponse(req, res, 201, newExpense);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async editExpenses(req, res) {
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

      const editExpense = await Expense.update(
        {
          expense_date: req.body.expense_date,
          expense_category: req.body.expense_category,
          expense_amount: req.body.expense_amount,
          quantity_remark: req.body.quantity_remark,
        },
        { where: { expense_id: req.params.id } }
      );

      return ResponseManager.SuccessResponse(req, res, 200, req.params.id);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async deleteExpenses(req, res) {
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

      await Expense.destroy({
        where: {
          expense_id: req.params.id,
        },
      });

      return ResponseManager.SuccessResponse(req, res, 200, {
        message: "Expense deleted successfully",
      });
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async CutStock(req, res) {
    try {
      const { id, quantity, transactionType } = req.body;

      const product = await Product.findOne({
        where: { productID: id },
      });

      if (!product) {
        return ResponseManager.FailureResponse(
          req,
          res,
          404,
          "Product not found"
        );
      }

      let newAmount;
      let billingStatus;

      if (transactionType === "Receive") {
        newAmount = product.amount + quantity;
        billingStatus = "";
      } else {
        if (product.amount < quantity) {
          return ResponseManager.FailureResponse(
            req,
            res,
            400,
            "Insufficient stock"
          );
        }
        newAmount = product.amount - quantity;
        billingStatus = new Date().toISOString();
      }

      await Product.update(
        { amount: newAmount },
        {
          where: { productID: id },
        }
      );

      await Billing.update(
        { deleted_at: billingStatus },
        {
          where: { billing_number: req.body.billing_number },
        }
      );

      return ResponseManager.SuccessResponse(req, res, 200, "Product Updated");
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = ProductController;
