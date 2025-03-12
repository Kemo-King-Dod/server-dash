const admin = require("firebase-admin");
const serviceAccount = require("./fasto-82029-firebase-adminsdk-fbsvc-56efdd6fa7.json");
module.exports=admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});