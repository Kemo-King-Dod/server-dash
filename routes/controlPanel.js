const express = require('express');
const router = express.Router();
const Store = require('../database/store');
const orderRecord = require('../database/orders_record');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

router.get('/controlPanel', auth, async (req, res) => {
    try {
        const userId = req.userId;

        const store = await Store.findById(userId);

        const orders = await orderRecord.find({ "store.id": new mongoose.Types.ObjectId(userId) })

        // Calculate total profit
        const totalProfet = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Calculate total orders number
        const totalOrdersNumber = orders.length;

        // Calculate completed orders number
        const confirmedOrders = orders.filter(order => order.status === "confirmed");
        const confirmedOrdersNumber = confirmedOrders.length;

        // Calculate canceled orders number
        const canceledOrdersNumber = orders.filter(order => order.status === "canceled").length;

        // Calculate average profit per sale
        const averageSailProfet = confirmedOrdersNumber > 0
            ? confirmedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0) / confirmedOrdersNumber
            : 0;

        // Calculate average daily sales profit
        const ordersByDate = {};
        confirmedOrders.forEach(order => {
            if (order.date) {
                const date = new Date(order.date).toDateString();
                if (!ordersByDate[date]) {
                    ordersByDate[date] = { total: 0, count: 0 };
                }
                ordersByDate[date].total += order.totalPrice || 0;
                ordersByDate[date].count += 1;
            }
        });

        const totalDays = Object.keys(ordersByDate).length;
        const averageDaylySailProfet = totalDays > 0
            ? Object.values(ordersByDate).reduce((sum, day) => sum + day.total, 0) / totalDays
            : 0;

        // Calculate sales number for each month
        const everymonthSailsNumber = [];
        confirmedOrders.forEach(order => {
            if (order.date) {
                const date = new Date(order.date);
                const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
                if (!everymonthSailsNumber[monthYear]) {
                    everymonthSailsNumber[monthYear] = 0;
                }
                everymonthSailsNumber[monthYear]++;
            }
        });

        // Get opening and closing times
        const opentime = {
            am: store.opentimeam,
            pm: store.opentimepm
        };

        const closetime = {
            am: store.closetimeam,
            pm: store.closetimepm
        };

        // Get open condition
        const opencondition = store.openCondition;

        // Calculate most liked items
        const itemCountMap = {};

        orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const itemId = item.id || item._id;
                    if (itemId) {
                        if (!itemCountMap[itemId]) {
                            itemCountMap[itemId] = {
                                count: 0,
                                item: item
                            };
                        }
                        itemCountMap[itemId].count += item.quantity || 1;
                    }
                });
            }
        });

        // Get top 10 most ordered items
        const itemsArray = Object.values(itemCountMap);
        const mopstlikeditems = itemsArray
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(entry => ({
                ...entry.item,
                orderCount: entry.count
            }));

        // Create response object
        const controlPanel = {
            totalProfet,
            averageDaylySailProfet,
            totalOrdersNumber,
            confirmedOrdersNumber,
            canceledOrdersNumber,
            averageSailProfet,
            everymonthSailsNumber,
            opentime,
            closetime,
            opencondition,
            mopstlikeditems
        }

        res.status(200).json({
            error: false,
            data: controlPanel
        });

    } catch (error) {
        console.error("Control Panel Error:", error);
        res.status(500).json({
            error: true,
            message: error
        });
    }
});

module.exports = router;
