const express = require("express");
const router = express.Router();
const Order = require("../database/orders");
const OrderRecodr = require("../database/orders_record")
const Store = require("../database/store");
const Driver = require("../database/driver");
const Address = require("../database/address");
const User = require("../database/users");
const Item = require("../database/items");
const fs = require("fs").promises;
const path = require("path");
const { auth } = require("../middleware/auth");
const { default: mongoose } = require("mongoose");

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

        const store = await Store.findById(StoreId);
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
            customer: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                gender: user.gender
            },
            store: {
                id: store._id,
                phone: store.phone,
                name: store.name,
                picture: store.picture,
                deliveryCostByKilo: store.deliveryCostByKilo,
                storeType: store.storeType,
                location: store.location,
                address: store.address
            },
            driver: null,
            companyFee: store.deliveryCostByKilo * 20 / 100,
            date: new Date(),
            items: itemsdata,
            totalPrice: totalprice,
            status: "waiting",
            type: "waiting",
            address: theAddress,
            distenationPrice: store.deliveryCostByKilo,
            reserveCode: Math.round(Math.random() * 100000),
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
            res.status(200).json({
                error: false,
                data: order,
            });
            return;
        }
        res.status(500).json({
            error: true,
            message: "الطلب غير موجود",
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


// user
router.get("/getOrdersForUser", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const orders = await Order.find({ "customer.id": new mongoose.Types.ObjectId(userId) });

        for (let i = 0; i < orders.length; i++) {
            orders[i].reserveCode = "";
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
        const orders = await Order.find({ "store.id": new mongoose.Types.ObjectId(userId) });

        res.status(200).json({
            error: false,
            data: orders,
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

// driver
router.get("/getReadyOrderForDriver", auth, async (req, res) => {
    try {
        const id = req.userId
        const acceptedorder = await Order.findOne({ "driver.id": id, status: "driverAccepted" })
        if (acceptedorder) {
            return res.status(200).json({
                error: false,
                data: acceptedorder,
            });
        }
        const order = await Order.aggregate([
            {
                $match: { status: { $in: ["ready", "driverAccepted", "onWay", "confirmed"] } }
            },
            {
                $sample: { size: 1 }
            }
        ]);

        if (order.length == 0) {
            return res.status(300).json({
                error: true,
                message: 'ليس هناك طلبات جاهزة حتى الآن'
            });
        }

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

router.post("/driverAcceptOrder", auth, async (req, res) => {
    try {
        const id = req.body.orderId;
        const driver = await Driver.findById(req.userId);

        if (driver.cancelOrderLimit >= 5) {
            return res.status(403).json({
                error: true,
                data: "تم حظر حسابك بسبب كثرة إلغاء الطلبات"
            });
        }

        const order = await Order.findById(id);
        if (order) {
            order.status = "driverAccepted";
            order.type = "driverAccepted";
            order.driver = {
                id: req.userId,
                name: driver.name,
                gender: driver.gender,
                phone: driver.phone,

            };
            console.log(order.driver)
            await order.save();

            res.status(200).json({
                error: false,
                data: order,
            });

        } else {
            res.status(500).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

// examine code
router.post("/examineCode", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.body.orderId);
        if (order) {
            order.status = "onWay";
            order.type = "onWay";
            await order.save();

            const store = await Store.findById(order.store.id)
            store.funds += order.totalPrice;
            await store.save();

            const driver = await Driver.findById(req.userId)
            driver.funds += order.totalPrice;
            await driver.save();

            res.status(200).json({
                error: false,
                data: 'تمت العملية بنجاح',
            });

        } else {
            res.status(500).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error adding order",
            error: err.message,
        });
    }
});

router.post("/confirmOrder", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        // Create record in OrderRecord collection
        const orderRecord = new OrderRecodr({
            orderId: order.orderId,
            customer: order.customer,
            driver: order.driver,
            store: order.store,
            date: order.date,
            items: order.items,
            totalPrice: order.totalPrice,
            status: "confirmed",
            type: "confirmed",
            address: order.address,
            distenationPrice: order.distenationPrice,
            reseveCode: order.reserveCode,
            chat: order.chat,
            canceledby: null
        });
        await orderRecord.save();

        // Delete original order
        await Order.findByIdAndDelete(req.body.orderId);

        res.status(200).json({
            error: false,
            message: "تم تأكيد الطلب بنجاح",
            data: orderRecord,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error confirming order",
            error: err.message,
        });
    }
});

router.post("/cancelOrderUser", auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        // Create record in OrderRecord collection
        const orderRecord = new OrderRecodr({
            orderId: order.orderId,
            customer: order.customer,
            driver: order.driver,
            store: order.store,
            date: order.date,
            items: order.items,
            totalPrice: order.totalPrice,
            status: "cancelled",
            type: "cancelled",
            address: order.address,
            distenationPrice: order.distenationPrice,
            reseveCode: order.reserveCode,
            chat: order.chat,
            canceledby: "user"
        });
        await orderRecord.save();

        // Delete original order
        await Order.findByIdAndDelete(req.body.orderId);

        // Increment cancel limit
        user.cancelOrderLimit = (user.cancelOrderLimit || 0) + 1;
        if (user.cancelOrderLimit >= 5) {
            user.status = "blocked";
        }
        await user.save();

        res.status(200).json({
            error: false,
            data: {
                message: "تم إلغاء الطلب بنجاح",
                remainingCancels: 5 - user.cancelOrderLimit
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error cancelling order",
            error: err.message,
        });
    }
});

router.post("/cancelOrderStore", auth, async (req, res) => {
    try {
        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        // Create record in OrderRecord collection
        const orderRecord = new OrderRecodr({
            orderId: order.orderId,
            customer: order.customer,
            driver: order.driver,
            store: order.store,
            date: order.date,
            items: order.items,
            totalPrice: order.totalPrice,
            status: "cancelled",
            type: "cancelled",
            address: order.address,
            distenationPrice: order.distenationPrice,
            reseveCode: order.reserveCode,
            chat: order.chat,
            canceledby: "store"
        });
        await orderRecord.save();

        // Delete original order
        await Order.findByIdAndDelete(req.body.orderId);

        res.status(200).json({
            error: false,
            message: "تم إلغاء الطلب بنجاح",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error cancelling order",
            error: err.message,
        });
    }
});

router.post("/cancelOrderDriver", auth, async (req, res) => {
    try {
        const driverId = req.userId;
        const driver = await Driver.findById(driverId);
        const order = await Order.findById(req.body.orderId);
        if (!order) {
            return res.status(404).json({
                error: true,
                message: "الطلب غير موجود",
            });
        }

        order.status = "cancelled"
        order.type = "cancelled"
        await order.save()

        // Increment cancel limit
        driver.cancelOrderLimit = (driver.cancelOrderLimit || 0) + 1;
        if (driver.cancelOrderLimit >= 5) {
            driver.status = "blocked";
        }
        await driver.save();

        res.status(200).json({
            error: false,
            data: {
                message: "تم إلغاء الطلب بنجاح",
                remainingCancels: 5 - driver.cancelOrderLimit
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: true,
            message: "Error cancelling order",
            error: err.message,
        });
    }
});

module.exports = router;
