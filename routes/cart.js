const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')

// Get all cart items
router.get('/',auth , async (req, res) => {
    try {
        // Assuming you have a user ID from authentication
        const userId = req.user.id;
        const cartItems = await Cart.find({ userId });
        
        res.status(200).json(cartItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart items', error: error.message });
    }
});

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.user.id;

        // Check if item already exists in cart
        let cartItem = await Cart.findOne({ userId, productId });

        if (cartItem) {
            // Update quantity if item exists
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // Create new cart item if it doesn't exist
            cartItem = new Cart({
                userId,
                productId,
                quantity
            });
            await cartItem.save();
        }

        res.status(200).json({ message: 'Item added to cart successfully', cartItem });
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const result = await Cart.findOneAndDelete({ userId, productId });

        if (!result) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        res.status(200).json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

module.exports = router;
