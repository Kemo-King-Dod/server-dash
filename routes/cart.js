const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../database/users');
const Item = require('../database/items');
const Store = require('../database/store');

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
        var thedata = []

        for (var i = 0; i < user.cart.length; i++) {
            const item = await Item.findById(user.cart[i].cartItem.id);

            // adjust price in the cart from items
            if(user.cart[i].cartItem.price != item.price){
                user.cart[i].cartItem.price = item.price
                await user.save()
            }


            // find shop
            const store = Store.findById(item.storeID);
            if (thedata.length == 0) {
                thedata.push({
                    shopId: item.storeID,
                    shopName: store.name,
                    shopImage: store.picture,
                    deliveryFee: store.deliveryCostByKilo,
                    items: [{
                        id: item._id,
                        image: item.imageUrl,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        options: user.cart[i].cartItem.options,
                        addOnes: user.cart[i].cartItem.addOns,
                        shopId: item.storeID
                    }]
                });
            }
            else {
                var found = false;
                for (var j = 0; j < thedata.length; j++) {
                    if (thedata[j].shopId == item.storeID) {
                        thedata[j].items.push({
                            id: item._id,
                            image: item.imageUrl,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            options: user.cart[i].cartItem.options,
                            addOnes: user.cart[i].cartItem.addOns,
                            shopId: item.storeID
                        });
                        found = true;
                        break;
                    }
                }
                if (found == false) {
                    thedata.push({
                        shopId: item.storeID,
                        shopName: store.name,
                        shopImage: store.picture,
                        deliveryFee: store.deliveryCostByKilo,
                        items: [{
                            id: item._id,
                            image: item.imageUrl,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            options: user.cart[i].cartItem.options,
                            addOnes: user.cart[i].cartItem.addOns,
                            shopId: item.storeID
                        }]
                    });
                }
            }
        }
        res.status(200).json({
            error: false,
            data: thedata
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            error: true,
            message: error.message
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
