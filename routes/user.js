const express = require('express');
const router = express.Router();
const User = require('../database/users');
const Driver = require('../database/driver')
const Store = require('../database/store')
const Addresse = require('../database/address')
const bcrypt = require('bcrypt')
const { auth } = require('../middleware/auth')

router.post('/addAddress', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.userId })

        const theaddress = await Addresse.create({
            title: req.body.title,
            description: req.body.description,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        })


        user.locations.push(theaddress)

        await user.save()
        res.status(200).json({
            error: false,
            data: 'تم حفظ الموقع بنجاح'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

router.patch('/deleteAddress', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.userId })

        for (var i = 0; i < user.locations.length; i++) {
            if (user.locations[i]._id == req.body.id) {
                await Addresse.deleteOne({ _id: user.locations[i]._id })
                user.locations.splice(i, 1)
                break
            }
        }
        await user.save()
        res.status(500).json({
            error: false,
            data: 'تم حذف الموقع بنجاح'
        })


    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

router.get('/getAddressess', auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.userId })

        res.status(200).json({
            error: false,
            data: user.locations
        })


    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.post('/alterUserName', auth, async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId)
        user.name = req.body.name
        await user.save()
        res.status(200).json({
            error: false,
            message: 'تم تحديث البيانات بنجاح'
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            error: true,
            message: err
        })
    }
})

router.post('/alterUserPassword', auth, async (req, res) => {
    try {
        console.log(1)
        const userId = req.userId
        const user = await User.findById(userId)
        console.log(user.password)
        console.log(req.body.currentPassword)
        const valied = await bcrypt.compare(req.body.currentPassword, user.password)
        if (valied) {
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(req.body.newPassword, salt)
            await user.save()
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


module.exports = router