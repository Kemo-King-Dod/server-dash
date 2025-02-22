const express = require("express");
const router = express.Router();
const Order = require("../database/orders");
const Store = require("../database/store");
const Address = require("../database/address");
const User = require("../database/users");
const Item = require("../database/items");
const fs = require("fs").promises;
const path = require("path");
const { auth } = require("../middleware/auth");

let ordersNum;

async function read() {
    const data = await fs.readFile(
        path.join(__dirname, "..", "data", "order.txt")
    );
    ordersNum = parseInt(data.toString());
    await fs.writeFile(
        path.join(__dirname, "..", "data", "order.txt"),
        `${++ordersNum}`
    );
    return ordersNum;
}

// orders [add , delete , change state]
router.post("/addOrder", auth, async (req, res) => {
    try {
        const itemsdata = [];
        const userId = req.userId;
        const StoreId = req.body.storeId;
        const theAddress = await Address.findById(req.body.addressId);

        const user = await User.findById(userId);
        let totalprice = 0;

        for (var i = 0; i < user.cart.length; i++) {
            if (user.cart[i].cartItem.storeID == StoreId) {
                const item = await Item.findById(user.cart[i].cartItem.id);
                itemsdata.push({
                    name: item.name,
                    options: user.cart[i].cartItem.options,
                    addOns: user.cart[i].cartItem.addOns,
                    quantity: 1, // update later
                    price: user.cart[i].cartItem.price,
                });
                totalprice += user.cart[i].cartItem.price;
            }
        }

        if (itemsdata.length == 0) {
            res.status(500).json({
                error: true,
                message: "ليس هناك عناصر",
            });
            return;
        }

        // Create new order
        const order = new Order({
            orderId: await read(),
            customerId: userId,
            storeId: StoreId,
            driverId: null,
            date: new Date(),
            items: itemsdata,
            totalPrice: totalprice,
            status: "waiting",
            type: "waiting",
            address: theAddress,
            distenationPrice: Store.deliveryCostByKilo,
            reseveCode: Math.round(Math.random(100000) * 100000),
            chat: {},
        });

        // Save order
        await order.save();

        const theorderId = await Order.findOne({ orderId: ordersNum });

        // Update store's orders array
        await Store.findByIdAndUpdate(StoreId, {
            $push: { orders: theorderId._id },
        });

        // Update user's orders array
        await User.findByIdAndUpdate(userId, { $push: { orders: theorderId._id } });

        // delete from cart
        for (var i = 0; i < user.cart.length; i++) {
            if (user.cart[i].cartItem.storeID == StoreId) {
                user.cart.splice(i, 1);
                i--;
            }
        }
        await user.save();

        res.status(200).json({
            error: false,
            message: "Order added successfully",
            data: theorderId,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: error.message,
        });
    }
});

router.post("/acceptOrder", auth, async (req, res) => {
    try {
        const id = req.body.orderId;
        const order = await Order.findById(id);
        if (order) {
            order.status = "accepted";
            order.type = "accepted";
            await order.save();
        } else {
            res.status(500).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        res.status(200).json({
            error: false,
            data: order,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

router.post("/readyOrder", auth, async (req, res) => {
    try {
        const id = req.body.orderId;
        const order = await Order.findById(id);
        if (order) {
            order.status = "ready";
            order.type = "ready";
            await order.save();
        } else {
            res.status(500).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        res.status(200).json({
            error: false,
            data: order,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

// Delete order
router.patch("/deleteOrder", async (req, res) => {
    try {
        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                error: true,
                message: "Order not found",
            });
        }

        // Remove order from store's orders array
        await Store.findByIdAndUpdate(order.store_id, {
            $pull: { orders: req.body.orderId },
        });

        // Remove order from user's orders array
        await User.findByIdAndUpdate(order.customer_id, {
            $pull: { orders: req.body.orderId },
        });

        // Delete the order
        await Order.findByIdAndDelete(req.body.orderId);

        res.status(200).json({
            error: false,
            message: "Order deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: "Error deleting order",
            error: error.message,
        });
    }
});



// user
router.get("/getOrdersForUser", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ customerId: userId });

        for (let i = 0; i < orders.length; i++) {
            orders.reseveCode = "";
        }

        res.status(200).json({
            error: false,
            data: orders,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});



// store
router.get("/getOrdersForStore", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ storeId: userId });

        res.status(200).json({
            error: false,
            data: orders,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

router.get("/getAcceptedOrdersForStore", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ storeId: userId, status: "accepted" });

        res.status(200).json({
            error: false,
            data: orders,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

router.get("/getReadyOrdersForStore", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ storeId: userId, status: "ready" });

        res.status(200).json({
            error: false,
            data: orders,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});



// driver
router.get("/getReadyOrderForDriver", async (req, res) => {
    try {
        const order = await Order.
            aggregate([
                {
                    $match: { status: "ready" }
                },
                {
                    $sample: { size: 1 }
                }
            ])

        const store = await Store.findById(order[0].storeId)
        order[0].shopName = store.name
        order[0].shopImage = store.picture

        res.status(200).json({
            error: false,
            data: order[0],
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: err
        });
    }
});

module.exports = router;
