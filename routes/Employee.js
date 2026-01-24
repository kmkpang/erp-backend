const express = require("express");
const Route = express.Router();
const RouteName = "/employee";
const {
  verifyTokenWithRole,
  logUserActivity,
  verifyTokenWithbus_id,
} = require("../middleware/verifytokenwithrole");

const EmployeeController = require("../controllers/EmployeeController");

Route.get(
  RouteName + "/getEmployee",
  verifyTokenWithbus_id,
  EmployeeController.getEmployee
);
Route.post(
  RouteName + "/AddEmployee",
  verifyTokenWithbus_id,
  EmployeeController.AddEmployee
);
Route.put(RouteName + "/EditEmployee/:id", EmployeeController.EditEmployee);
Route.delete(
  RouteName + "/DeleteEmployee/:id",
  EmployeeController.DeleteEmployee
);
Route.post(
  RouteName + "/AddDepartment",
  verifyTokenWithbus_id,
  EmployeeController.AddDepartment
);
Route.put(RouteName + "/EditDepartment/:id", EmployeeController.EditDepartment);
Route.delete(
  RouteName + "/DeleteDepartment/:id",
  EmployeeController.DeleteDepartment
);
Route.get(
  RouteName + "/getDepartment",
  verifyTokenWithbus_id,
  EmployeeController.getDepartment
);
Route.get(
  RouteName + "/getPayment",
  verifyTokenWithbus_id,
  verifyTokenWithRole(["SUPERUSER", "MANAGER", "SALE"]),
  EmployeeController.getPayment
);
Route.get(
  RouteName + "/getEmployeeSalary",
  verifyTokenWithbus_id,
  verifyTokenWithRole(["SUPERUSER", "MANAGER", "SALE"]),
  EmployeeController.getEmployeeSalary
);
Route.put(RouteName + "/EditSalary/:id", EmployeeController.EditSalary);

Route.delete(RouteName + "/DeleteSalary/:id", EmployeeController.DeleteSalary);
Route.get(
  RouteName + "/getEmployeeQuotation",
  verifyTokenWithbus_id,
  verifyTokenWithRole(["SUPERUSER", "MANAGER", "SALE"]),
  EmployeeController.getEmployeeQuotation
);
Route.post(
  RouteName + "/AddPosition",
  verifyTokenWithbus_id,
  EmployeeController.AddPosition
);
Route.put(RouteName + "/EditPosition/:id", EmployeeController.EditPosition);
Route.delete(
  RouteName + "/DeletePosition/:id",
  EmployeeController.DeletePosition
);
Route.get(
  RouteName + "/getPosition",
  verifyTokenWithbus_id,
  EmployeeController.getPosition
);
Route.post(
  RouteName + "/AddPayment",
  verifyTokenWithbus_id,
  EmployeeController.AddPayment
);
Route.post(
  RouteName + "/AddPayment2",
  verifyTokenWithbus_id,
  EmployeeController.AddPayment2
);

Route.post(
  RouteName + "/AddLeave",
  verifyTokenWithbus_id,
  EmployeeController.AddLeave
);
Route.post(
  RouteName + "/EditLeave/:id",
  verifyTokenWithbus_id,
  EmployeeController.EditLeave
);
Route.delete(RouteName + "/DeleteLeave/:id", EmployeeController.DeleteLeave);
Route.get(
  RouteName + "/getLeave",
  verifyTokenWithbus_id,
  verifyTokenWithRole(["SUPERUSER", "MANAGER", "SALE"]),
  EmployeeController.getLeave
);

Route.post(
  RouteName + "/AddOvertime",
  verifyTokenWithbus_id,
  EmployeeController.AddOvertime
);
Route.get(
  RouteName + "/getOvertime",
  verifyTokenWithbus_id,
  verifyTokenWithRole(["SUPERUSER", "MANAGER", "SALE"]),
  EmployeeController.getOvertime
);

module.exports = Route;
