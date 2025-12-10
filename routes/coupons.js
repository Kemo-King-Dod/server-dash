const express = require("express");
const { auth } = require("../middleware/auth");
const router = express.Router()

router.post("/applycoupon", auth, (req, res) => {
    try {
        const { couponCode } = req.body;
        console.log(couponCode);
        const coupons = [
            {
                couponCode: "FASTO10",
                discountPercentage: 10,
                ids: [
                    req.user._id
                ]

            },
            {
                couponCode: "FASTO20",
                discountPercentage: 20,
                ids: [

                ]
            }
        ];

        const coupon = coupons.find(coupon => coupon.couponCode == couponCode && !coupon.ids.includes(req.user._id));
        if (!coupon) {
            return res.status(404).json({
                error: false,
                data: {
                    operation: "FAILED",
                    message: "هذا الكود غير صالح",

                },
            });
        }
        else {
            coupon.ids.push(req.user._id);
            res.status(200).json({
                error: false,
                data: {
                    operation: "SUCCESS",
                    message: "تم تطبيق الكود بنجاح",
                    discountPercentage: coupon.discountPercentage,
                },
            });
        }

    } catch (error) {
        console.log(error);
        res.status(401).json({
            error: true,
            data: {
                message: error

            }
        })

    }


})


module.exports = router

