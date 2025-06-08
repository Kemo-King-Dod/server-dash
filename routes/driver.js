const express = require('express');
const router = express.Router();
const Driver = require('../database/driver')
const { auth } = require('../middleware/auth');
const Transaction = require('../database/transactions');
const Admin = require('../database/admin');

router.get('/getDriver', auth, async (req, res) => {
    try {
        const driver = await Driver.findById(req.userId, { password: false })
        res.status(200).json({
            error: false,
            data: driver
        })
    } catch (err) {
        console.log(err);
        res.status(400).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
})

router.post('/alterDriverPassword', auth, async (req, res) => {
    try {
        const userId = req.userId
        const driver = await Driver.findById(userId)
        const valied = await bcrypt.compare(req.body.currentPassword, driver.password)
        if (valied) {
            const salt = await bcrypt.genSalt(10)
            driver.password = await bcrypt.hash(req.body.newPassword, salt)
            await driver.save()
            res.status(200).json({
                error: false,
                message: 'تم تحديث كلمة المرور بنجاح'
            })
        }
        else {
            res.status(200).json({
                error: true,
                message: 'كلمة المرور الحالية غير صحيحة'
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})


router.post('/addWithdrawl', auth, async (req, res) => {
    try {
        const adminId = req.userId;
        const companyId = "67ab9be0c878f7ab0bec38f5"
        const driverId = req.body.id;
        const company= await Admin.findById(companyId)
        const driver = await Driver.findById(driverId)
        try{
         const transaction=await Transaction.create({
            sender:driverId,
            receiver:adminId,
            amount:driver.funds,
            description:"تمت عملية الدفع من السائق الى الشركة",
            type:"credit",

         })
         const transaction2=await Transaction.create({
            sender:adminId,
            receiver:driverId,
            amount:driver.funds,
            description:"تمت عملية السحب من الشركة",
            type:"credit",
         })
         company.balance += driver.funds;
         driver.funds=0;
         driver.balance=0;

         
        

        }catch(e){

        }
       
       
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})




module.exports = router