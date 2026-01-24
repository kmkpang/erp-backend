const { UserActivity } = require("../model/userModel");
const logUserActivity = (userId, activityType, routeName, body_json) => {
  const timestamp = Date.now();
  const dateObject = new Date(timestamp);

  const thaiDateString =
    dateObject.toLocaleDateString("th") +
    " " +
    dateObject.toLocaleTimeString("th");

  UserActivity.create({
    userId: userId,
    activityType: activityType,
    routeName: routeName,
    method: "POST",
    url: "auth/login",
    body: body_json,
    timestamp: thaiDateString,
  });
};

module.exports = logUserActivity;
