const express = require("express");
const getCityName = require("../utils/getCityName");
const router = express.Router();
const Order = require("../database/orders");
let DriversLocations = require("../utils/driversLocations.json");
const { auth } = require("../middleware/auth");

router.post("/getCity", async (req, res) => {
    try {
        const { point } = req.body
        console.log(point)
        
      

        const city = getCityName(point)
        return res.status(200).json({
            error: false,
            data: {
                city: city.cityName,
                englishName: city.englishName
            }
        })
    } catch {
        (e) => {
            return res.json({
                error: true,
                message: e.message
            })
        }
    }
})
async function setCitiesToOrders() {
    try {
        const orders = await Order.find({});
        
        for (const order of orders) {
            const cityInfo = getCityName(order.store.location);
            await Order.findByIdAndUpdate(order._id, {
                city: {
                    arabicName: cityInfo.cityName,
                    englishName: cityInfo.englishName
                }
            });
        }
        
        return await Order.find({});
    } catch (error) {
        console.error("Error setting cities:", error);
        throw error;
    }
}

module.exports = router;
 