const express = require('express');
const router = express.Router();
const Order = require('../database/orders');
const Store = require('../database/store');
const User = require('../database/users');
const Item = require('../database/items');
const fs = require("fs").promises;
const path = require('path')
const { auth } = require('../middleware/auth')

let ordersNum

async function read() {
    const data = await fs.readFile(path.join(__dirname, "..", "data", "order.txt"))
    ordersNum = parseInt(data.toString())
    await fs.writeFile(path.join(__dirname, "..", "data", "order.txt"), `${++ordersNum}`)
    return ordersNum
}

// Add new order
router.post('/addOrder', auth, async (req, res) => {
    try {
        const itemsdata = []
        const userId = req.userId;
        const StoreId = req.body.storeId;
        const AddressId = req.body.AddressId;

        const user = await User.findById(userId);
        let totalprice = 0


        for (var i = 0; i < user.cart.length; i++) {
            if (user.cart[i].cartItem.storeID == StoreId) {
                const item = await Item.findById(user.cart[i].cartItem.id)
                itemsdata.push({
                    id: item._id,
                    options: user.cart[i].cartItem.options,
                    addOns: user.cart[i].cartItem.addOns,
                    quantity: 1 // update later
                })
                totalprice += item.price
            }
        }

        console.log(req.body)
        console.log(StoreId)

        // Create new order
        const order = new Order({
            order_id: await read(),
            customer_id: userId,
            store_id: StoreId,
            driver_id: null,
            date: new Date(),
            items: itemsdata,
            total_price: totalprice,
            status: 'pending',
            location: AddressId,
            distenationPrice: Store.deliveryCostByKilo,
            reseve_code: Math.random(10000000000),
            chat: {}
        });

        // Save order
        await order.save();
        console.log(order)

        const theorderId = await Order.findOne({ order_id: ordersNum })

        // Update store's orders array
        await Store.findByIdAndUpdate(
            StoreId,
            { $push: { orders: theorderId._id } }
        );

        // Update user's orders array
        await User.findByIdAndUpdate(
            userId,
            { $push: { orders: theorderId._id } }
        );

        // delete from cart
        for (var i = 0; i < user.cart.length; i++) {
            if (user.cart[i].cartItem.storeID == StoreId) {
                user.cart.splice(i, 1)
                i--
            }
        }
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Order added successfully',
            order: theorderId
        });

    } catch (error) {
        console.log(error)
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


router.get('/getOrder', async (req, res) => {
    try {
        const userId = req.userId
        const orders = await Order.find({ userId })

        res.status(200).json({
            success: true,
            orders: orders
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            message: 'Error adding order',
            error: err.message
        });
    }
})

module.exports = router;
