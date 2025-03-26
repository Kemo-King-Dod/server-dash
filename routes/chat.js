const express = require("express");
const route = express.Router();
const Order = require("../database/orders");
const User = require("../database/users");
const Driver = require("../database/driver");

const { auth } = require("../middleware/auth");

route.post('/driverChat', auth, async (req, res) => {
    try {
        const id = req.body.id
        const order = await Order.findById(id)
        res.status(200).json({
            error: false,
            data: {
                messages: order.chat
            }
        })

        order.numberOfUnreadForDriver = 0
        for (let i = 0; i < order.chat.length; i++)
            if (!order.chat[i].didUserRead)
                order.numberOfUnreadForDriver += 1

        for (let i = 0; i < order.chat.length; i++)
            order.chat[i].didDriverRead = true

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

route.post('/userChat', auth, async (req, res) => {
    try {
        const id = req.body.id
        const order = await Order.findById(id)

        res.status(200).json({
            error: false,
            data: {
                messages: order.chat
            }
        })

        order.numberOfUnreadForUser = 0
        for (let i = 0; i < order.chat.length; i++)
            if (!order.chat[i].didUserRead)
                order.numberOfUnreadForUser += 1

        for (let i = 0; i < order.chat.length; i++)
            order.chat[i].didUserRead = true

    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

route.get('/userCheckNumberOfUnreadMessages', auth, async (req, res) => {
    try {
        const orders = await Order.find({ 'customer.id': req.userId })

        let sum = 0
        for (let i = 0; i < orders.length; i++) {
            sum += orders[i].numberOfUnreadForUser
        }
        res.status(200).json({
            error: false,
            data: sum
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})

route.get('/driverCheckNumberOfUnreadMessages', auth, async (req, res) => {
    try {
        const order = await Order.find({ 'driver.id': req.userId })
        res.status(200).json({
            error: false,
            data: order.numberOfUnreadForDriver
        })
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }

})
route.post('/driverSendMessage', auth, async (req, res) => {
    try {
        const id = req.body.id
        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: true,
                message: "الرسالة مطلوبة"
            })
        }

        // Find the order associated with this driver
        const order = await Order.findById(id)

        const user = await User.findById(order.customer.id)
        const driver = await Driver.findById(order.driver.id)

        var newMessage
        if (user.connection)
            newMessage = {
                sender: 'driver',
                content: message,
                timestamp: new Date(),
                didDriverRead: true,
                didUserRead: true
            }
        else {
            newMessage = {
                sender: 'driver',
                content: message,
                timestamp: new Date(),
                didDriverRead: true,
                didUserRead: false
            }

            sendNotification({ token: driver.fcmToken, title: 'رسالة جديدة', body: 'قام الزبون بارسال رسالة لك' })
        }

        order.chat.push(newMessage);
        await Order.findOneAndUpdate({ _id: id }, { $set: { chat: order.chat } });

        res.status(200).json({
            error: false,
            message: "Message sent successfully",
            data: newMessage
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
});

route.post('/userSendMessage', auth, async (req, res) => {
    try {
        const id = req.body.id
        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: true,
                message: "الرسالة مطلوبة"
            });
        }

        // Find the order associated with this driver
        const order = await Order.findById(id)

        const user = await User.findById(order.customer.id)
        const driver = await Driver.findById(order.driver.id)

        var newMessage
        if (driver.connection)
            newMessage = {
                sender: 'user',
                content: message,
                timestamp: new Date(),
                didDriverRead: true,
                didUserRead: true
            }
        else {
            newMessage = {
                sender: 'user',
                content: message,
                timestamp: new Date(),
                didDriverRead: false,
                didUserRead: true
            }
            sendNotification({ token: user.fcmToken, title: 'رسالة جديدة', body: 'قام السائق بارسال رسالة لك' })

        }


        order.chat.push(newMessage)
        await Order.findOneAndUpdate({ _id: id }, { $set: { chat: order.chat } });

        res.status(200).json({
            error: false,
            message: "Message sent successfully",
            data: newMessage
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})

module.exports = route
