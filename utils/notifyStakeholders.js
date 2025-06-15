// services/notificationService.js
const Driver = require("../database/driver");
const Notification = require("../database/notification");
const User       = require("../database/users");
const { sendNotification } = require("../firebase/notification");


/**
 * إرسال الإشعارات للمستخدم والسائق (إن وُجد) وتخزين إشعار في قاعدة البيانات.
 *
 * @param {Object} params
 * @param {Object} params.order              مستند الطلب (Order)
 * @param {String} [params.reason=""]        سبب الإلغاء (اختياري)
 * @param {String[]} [params.unavailableProducts=[]] أسماء المنتجات غير المتوفّرة
 * @returns {Promise<void>}
 */
async function notifyStakeholders({
  order,
  reason = "",
  unavailableProducts = [],
}) {
  // 1) جلب العميل والسائق
  const user   = await User.findById(order.customer);
  const driver = order.driver ? await Driver.findById(order.driver) : null;

  // 2) تجهيز نص الإشعار للعميل
  const titleUser = `تم إلغاء طلبك رقم ${order.orderId}`;
  let   bodyUser  = "تم إلغاء طلبك";

  if (reason) bodyUser += ` بسبب ${reason}`;
  if (unavailableProducts.length) {
    bodyUser +=
      " ولم يتم توفير بعض المنتجات مثل " + unavailableProducts.join(", ");
  }

  // 3) إرسال إشعار للعميل
  await sendNotification({
    token: user.fcmToken,
    title: titleUser,
    body: bodyUser,
  });

  // 4) إنشاء سجل إشعار في قاعدة البيانات
  await Notification.create({
    id: user._id,
    userType: "user",
    title: titleUser,
    body: bodyUser,
    type: "success",
    date: new Date(),
  });

  // 5) إن وُجد سائق، أرسل له إشعارًا مختصرًا
  if (driver) {
    await sendNotification({
      token: driver.fcmToken,
      title: "تم إلغاء طلب",
      body: `تم إلغاء الطلب رقم ${order.orderId}`,
    });
  }
}

module.exports = { notifyStakeholders };
