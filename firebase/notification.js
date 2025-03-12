const admin = require("./firebase_admin");
async function sendNotification({ token, title, body }) {
    console.log("sendnotfication token " , token)
    if (!token) {
      console.warn("No FCM token provided for notification");
      return;
    }
  
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          priority: "max",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };
  
    try {
      const response = await admin.messaging().send(message);
      console.log("تم إرسال الإشعار بنجاح:", response);
      return ;
    } catch (error) {
      console.error("حدث خطأ أثناء إرسال الإشعار:", error);
      throw error;
    }
  }

  module.exports = { sendNotification };