const express = require("express");
const router = express.Router();
const Driver = require("../database/driver");
const { auth } = require("../middleware/auth");
const Transaction = require("../database/transactions");
const Admin = require("../database/admin");

router.get("/getDriver", auth, async (req, res) => {
  try {
    const driver = await Driver.findById(req.userId, { password: false });
    res.status(200).json({
      error: false,
      data: driver,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      error: true,
      message: "Error adding order",
      error: err.message,
    });
  }
});

router.post("/alterDriverPassword", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const driver = await Driver.findById(userId);
    const valied = await bcrypt.compare(
      req.body.currentPassword,
      driver.password
    );
    if (valied) {
      const salt = await bcrypt.genSalt(10);
      driver.password = await bcrypt.hash(req.body.newPassword, salt);
      await driver.save();
      res.status(200).json({
        error: false,
        message: "تم تحديث كلمة المرور بنجاح",
      });
    } else {
      res.status(200).json({
        error: true,
        message: "كلمة المرور الحالية غير صحيحة",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err,
    });
  }
});

router.post("/addWithdrawl", auth, async (req, res) => {
  // بدء جلسة mongoose للتعاملات
  const session = await mongoose.startSession();
  try {
    // بدء المعاملة
    session.startTransaction();
    
    const adminId = req.userId;
    const companyId = "67ab9be0c878f7ab0bec38f5";
    const driverId = req.body.id;
    
    // استخدام session في عمليات البحث
    const company = await Admin.findById(companyId).session(session);
    const driver = await Driver.findById(driverId).session(session);
    
    // التحقق من وجود البيانات المطلوبة
    if (!company || !driver) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(404).json({
        error: true,
        message: "لم يتم العثور على الشركة أو السائق",
      });
    }
    
    // التحقق من وجود رصيد كافي
    if (driver.funds <= 0) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({
        error: true,
        message: "لا يوجد رصيد كافي للسحب",
      });
    }
    
    try {
      // إنشاء المعاملات مع استخدام session
      const transaction = await Transaction.create(
        [{
          sender: driverId,
          receiver: adminId,
          amount: driver.funds,
          description: "تمت عملية الدفع من السائق الى الشركة",
          type: "credit",
        }],
        { session: session }
      );
      
      const transaction2 = await Transaction.create(
        [{
          sender: adminId,
          receiver: driverId,
          amount: driver.funds,
          description: "تمت عملية السحب من الشركة",
          type: "credit",
        }],
        { session: session }
      );
      
      // تحديث البيانات
      company.balance += driver.funds;
      driver.funds = 0;
      driver.balance = 0;
      
      // حفظ التغييرات مع استخدام session
      await company.save({ session });
      await driver.save({ session });
      
      // تأكيد المعاملة
      await session.commitTransaction();
      
      // إرسال الرد
      res.status(200).json({
        error: false,
        message: "تمت العملية بنجاح",
        data: {
          balance: driver.balance,
          funds: driver.funds,
        },
        data2: transaction2[0],
        data3: transaction[0],
      });
    } catch (e) {
      // إلغاء المعاملة في حالة حدوث خطأ
      await session.abortTransaction();
      console.log(e);
      res.status(500).json({
        error: true,
        message: e.message || "حدث خطأ أثناء معالجة المعاملة",
      });
    } finally {
      // إنهاء الجلسة في جميع الحالات
      await session.endSession();
    }
  } catch (err) {
    // التأكد من إنهاء الجلسة في حالة حدوث خطأ خارجي
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message || "حدث خطأ في الخادم",
    });
  }
});

module.exports = router;
