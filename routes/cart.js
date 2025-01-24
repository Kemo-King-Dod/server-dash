const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');

// Get all cart items
router.post('/getfromcart', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }
        
        res.status(200).json({
            error: false,
            data: user.cart
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء جلب عناصر السلة'
        });
    }
});

// Add item to cart
router.post('/addtocart', auth, async (req, res) => {
    try {
        const { cartItem } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                operation:"null",
                data: 'المستخدم غير موجود'
            });
        }

        user.cart.push({ cartItem });
        await user.save();
        
        // const existingCartItem = user.cart.find(item => item.productId.toString() === productId);
        // if (existingCartItem) {
        //     existingCartItem.quantity += quantity;
        // } else {
        // }
        
        res.status(200).json({
            error: false,
            data: {
                message: 'تمت إضافة المنتج إلى السلة بنجاح',
                operation: 'success',
                cart: user.cart
            }
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            operation: 'null',
            data: error.message
        });
    }
});

// Remove item from cart
router.delete('/removefromcart/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }

        const cartItemIndex = user.cart.findIndex(item => item.productId.toString() === productId);

        if (cartItemIndex === -1) {
            return res.status(404).json({
                error: true,
                data: 'المنتج غير موجود في السلة'
            });
        }

        user.cart.splice(cartItemIndex, 1);
        await user.save();

        res.status(200).json({
            error: false,
            data: 'تم حذف المنتج من السلة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            data: 'حدث خطأ أثناء حذف المنتج من السلة'
        });
    }
});

module.exports = router;
