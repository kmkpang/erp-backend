const { where } = require("sequelize");
const ResponseManager = require("../middleware/ResponseManager");
const TokenManager = require("../middleware/tokenManager");
const { DataTypes, Op } = require("sequelize");
const sequelize = require("../database");
const {
  Employee,
  Position,
  Salary_pay,
  Department,
  Leaving,
  Overtime,
} = require("../model/employeeModel");
const { Business } = require("../model/quotationModel");

class EmployeeController {
  static async getEmployee(req, res) {
    try {
      Employee.belongsTo(Position, { foreignKey: "PositionID" });
      Position.hasMany(Employee, { foreignKey: "PositionID" });

      Employee.belongsTo(Department, { foreignKey: "departmentID" });
      Department.hasMany(Employee, { foreignKey: "departmentID" });

      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const { bus_id } = req.userData;
      // console.log("Testtttttttttttttttt",req.body.departmentID)
      var employees = await Employee.findAll({
        include: [{ model: Position }, { model: Department }],
        where: {
          bus_id: bus_id,
          F_name: {
            [Op.not]: "-",
          },
          L_name: {
            [Op.not]: "-",
          },
          Email: {
            [Op.not]: "-",
          },
        },
      });

      return ResponseManager.SuccessResponse(req, res, 200, employees);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddEmployee(req, res) {
    try {
      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      Employee.belongsTo(Department, { foreignKey: "departmentID" });
      Department.hasMany(Employee, { foreignKey: "departmentID" });

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

      const esistingempNID = await Employee.findOne({
        where: {
          NID_num: req.body.NID_num,
        },
      });
      const checkphoneDup = await Employee.findOne({
        where: {
          Phone_num: req.body.Phone_num,
        },
      });
      if (esistingempNID) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "National ID is already exist"
        );
      }
      if (checkphoneDup) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Phone is already exist"
        );
      }

      const esistingempEmail = await Employee.findOne({
        where: {
          Email: req.body.Email,
        },
      });

