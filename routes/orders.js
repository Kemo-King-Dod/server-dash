const express = require('express');
const router = express.Router();
const Order = require('../database/orders');
const Store = require('../database/store');
const User = require('../database/users');
const Item = require('../database/items');
const fs = require("fs").promises;
const { auth } = require('../middleware/auth')

let ordersNum

async function read() {
    const data = await fs.readFile(path.join(__dirname, "..", "data", "oredr.txt"))
    ordersNum = parseInt(data.toString())
    await fs.writeFile(path.join(__dirname, "..", "data", "oredr.txt"),`${++ordersNum}`)
    return ordersNum
}

// Add new order
router.post('/addOrder', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const StoreId = req.body.StoreId;
        const AddressId = req.body.AddressId;

        const user = await User.findById(userId);
        let totalprice = 0


        for (var i = 0; i < user.cart.length; i++) {
            if (user.cart[i].storeID.toString() == StoreId.toString()) {
                const item = await Item.findById(user.cart[i].id)
                totalprice += item.price
            }
        }





        // Create new order
        const order = new Order({
            order_id: read(),
            customer_id: req.userId,
            store_id: req.body.StoreId,
            driver_id: null,
            date: new Date(),
            items: itemsIds,
            total_price: totalprice,
            status: 'pending',
            location: AddressId,
            distenationPrice: Store.deliveryCostByKilo,
            reseve_code: Math.random(10000000000),
            chat: {}
        });

        // Save order
        await order.save();

        // Update store's orders array
        await Store.findByIdAndUpdate(
            StoreId,
            { $push: { orders: savedOrder._id } }
        );

        // Update user's orders array
        await User.findByIdAndUpdate(
            userId,
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
