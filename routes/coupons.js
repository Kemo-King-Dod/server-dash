const express = require("express")
const router = express.Router()

router.post("/applycoupon", (req, res) => {

    try {
        const { couponCode } = req.body;
        const coupons = [
            {
                couponCode: "FASTO10",
                discountPercentage: 10,
                ids: [
                    req.body.user._id
                ]

            },
            {
                couponCode: "FASTO20",
                discountPercentage: 20,
                ids: [

                ]
            }
        ];

        const coupon = coupons.find(coupon => coupon.couponCode === couponCode && !coupon.ids.includes(req.body.user._id));
        if (!coupon) {
            return res.status(404).json({
                error: true,
                data: {
                    operation: "FAILED",
                    message: "هذا الكود غير صالح",

                },
            });
        }
        else {
            coupon.ids.push(req.body.user._id);
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

