const express = require('express');
const router = express.Router();
const Order = require('../database/orders');
const Store = require('../database/store');
const User = require('../database/users');

// Add new order
router.post('/addOrder', async (req, res) => {
    try {
        // Create new order
        const order = new Order({
            order_id: req.body.order_id,
            customer_id: req.body.customer_id,
            store_id: req.body.store_id,
            driver_id: req.body.driver_id,
            date: new Date(),
            items: req.body.items,
            total_price: req.body.total_price,
            status: 'pending',
            location: req.body.location,
            distenationPrice: req.body.distenationPrice,
            reseve_code: req.body.reseve_code,
            chat: req.body.chat
        });

        // Save order
        const savedOrder = await order.save();

        // Update store's orders array
        await Store.findByIdAndUpdate(
            req.body.store_id,
            { $push: { orders: savedOrder._id } }
        );

        // Update user's orders array
        await User.findByIdAndUpdate(
            req.body.customer_id,
            { $push: { orders: savedOrder._id } }
        );

        res.status(200).json({
            success: true,
            message: 'Order added successfully',
            order: savedOrder
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding order',
            error: error.message
        });
    }
});

// Delete order
router.patch('/deleteOrder', async (req, res) => {
    try {
        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Remove order from store's orders array
        await Store.findByIdAndUpdate(
            order.store_id,
            { $pull: { orders: req.body.orderId } }
        );

        // Remove order from user's orders array
        await User.findByIdAndUpdate(
            order.customer_id,
            { $pull: { orders: req.body.orderId } }
        );

        // Delete the order
        await Order.findByIdAndDelete(req.body.orderId);

        res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting order',
            error: error.message
        });
    }
});

module.exports = router;
