const jwt = require("jsonwebtoken");
const tokenData = require("./tokenData.json");
const { User, Role } = require("../model/userModel");
const { Business } = require("../model/quotationModel");

class TokenManager {
  static getGenerateAccessToken(payload) {
    return jwt.sign(payload, tokenData["secret_key"], {});
  }

  static checkAuthentication(request) {
    try {
      let accessToken = request.headers.authorization.split(" ")[1];
      let jwtResponse = jwt.verify(
        String(accessToken),
        tokenData["secret_key"]
      );
      return jwtResponse;
    } catch (error) {
      return false;
    }
  }

  static async update_token(req) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const { userID } = jwt.decode(token);

      User.belongsTo(Role, { foreignKey: "RoleID" });
      Role.hasMany(User, { foreignKey: "RoleID" });

      User.belongsTo(Business, { foreignKey: "bus_id" });
      Business.hasMany(User, { foreignKey: "bus_id" });

      const users = await User.findAll({
        include: [
          { model: Role },
          { model: Business },
        ],
        where: { userID: userID },
      });

      if (users.length === 0) {
        return null;
      }

      const payload = {
        userID: users[0].userID,
        bus_id: users[0].bus_id,
        RoleID: users[0].RoleID,
        RoleName: users[0].role.RoleName,
        userEmail: users[0].userEmail,
      };

      return payload;
    } catch (error) {
      console.error("Error updating token:", error);
      throw error; 
    }
  }

  static getSecret() {
    return require("crypto").randomBytes(64).toString("hex");
  }
}

module.exports = TokenManager;
