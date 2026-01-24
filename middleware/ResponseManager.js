const ac = require("../middleware/Permission");

class ResponseManager {
  static async ErrorResponse(req, res, statusCode, errorMessage) {
    res.status(400).json({
      statusCode: statusCode,
      data: errorMessage,
    });
  }
  static async SuccessResponse(req, res, statusCode, data) {
    res.status(statusCode).json({
      statusCode: statusCode,
      data: data,
    });
  }
  static async CatchResponse(req, res, errorMessage) {
    res.status(500).json({
      statusCode: 500,
      data: errorMessage,
    });
  }
  static async UnAuthorizedResponse(req, res) {
    res.status(500).json({
      statusCode: 401,
      data: "UnAuthorized",
    });
  }

  static async CheckPermisson(req, res, next) {
    var chk = false;

    if (req.session.UserRole) {
      next();
    } else {
      res.status(500).json({
        statusCode: 401,
        data: "UnAuthorized",
      });
    }
  }
}

module.exports = ResponseManager;