      if (esistingempEmail) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Email is already exist"
        );
      }

      // const existingempBankID = await Employee.findOne({
      //   where: {
      //     bankAccountID: req.body.bankAccountID,
      //   },
      // });

      // if (existingempBankID) {
      //   return ResponseManager.ErrorResponse(
      //     req,
      //     res,
      //     400,
      //     "Bank Account ID is already exist"
      //   );
      // }

      const insert_emp = await Employee.create({
        title: req.body.title,
        F_name: req.body.F_name,
        L_name: req.body.L_name,
        Address: req.body.Address,
        Birthdate: req.body.Birthdate,
        NID_num: req.body.NID_num,
        Phone_num: req.body.Phone_num,
        Email: req.body.Email,
        start_working_date: req.body.start_working_date,
        Salary: req.body.Salary || "0",
        employeeType: req.body.employeeType,
        bankName: req.body.bankName,
        bankAccountID: req.body.bankAccountID,
        PositionID: req.body.PositionID,
        departmentID: req.body.departmentID,
        bus_id: bus_id,
        Status: "active",
      });
      console.log(req.body);
      return ResponseManager.SuccessResponse(req, res, 200, insert_emp);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditEmployee(req, res) {
    Employee.belongsTo(Position, { foreignKey: "PositionID" });
    Position.hasMany(Employee, { foreignKey: "PositionID" });

    Employee.belongsTo(Department, { foreignKey: "departmentID" });
    Department.hasMany(Employee, { foreignKey: "departmentID" });

    Employee.belongsTo(Business, { foreignKey: "bus_id" });
    Business.hasMany(Employee, { foreignKey: "bus_id" });

    try {
      const editemp = await Employee.findOne({
        where: {
          employeeID: req.params.id,
        },
      });
      if (editemp) {
        const existingNID = await Employee.findOne({
          where: {
            NID_num: req.body.NID_num,
            employeeID: { [Op.ne]: req.params.id },
          },
        });

        if (existingNID) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "National ID already exists"
          );
          return;
        }
        const existingEmail = await Employee.findOne({
          where: {
            Email: req.body.Email,
            employeeID: { [Op.ne]: req.params.id }, // ตรวจสอบสินค้าที่ไม่ใช่สินค้าปัจจุบัน
          },
        });

        // if (existingEmail) {
        //   await ResponseManager.ErrorResponse(
        //     req,
        //     res,
        //     400,
        //     "Employee's email already exists"
        //   );
        //   return;
        // }

        // const existingempBankID = await Employee.findOne({
        //   where: {
        //     bankAccountID: req.body.bankAccountID,
        //     employeeID: { [Op.ne]: req.params.id },
        //   },
        // });

        // if (existingempBankID) {
        //   return ResponseManager.ErrorResponse(
        //     req,
        //     res,
        //     400,
        //     "Bank Account ID is already exist"
        //   );
        // }

        const updatedData = {
          title: req.body.title,
          F_name: req.body.F_name,
          L_name: req.body.L_name,
          Address: req.body.Address,
          Birthdate: req.body.Birthdate,
          NID_num: req.body.NID_num,
          Phone_num: req.body.Phone_num,
          Email: req.body.Email,
          start_working_date: req.body.start_working_date,
          Salary: req.body.Salary,
          employeeType: req.body.employeeType,
          bankName: req.body.bankName,
          bankAccountID: req.body.bankAccountID,
          PositionID: req.body.PositionID,
          departmentID: req.body.departmentID,
        };

        console.log("Updating employee with data:", updatedData);

        await Employee.update(updatedData, {
          where: {
            employeeID: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Employee Updated"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Employee found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeleteEmployee(req, res) {
    Employee.belongsTo(Department, { foreignKey: "departmentID" });
    Department.hasMany(Employee, { foreignKey: "departmentID" });

    try {
      const employee = await Employee.findOne({
        where: {
          employeeID: req.params.id,
        },
      });

      if (employee) {
        // await Employee.update(
        //   {
        //     Address: "-", // ลบที่อยู่
        //     Birthdate: "-", // ลบวันเกิด
        //     NID_num: "-", // ลบเลขบัตรประชาชน
        //     Phone_num: "-", // ลบเบอร์โทร
        //     Email: "-", // ลบอีเมล
        //     bankName: "-", // ลบชื่อธนาคาร
        //     bankAccountID: "-", // ลบเลขบัญชี
        //   },
        //   {
        //     where: {
        //       employeeID: req.params.id,
        //     },
        //   }
        // );
        const updatedData = {
          Status: "not active",
        };

        await Employee.update(updatedData, {
          where: {
            employeeID: req.params.id,
          },
        });

        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Employee data partially deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Employee found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddDepartment(req, res) {
    try {
      Department.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Department, { foreignKey: "bus_id" });

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

      const adddepart = await Department.findOne({
        where: {
          departmentName: req.body.departmentName,
          bus_id: bus_id,
        },
      });
      if (adddepart) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Department already exists"
        );
      } else {
        const insert_depart = await Department.create({
          departmentName: req.body.departmentName,
          bus_id: bus_id,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, insert_depart);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditDepartment(req, res) {
    //add product
    try {
      const editemp = await Department.findOne({
        where: {
          departmentID: req.params.id,
        },
      });
      if (editemp) {
        const existingDepart = await Department.findOne({
          where: {
            departmentName: req.body.departmentName,
            departmentID: { [Op.ne]: req.params.id },
          },
        });

        if (existingDepart) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Department already exists"
          );
          return;
        }

        await Department.update(
          {
            departmentName: req.body.departmentName,
          },
          {
            where: {
              departmentID: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Department Updated"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Department found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeleteDepartment(req, res) {
    //delete product
    Employee.belongsTo(Department, { foreignKey: "departmentID" });
    Department.hasMany(Employee, { foreignKey: "departmentID" });
    try {
      const deletecate = await Department.findOne({
        where: {
          departmentID: req.params.id,
        },
      });
      const checkEmployee = await Employee.findOne({
        where: {
          departmentID: req.params.id,
        },
      });
      if (checkEmployee) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Cant Delete bacause Employee is binding"
        );
      }
      if (deletecate) {
        await Department.destroy({
          where: {
            departmentID: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Department Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Department found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeleteLeave(req, res) {
    //delete product

    try {
      const deletecate = await Leaving.findOne({
        where: {
          leaving_id: req.params.id,
        },
      });

      if (deletecate) {
        await Leaving.destroy({
          where: {
            leaving_id: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(req, res, 200, "Leave Deleted");
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Leave found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getDepartment(req, res) {
    try {
      Department.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Department, { foreignKey: "bus_id" });

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
      const departments = await Department.findAll({
        where: {
          bus_id: bus_id,
        },
      });

      let datalist = [];

      for (const property in departments) {
        const data = {};
        data.departmentID = departments[property].departmentID;
        data.departmentName = departments[property].departmentName;

        const employee = await Employee.findAll({
          where: {
            departmentID: departments[property].departmentID.toString(),
            bus_id: bus_id,
          },
        });

        data.sumEmployee = employee.length;
        datalist.push(data);
      }
      return ResponseManager.SuccessResponse(req, res, 200, datalist);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getPayment(req, res) {
    try {
      Employee.hasMany(Salary_pay, { foreignKey: "employeeID" });
      Salary_pay.belongsTo(Employee, { foreignKey: "employeeID" });

      Employee.hasMany(Position, { foreignKey: "PositionID" });
      Position.belongsTo(Employee, { foreignKey: "PositionID" });

      Department.hasMany(Employee, { foreignKey: "departmentID" });
      Employee.belongsTo(Department, { foreignKey: "departmentID" });

      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }
      const { RoleName, userID, userEmail } = tokenData;
      const { bus_id } = req.userData;

      let result = [];
      let paymentslist = [];

      if (RoleName === "SUPERUSER" || RoleName === "MANAGER") {
        paymentslist = await Salary_pay.findAll({
          include: [{ model: Employee, include: [Position, Department] }],
          where: { bus_id: bus_id },
        });
        paymentslist.forEach((log) => {
          result.push({
            payment_id: log.payment_id,
            date: log.Date,
            round: log.round,
            month: log.month,
            year: log.year,
            employeeID: log.employee.employeeID,
            employeeName: log.employee.F_name + " " + log.employee.L_name,
            position: log.employee.position,
            salary: log.employee.Salary,
          });
        });
      } else if (RoleName === "SALE") {
        paymentslist = await Salary_pay.findAll({
          include: [
            {
              model: Employee,
              where: {
                Email: userEmail,
              },
              include: [Position, Department],
            },
          ],
          where: { bus_id: bus_id },
        });
        paymentslist.forEach((log) => {
          result.push({
            payment_id: log.payment_id,
            date: log.Date,
            round: log.round,
            month: log.month,
            year: log.year,
            employeeName: log.employee.F_name + " " + log.employee.L_name,
            salary: log.employee.Salary,
          });
        });
        // } else if (RoleName === "MANAGER") {
        //   const userData = await Employee.findOne({
        //     where: {
        //       Email: userEmail,
        //     },
        //     include: [
        //       {
        //         model: Department,
        //       },
        //     ],
        //   });

        //   if (!userData || !userData.department) {
        //     return await ResponseManager.ErrorResponse(
        //       req,
        //       res,
        //       404,
        //       "Manager department data not found"
        //     );
        //   }

        //   const userdepart = userData.department.departmentID;

        //   paymentslist = await Salary_pay.findAll({
        //     include: [
        //       {
        //         model: Employee,
        //         where: {
        //           departmentID: userdepart,
        //           Email: {
        //             [Op.ne]: userEmail,
        //           },
        //         },
        //         include: [
        //           {
        //             model: Position,
        //           },
        //           {
        //             model: Department,
        //             where: {
        //               departmentID: userdepart,
        //             },
        //           },
        //         ],
        //       },
        //     ],
        //     where: { bus_id: bus_id },
        //   });

        //   paymentslist.forEach((log) => {
        //     result.push({
        //       payment_id: log.payment_id,
        //       date: log.Date,
        //       round: log.round,
        //       month: log.month,
        //       year: log.year,
        //       employeeName: log.employee.F_name + " " + log.employee.L_name,
        //       salary: log.employee.Salary,
        //     });
        //   });
      }

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getEmployeeSalary(req, res) {
    try {
      Employee.belongsTo(Position, { foreignKey: "PositionID" });
      Position.hasMany(Employee, { foreignKey: "PositionID" });

      Employee.belongsTo(Department, { foreignKey: "departmentID" });
      Department.hasMany(Employee, { foreignKey: "departmentID" });

      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }
      const { RoleName, userID, userEmail } = tokenData;
      const { bus_id } = req.userData;

      let result = [];
      let employeeslist = [];

      if (RoleName === "SUPERUSER") {
        employeeslist = await Employee.findAll({
          where: {
            bus_id: bus_id,
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });
        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department.departmentName,
            position: log.position.Position,
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      } else if (RoleName === "SALE") {
        employeeslist = await Employee.findAll({
          where: {
            Email: userEmail,
            bus_id: bus_id,
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });
        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department.departmentName,
            position: log.position.Position,
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      } else if (RoleName === "MANAGER") {
        const userData = await Employee.findOne({
          where: {
            Email: userEmail,
          },
          include: [
            {
              model: Department,
            },
          ],
        });

        if (!userData || !userData.department) {
          return await ResponseManager.ErrorResponse(
            req,
            res,
            404,
            "Manager department data not found"
          );
        }

        const userdepart = userData.department.departmentID;

        employeeslist = await Employee.findAll({
          where: {
            departmentID: userdepart,
            bus_id: bus_id,
            Email: {
              [Op.ne]: userEmail,
            },
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });
        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department.departmentName,
            position: log.position.Position,
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async EditSalary(req, res) {
    try {
      const editemp = await Salary_pay.findOne({
        where: {
          payment_id: req.params.id,
        },
      });
      if (editemp) {
        const existingPosition = await Salary_pay.findOne({
          where: {
            round: req.body.round,
            month: req.body.month,
            payment_id: { [Op.ne]: req.params.id },
          },
        });

        if (existingPosition) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Salary already exists"
          );
          return;
        }

        await Salary_pay.update(
          {
            Date: req.body.Date,
            round: req.body.round,
            month: req.body.month,
            year: req.body.year,
          },
          {
            where: {
              payment_id: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(req, res, 200, "Salary Updated");
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Salary found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async DeleteSalary(req, res) {
    try {
      const deletecate = await Salary_pay.findOne({
        where: {
          payment_id: req.params.id,
        },
      });
      if (deletecate) {
        await Salary_pay.destroy({
          where: {
            payment_id: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(req, res, 200, "Salary Deleted");
      } else {
        return ResponseManager.ErrorResponse(req, res, 400, "No Salary found");
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getEmployeeQuotation(req, res) {
    try {
      Employee.belongsTo(Position, { foreignKey: "PositionID" });
      Position.hasMany(Employee, { foreignKey: "PositionID" });

      Employee.belongsTo(Department, { foreignKey: "departmentID" });
      Department.hasMany(Employee, { foreignKey: "departmentID" });

      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }
      const { RoleName, userID, userEmail } = tokenData;
      const { bus_id } = req.userData;
      let result = [];
      let employeeslist = [];

      if (RoleName === "SUPERUSER") {
        employeeslist = await Employee.findAll({
          where: {
            bus_id: bus_id,
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });

        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department ? log.department.departmentName : "",
            position: log.position ? log.position.Position : "",
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      } else if (RoleName === "SALE") {
        employeeslist = await Employee.findAll({
          where: {
            Email: userEmail,
            bus_id: bus_id,
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });
        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department ? log.department.departmentName : "",
            position: log.position ? log.position.Position : "",
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      } else if (RoleName === "MANAGER") {
        const userData = await Employee.findOne({
          where: {
            Email: userEmail,
          },
          include: [
            {
              model: Department,
            },
          ],
        });

        if (!userData || !userData.department) {
          return await ResponseManager.ErrorResponse(
            req,
            res,
            404,
            "Manager department data not found"
          );
        }

        const userdepart = userData.department.departmentID;

        employeeslist = await Employee.findAll({
          where: {
            departmentID: userdepart,
            bus_id: bus_id,
            Email: {
              [Op.ne]: userEmail,
            },
            F_name: {
              [Op.ne]: "-",
            },
            L_name: {
              [Op.ne]: "-",
            },
          },
          include: [{ model: Position }, { model: Department }],
        });

        employeeslist.forEach((log) => {
          result.push({
            employeeID: log.employeeID,
            name: log.F_name + " " + log.L_name,
            employeeType: log.employeeType,
            phone: log.Phone_num,
            email: log.Email,
            department: log.department ? log.department.departmentName : "",
            position: log.position ? log.position.Position : "",
            bankName: log.bankName,
            bankAccountID: log.bankAccountID,
            salary: log.Salary,
          });
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, result);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async AddPosition(req, res) {
    try {
      Position.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Position, { foreignKey: "bus_id" });

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

      const adddepart = await Position.findOne({
        where: {
          Position: req.body.Position,
          bus_id: bus_id,
        },
      });
      if (adddepart) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Position already exists"
        );
      } else {
        const insert_depart = await Position.create({
          Position: req.body.Position,
          bus_id: bus_id,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, insert_depart);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async EditPosition(req, res) {
    try {
      const editemp = await Position.findOne({
        where: {
          PositionID: req.params.id,
        },
      });
      if (editemp) {
        const existingPosition = await Position.findOne({
          where: {
            Position: req.body.Position,
            PositionID: { [Op.ne]: req.params.id },
          },
        });

        if (existingPosition) {
          await ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Position already exists"
          );
          return;
        }

        await Position.update(
          {
            Position: req.body.Position,
          },
          {
            where: {
              PositionID: req.params.id,
            },
          }
        );
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Position Updated"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Position found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async DeletePosition(req, res) {
    try {
      const deletecate = await Position.findOne({
        where: {
          PositionID: req.params.id,
        },
      });
      if (deletecate) {
        await Position.destroy({
          where: {
            PositionID: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Position Deleted"
        );
      } else {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "No Position found"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async getPosition(req, res) {
    try {
      const { bus_id } = req.userData;

      const Positions = await Position.findAll({
        where: {
          bus_id: bus_id, // กรองข้อมูลที่ bus_id ตรงกับที่ผู้ใช้มี
        },
      });

      return ResponseManager.SuccessResponse(req, res, 200, Positions);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }

  static async AddPayment(req, res) {
    try {
      Salary_pay.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Salary_pay, { foreignKey: "bus_id" });

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

      let datalist = [];
      var data_arry = {};

      if (
        req.body.payments[0].month === "" ||
        req.body.payments[0].round === "" ||
        req.body.payments[0].year === ""
      ) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "กรุณาใส่ เดือน ปี และ รอบเงินเดือน"
        );
      }

      const paymentPromises = req.body.payments.map(async (payment) => {
        const existingPayment = await Salary_pay.findOne({
          where: {
            month: payment.month,
            round: payment.round,
            year: payment.year,
            employeeID: payment.employeeID,
            bus_id: bus_id,
          },
        });

        if (existingPayment) {
          throw new Error("Duplicate payment found");
        }

        // Create a new payment record
        await Salary_pay.create({
          employeeID: payment.employeeID,
          Date: payment.Date,
          round: payment.round,
          month: payment.month,
          year: payment.year,
          bus_id: bus_id,
        });
      });

      try {
        // Wait for all payment processing to complete
        await Promise.all(paymentPromises);
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          req.body.payments
        );
      } catch (error) {
        // Handle the error (duplicate payment)
        return ResponseManager.ErrorResponse(req, res, 400, error.message);
      }

      // for (let i = 0; i < req.body.payments.length; i++) {
      //   if (
      //     req.body.payments[i].month === "" ||
      //     req.body.payments[i].round === "" ||
      //     req.body.payments[i].year === ""
      //   ) {
      //     return ResponseManager.SuccessResponse(
      //       req,
      //       res,
      //       400,
      //       "กรุณาใส่ เดือน ปี และ รอบเงินเดือน"
      //     );
      //   data_arry.month = req.body.payments[i].month;
      //   data_arry.round = req.body.payments[i].round;
      //   data_arry.year = req.body.payments[i].year;
      //   data_arry.employeeID = req.body.payments[i].employeeID;
      //   data_arry.bus_id = bus_id;
      //   datalist.push(data_arry);

      // const data = await Salary_pay.findOne({
      //   where: {
      //     month: req.body.payments[i].month,
      //     round: parseInt(req.body.payments[i].round),
      //     year: req.body.payments[i].year,
      //     employeeID: parseInt(req.body.payments[i].employeeID),
      //     bus_id: bus_id,
      //   },
      // });
      // if (data) {
      //   return ResponseManager.SuccessResponse(
      //     req,
      //     res,
      //     400,
      //     "Employee Payment already exists"
      //   );
      // } else {
      // await Salary_pay.create({
      //   employeeID: req.body.payments[i].employeeID,
      //   Date: req.body.payments[i].Date,
      //   round: req.body.payments[i].round,
      //   month: req.body.payments[i].month,
      //   year: req.body.payments[i].year,
      //   bus_id: bus_id,
      // });
      // datalist.push(req.body.payments);
      // }
      // return ResponseManager.SuccessResponse(req, res, 200, datalist);
      // }
      // return ResponseManager.SuccessResponse(req, res, 200, datalist);

      // const data = await Salary_pay.findOne({
      //   where: {
      //     month: req.body.month,
      //     round: req.body.round,
      //     year: req.body.year,
      //     employeeID: req.body.employeeID,
      //     bus_id: bus_id,
      //   },
      // });
      // if (data) {
      //   return ResponseManager.SuccessResponse(
      //     req,
      //     res,
      //     400,
      //     "Employee Payment already exists"
      //   );
      // } else {
      //   const data_payment = await Salary_pay.create({
      //     employeeID: req.body.employeeID,
      //     Date: req.body.Date,
      //     round: req.body.round,
      //     month: req.body.month,
      //     year: req.body.year,
      //     bus_id: bus_id,
      //   });
      //   console.log(req.body);
      //   return ResponseManager.SuccessResponse(req, res, 200, data_payment);
      // }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async AddPayment2(req, res) {
    try {
      Salary_pay.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Salary_pay, { foreignKey: "bus_id" });

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

      if (!req.body.payments || !Array.isArray(req.body.payments)) {
        return ResponseManager.ErrorResponse(
          req,
          res,
          400,
          "Invalid request format. Missing payments array."
        );

        // return res
        //   .status(400)
        //   .json({ error: "Invalid request format. Missing payments array." });
      }

      const paymentCreationPromises = [];

      for (const paymentData of req.body.payments) {
        const existingPayment = await Salary_pay.findOne({
          where: {
            month: paymentData.month,
            round: paymentData.round,
            year: paymentData.year,
            employeeID: paymentData.employeeID,
            bus_id: bus_id,
          },
        });

        if (existingPayment) {
          return ResponseManager.ErrorResponse(
            req,
            res,
            400,
            "Duplicate payment entry."
          );
        } else {
          paymentCreationPromises.push(
            Salary_pay.create({
              employeeID: paymentData.employeeID,
              Date: paymentData.Date,
              round: paymentData.round,
              month: paymentData.month,
              year: paymentData.year,
              bus_id: bus_id,
            })
          );
        }
      }
      return ResponseManager.SuccessResponse(req, res, 200, "success payment ");

      // const createdPayments = await Promise.all(paymentCreationPromises);
      // return ResponseManager.SuccessResponse(req, res, 200, createdPayments);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async AddLeave(req, res) {
    try {
      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const data = await Leaving.findOne({
        where: {
          employeeID: req.body.employeeID,
          date: req.body.date,
        },
      });
      if (data) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Leaving date already exists"
        );
      } else {
        const data_leaving = await Leaving.create({
          employeeID: req.body.employeeID,
          date: req.body.date,
          dateEnd: req.body.dateEnd,
          detail: req.body.detail,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, data_leaving);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async EditLeave(req, res) {
    try {
      const data = await Leaving.findOne({
        where: {
          leaving_id: req.params.id,
        },
      });

      if (!data) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Not found leaving_id"
        );
      } else {
        const body = {
          date: req.body.date,
          dateEnd: req.body.dateEnd,
          detail: req.body.detail,
          employeeID: req.body.employeeID,
        };
        await Leaving.update(body, {
          where: {
            leaving_id: req.params.id,
          },
        });
        return ResponseManager.SuccessResponse(
          req,
          res,
          200,
          "Edit Leave Success"
        );
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getLeave(req, res) {
    try {
      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      Leaving.belongsTo(Employee, { foreignKey: "employeeID" });
      Employee.hasMany(Leaving, { foreignKey: "employeeID" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }
      const { RoleName, userID, userEmail } = tokenData;
      const { bus_id } = req.userData;
      let data_leave;

      if (RoleName === "SUPERUSER") {
        data_leave = await Leaving.findAll({
          include: [
            {
              model: Employee,
              where: { bus_id: bus_id },
            },
          ],
        });
      } else if (RoleName === "SALE") {
        data_leave = await Leaving.findAll({
          include: [
            {
              model: Employee,
              where: {
                bus_id: bus_id,
                Email: userEmail,
              },
            },
          ],
        });
      } else if (RoleName === "MANAGER") {
        const userData = await Employee.findOne({
          where: {
            Email: userEmail,
            bus_id: bus_id,
          },
          include: [
            {
              model: Department,
            },
          ],
        });

        if (!userData || !userData.department) {
          return await ResponseManager.ErrorResponse(
            req,
            res,
            404,
            "Manager department data not found"
          );
        }

        const userdepart = userData.department.departmentID;

        data_leave = await Leaving.findAll({
          include: [
            {
              model: Employee,
              where: {
                departmentID: userdepart,
                bus_id: bus_id,
                Email: {
                  [Op.ne]: userEmail,
                },
              },
            },
          ],
        });
      }

      return ResponseManager.SuccessResponse(req, res, 200, data_leave);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async AddOvertime(req, res) {
    try {
      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const data = await Overtime.findOne({
        where: {
          employeeID: req.body.employeeID,
          date: req.body.date,
        },
      });
      if (data) {
        return ResponseManager.SuccessResponse(
          req,
          res,
          400,
          "Overtime date already exists"
        );
      } else {
        const data_overtime = await Overtime.create({
          employeeID: req.body.employeeID,
          date: req.body.date,
          detail: req.body.detail,
          hours: req.body.hours,
          rate: req.body.rate,
          total: req.body.total,
        });
        console.log(req.body);
        return ResponseManager.SuccessResponse(req, res, 200, data_overtime);
      }
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
  static async getOvertime(req, res) {
    try {
      Employee.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(Employee, { foreignKey: "bus_id" });

      Overtime.belongsTo(Employee, { foreignKey: "employeeID" });
      Employee.hasMany(Overtime, { foreignKey: "employeeID" });

      const tokenData = await TokenManager.update_token(req);
      if (!tokenData) {
        return await ResponseManager.ErrorResponse(
          req,
          res,
          401,
          "Unauthorized: Invalid token data"
        );
      }

      const { RoleName, userID, userEmail } = tokenData;
      const { bus_id } = req.userData;
      let data_overtime;

      if (RoleName === "SUPERUSER" || RoleName === "MANAGER") {
        data_overtime = await Overtime.findAll({
          include: [
            {
              model: Employee,
              where: { bus_id: bus_id },
            },
          ],
        });
      } else if (RoleName === "SALE") {
        data_overtime = await Overtime.findAll({
          include: [
            {
              model: Employee,
              where: {
                bus_id: bus_id,
                Email: userEmail,
              },
            },
          ],
        });
        // } else if (RoleName === "MANAGER") {
        //   const userData = await Employee.findOne({
        //     where: {
        //       Email: userEmail,
        //       bus_id: bus_id,
        //     },
        //     include: [
        //       {
        //         model: Department,
        //       },
        //     ],
        //   });

        //   if (!userData || !userData.department) {
        //     return await ResponseManager.ErrorResponse(
        //       req,
        //       res,
        //       404,
        //       "Manager department data not found"
        //     );
        //   }

        //   const userdepart = userData.department.departmentID;

        //   data_overtime = await Overtime.findAll({
        //     include: [
        //       {
        //         model: Employee,
        //         where: {
        //           departmentID: userdepart,
        //           bus_id: bus_id,
        //           Email: {
        //             [Op.ne]: userEmail,
        //           },
        //         },
        //       },
        //     ],
        //   });
      }

      return ResponseManager.SuccessResponse(req, res, 200, data_overtime);
    } catch (err) {
      return ResponseManager.CatchResponse(req, res, err.message);
    }
  }
}

module.exports = EmployeeController;
