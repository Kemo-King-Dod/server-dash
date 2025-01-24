const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');
const Item = require('../database/items');
const Shop = require('../database/store');

// Get all cart items
router.get('/getfromcart', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                error: true,
                data: 'المستخدم غير موجود'
            });
        }

        // Group items by shopId
        const shopGroups = {};

        // Process each cart item
        for (const cartEntry of user.cart) {
            try {
                const cartItem = cartEntry.cartItem;
                const itemInDB = await Item.findById(cartItem.id);
                
                if (itemInDB) {
                    // Update price if different
                    if (cartItem.price !== itemInDB.price) {
                        cartItem.price = itemInDB.price;
                        await user.save();
                    }

                    // Get shop data if not already fetched
                    if (!shopGroups[itemInDB.shopId]) {
                        const shop = await Shop.findById(itemInDB.shopId);
                        if (shop) {
                            shopGroups[itemInDB.shopId] = {
                                shopId: shop._id,
                                shopName: shop.name,
                                shopImage: shop.image,
                                deliveryFee: shop.deliveryFee,
                                items: []
                            };
                        }
                    }

                    // Add formatted item to shop group
                    if (shopGroups[itemInDB.shopId]) {
                        shopGroups[itemInDB.shopId].items.push({
                            id: itemInDB._id,
                            image: itemInDB.image,
                            name: itemInDB.name,
                            price: itemInDB.price,
                            quantity: cartItem.quantity || 1,
                            options: cartItem.options || '',
                            addOnes: cartItem.addOnes || '',
                            shopId: itemInDB.shopId
                        });
                    }
                }
            } catch (error) {
                console.log('Error processing cart item:', error.message);
                continue;
            }
        }

        const formattedCart = Object.values(shopGroups);
        console.log(formattedCart)

        res.status(200).json({
            error: false,
            data: formattedCart
        });

    } catch (error) {
        console.log('Error in getfromcart:', error.message);
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
                operation: "null",
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
