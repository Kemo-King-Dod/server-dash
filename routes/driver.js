const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Driver = require("../database/driver");
const { auth } = require("../middleware/auth");
const Transaction = require("../database/transactions");
const Admin = require("../database/admin");
const { default: mongoose } = require("mongoose");
const fs = require("fs");
const path = require("path");
const deleteUploadedFile = require("../utils/deleteImage");
 
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
  console.log(
    "hello"
  )
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
      // تسجيل وقت السحب
      driver.lastWithdrawal = new Date();
      
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
          lastWithdrawal: driver.lastWithdrawal
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


// نقطة نهاية للحصول على السائقين الذين لم يقوموا بالسحب منذ أكثر من يوم واحد
router.get("/getDriversWithoutWithdrawalForDay", auth, async (req, res) => {
  try {
    // حساب التاريخ قبل يوم واحد
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // البحث عن السائقين الذين لم يقوموا بالسحب منذ أكثر من يوم واحد
    // أو الذين لم يقوموا بالسحب مطلقاً (lastWithdrawal === null)
    const drivers = await Driver.find({
      $or: [
        { lastWithdrawal: { $lt: oneDayAgo } },
        { lastWithdrawal: null }
      ],
      // التأكد من أن لديهم رصيد للسحب
      funds: { $gt: 0 }
    }).select('-password').lean(); // Using lean() for better performance
    
    // Format response to include cursor field
    res.status(200).json({
      error: false,
      message: "تم جلب السائقين بنجاح",
      count: drivers.length,
      data: drivers,
      cursor: {
        firstBatch: drivers,
        id: 0,
        ns: 'drivers'
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message || "حدث خطأ في الخادم"
    });
  }
});

router.post("/acceptDriver", auth, async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({
        error: true,
        message: "driverId is required"
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { status: "active" },
      { new: true }
    ).select("-password");

    if (!driver) {
      return res.status(404).json({
        error: true,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      error: false,
      message: "Driver accepted successfully",
      data: driver
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message || "Server error"
    });
  }
});



router.post("/updateDriverLocation", auth, async (req, res) => {
  try {
    const { location, driverId, name, phone } = req.body;

    // التحقق من صحة البيانات
    if (!driverId || !location) {
      return res.status(400).json({
        error: true,
        message: "الرجاء إرسال بيانات السائق والموقع بشكل صحيح",
      });
    }

    // قراءة البيانات الحالية من الملف
    let DriversLocations = require("../utils/driversLocations.json");

    // التحقق من وجود السائق مسبقًا
    const existingIndex = DriversLocations.drivers.findIndex(
      (d) => d.id === driverId
    );

    if (existingIndex !== -1) {
      // ✅ تحديث موقع السائق
      DriversLocations.drivers[existingIndex].location = location;
      DriversLocations.drivers[existingIndex].name = name || DriversLocations.drivers[existingIndex].name;
      DriversLocations.drivers[existingIndex].phone = phone || DriversLocations.drivers[existingIndex].phone;
      DriversLocations.drivers[existingIndex].updatedAt = new Date().toISOString();
    } else {
      // ✅ إضافة سائق جديد
      DriversLocations.drivers.push({
        id: driverId,
        name: name || "غير معروف",
        phone: phone || "غير متوفر",
        location: location,
        updatedAt: new Date().toISOString(),
      });
    }
   console.log("DriversLocations",DriversLocations)
    res.status(200).json({
      error: false,
      message: "✅ تم تحديث موقع السائق بنجاح",
    });
  } catch (err) {
    console.error("⚠️ Server Error:", err);
    res.status(500).json({
      error: true,
      message: err.message || "حدث خطأ في الخادم",
    });
  }
});

router.get("/getDriverLocation/:phone", auth, async (req, res) => {
  try {
    const { phone } = req.params;

    console.log("phone",phone)
    if (!phone) {
      return res.status(400).json({
        error: true,
        message: "الرجاء إرسال رقم الهاتف",
      });
    }

    // قراءة البيانات من الملف
    let DriversLocations = require("../utils/driversLocations.json");

    // البحث عن السائق
    const driver = DriversLocations.drivers.find((d) => d.phone == phone);

    if (!driver) {
      return res.status(404).json({
        error: true,
        message: "لم يتم العثور على موقع السائق",
      });
    }

    res.status(200).json({
      error: false,
      message: "تم جلب موقع السائق بنجاح",
      data: driver,
    });
    console.log("driver",driver)
  } catch (err) {
    console.error("⚠️ Server Error:", err);
    res.status(500).json({
      error: true,
      message: err.message || "حدث خطأ في الخادم",
    });
  }
});
router.post("/updateDriver", auth, async (req, res) => {
  try {
    if(req.user.userType != "Admin"){
      return res.status(403).json({
        error: true,
        message: "ليس لديك صلاحية لتحديث البيانات",
      });
    }
    const { driver} = req.body;
    console.log("driver",driver)

    // Only hash password if it's provided and not empty
    if (driver.password && driver.password.trim() !== "") {
      driver.password = await bcrypt.hash(driver.password, 10);
    }
    const updatedDriver = await Driver.findById(driver.id);
    if(!updatedDriver){
      return res.status(404).json({
        error: true,
        message: "السائق غير موجود",
      });
    }
    if(updatedDriver.licenseImage!==driver.licenseImage){
      await deleteUploadedFile(updatedDriver.licenseImage);
    }
    if(updatedDriver.passportImage!==driver.passportImage){
      await deleteUploadedFile(updatedDriver.passportImage);
    }
    if(updatedDriver.CarBookImage!==driver.CarBookImage){
      await deleteUploadedFile(updatedDriver.CarBookImage);
    }
    if(updatedDriver.CarImage!==driver.CarImage){
      await deleteUploadedFile(updatedDriver.CarImage);
    }


    updatedDriver.name = driver.name || updatedDriver.name;
    updatedDriver.phone = driver.phone || updatedDriver.phone;
    updatedDriver.age = driver.age || updatedDriver.age;
    updatedDriver.gender = driver.gender || updatedDriver.gender;
    updatedDriver.vehicleType = driver.vehicleType || updatedDriver.vehicleType;
    // Only update password if it was hashed (i.e., if it was provided)
    if (driver.password && driver.password.trim() !== "") {
      updatedDriver.password = driver.password;
    }
    updatedDriver.licenseNumber = driver.licenseNumber || updatedDriver.licenseNumber;
    updatedDriver.carCardNumber = driver.carCardNumber || updatedDriver.carCardNumber;
    updatedDriver.licenseImage = driver.licenseImage || updatedDriver.licenseImage;
    updatedDriver.CarBookImage = driver.CarBookImage || updatedDriver.CarBookImage;
    updatedDriver.CarImage = driver.CarImage || updatedDriver.CarImage;
    updatedDriver.passportImage = driver.passportImage || updatedDriver.passportImage;
    updatedDriver.funds = driver.funds || updatedDriver.funds;
    updatedDriver.balance = driver.balance || updatedDriver.balance;
   await updatedDriver.save();
    res.status(200).json({
      error: false,
      message: "تم تحديث البيانات بنجاح",
      data: updatedDriver,
    });
  } catch (err) {
    await deleteUploadedFile(req.body.driver.licenseImage);
    await deleteUploadedFile(req.body.driver.passportImage);
    await deleteUploadedFile(req.body.driver.CarBookImage);
    await deleteUploadedFile(req.body.driver.CarImage);
    console.log(err);
    res.status(500).json({
      error: true,
      message: err.message || "حدث خطأ في الخادم",
    });
  }
});

module.exports = router;



