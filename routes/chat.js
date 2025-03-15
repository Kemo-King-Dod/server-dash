const express = require("express");
const route = express.Router();
const Order = require("../database/orders");

const { auth } = require("../middleware/auth");

route.post('/driverChat', async (req, res) => {
    try {
        const id = req.body.id
        const order = await Order.findById(id)
        res.status(200).json({
            error: false,
            data: {
                messages: order.chat
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

route.post('/userChat', async (req, res) => {
    try {
        const id = req.body.id
        const order = await Order.findById(id)
        res.status(200).json({
            error: false,
            data: {
                messages: order.chat
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error
        })
    }
})

route.post('/driverSendMessage', async (req, res) => {
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

        order.chat.push(newMessage);
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

route.post('/userSendMessage', async (req, res) => {
    try {
        console.log(req.headers)
        console.log(req.body)
        const id = req.body.id
        const message = req.body.message;

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
            sender: 'user',
            content: message,
            timestamp: new Date()
        };

        
        order.chat.push(newMessage);
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
