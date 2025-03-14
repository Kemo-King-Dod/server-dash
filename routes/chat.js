const express = require("express");
const route = express.Router();
const Order = require("../database/orders");

const { auth } = require("../middleware/auth");

route.get('/driverChat', auth, async (req, res) => {
    try {
        const id = req.body.id
        const order = await Order.findOne({ 'driver.id': id })
        res.status(200).json({
            error: false,
            data: order.chat
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})
route.get('/storeChat', auth, async (req, res) => {
    try {
        const id = req.userId
        const order = await Order.findOne({ 'store.id': id })
        res.status(200).json({
            error: false,
            data: order.chat
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

route.post('/driverSendMassege', auth, async (req, res) => {
    try {
        const id = req.body.id
        const { message } = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: true,
                message: "الرسالة مطلوبة"
            });
        }

        // Find the order associated with this driver
        const order = await Order.findById(id);

        // Create a new message object
        const newMessage = {
            sender: 'driver',
            content: message,
            timestamp: new Date()
        };

        // Add the message to the chat array
        if (!order.chat) {
            order.chat = [];
        }
        order.chat.push(newMessage);

        // Save the updated order
        await order.save();

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
});

route.post('/storeSendMassege', auth, async (req, res) => {
    try {
        const id = req.body.id
        const { message } = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: true,
                message: "الرسالة مطلوبة"
            });
        }

        // Find the order associated with this driver
        const order = await Order.findById(id);

        // Create a new message object
        const newMessage = {
            sender: 'store',
            content: message,
            timestamp: new Date()
        };

        // Add the message to the chat array
        if (!order.chat) {
            order.chat = [];
        }
        order.chat.push(newMessage);

        // Save the updated order
        await order.save();

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
