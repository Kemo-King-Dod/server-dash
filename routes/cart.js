const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth')

// Get all cart items
router.post('/getfromcart',auth , async (req, res) => {
    try {
        const userId = req.userId;
        const cartItems = await Cart.find({ userId });
        
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء جلب عناصر السلة', error: error.message });
    }
});

// Add item to cart
router.post('/addtocart',auth , async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.userId;

        let cartItem = await Cart.findOne({ userId, productId });

        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            cartItem = new Cart({
                userId,
                productId,
                quantity
            });
            await cartItem.save();
        }

        res.status(200).json({ message: 'تمت إضافة المنتج إلى السلة بنجاح', cartItem });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء إضافة المنتج إلى السلة', error: error.message });
    }
});

// Remove item from cart
router.delete('/removefromcart',auth , async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.userId;

        const result = await Cart.findOneAndDelete({ userId, productId });

        if (!result) {
            return res.status(404).json({ message: 'المنتج غير موجود في السلة' });
        }

        res.status(200).json({ message: 'تم حذف المنتج من السلة بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج من السلة', error: error.message });
    }
});

module.exports = router;
