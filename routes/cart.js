const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const User = require("../database/users");
const Item = require("../database/items");
const Store = require("../database/store");
const Retrenchments = require("../database/retrenchments");

// Get all cart items
router.get("/getfromcart", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: true,
        data: "المستخدم غير موجود",
      });
    }

    // git shop discounts
    let discoundIds = []

    for (let i = 0; i < user.cart.length; i++) {
      let the_item = await Item.find({
        _id: user.cart[i].cartItem.id
      });
      if (the_item.retrenchment_end < Date.now()) {
        discoundIds.push(the_item._id)
        the_item.retrenchment_end = null
        the_item.retrenchment_percent = null
        the_item.is_retrenchment = false
        await Item.findByIdAndUpdate(the_item._id, {
          $set: {
            retrenchment_end: null,
            retrenchment_percent: null,
            is_retrenchment: false
          }
        })
      }
      if (!the_item.is_retrenchment) {
        user.cart[i].cartItem.price = the_item.price
      } else {
        user.cart[i].cartItem.price = the_item.price * (1 - the_item.retrenchment_percent / 100)
      }
    }

    // delete if retrenchment_end is bigger than or equl now
    Retrenchments.deleteMany(
      {
        retrenchment_end: { $lt: Date.now() },
      }
    )



    var thedata = [];

    for (var i = 0; i < user.cart.length; i++) {
      const item = await Item.findById(user.cart[i].cartItem.id);

      // find shop
      const store = await Store.findById(item.storeID);
      if (thedata.length == 0) {
        thedata.push({
          shopId: item.storeID,
          shopName: store.name,
          shopImage: store.picture,
          deliveryFee: store.deliveryCostByKilo,
          items: [
            {
              id: item._id,
              image: item.imageUrl,
              name: item.name,
              price: user.cart[i].cartItem.price,
              quantity: 1,
              options: user.cart[i].cartItem.options,
              addOns: user.cart[i].cartItem.addOns,
              shopId: item.storeID,
            },
          ],
        });
      } else {
        var found = false;
        for (var j = 0; j < thedata.length; j++) {
          if (thedata[j].shopId.toString() == item.storeID.toString()) {
            thedata[j].items.push({
              id: item._id,
              image: item.imageUrl,
              name: item.name,
              price: user.cart[i].cartItem.price,
              quantity: 1,
              options: user.cart[i].cartItem.options,
              addOns: user.cart[i].cartItem.addOns,
              shopId: item.storeID,
            });
            found = true;
            break;
          }
        }
        if (!found) {
          thedata.push({
            shopId: item.storeID,
            shopName: store.name,
            shopImage: store.picture,
            deliveryFee: store.deliveryCostByKilo,
            items: [
              {
                id: item._id,
                image: item.imageUrl,
                name: item.name,
                price: user.cart[i].cartItem.price,
                quantity: 1,
                options: user.cart[i].cartItem.options,
                addOns: user.cart[i].cartItem.addOns,
                shopId: item.storeID,
              },
            ],
          });
        }
      }
    }
    res.status(200).json({
      error: false,
      data: thedata,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

// Add item to cart
router.post("/addtocart", auth, async (req, res) => {
  try {
    const { cartItem } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        operation: "null",
        data: "المستخدم غير موجود",
      });
    }

    // Check for blocked status based on cancelOrderLimit
    if (user.cancelOrderLimit >= 5) {
      return res.status(403).json({
        error: true,
        data: "تم حظر حسابك بسبب كثرة إلغاء الطلبات"
      });
    }

    for (var i = 0; i < cartItem.options.length; i++) {
      if (cartItem.options[i].isSelected) {
        cartItem.price += cartItem.options[i].price;
      }
    }
    for (var i = 0; i < cartItem.addOns.length; i++) {
      if (cartItem.addOns[i].isSelected) {
        cartItem.price += cartItem.addOns[i].price;
      }
    }

    user.cart.push({ cartItem });
    await user.save();

    res.status(200).json({
      error: false,
      data: {
        message: "تمت إضافة المنتج إلى السلة بنجاح",
        operation: "success",
        cart: user.cart,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      operation: "null",
      data: error.message,
    });
  }
});

// Remove item from cart
router.patch("/deletestorefromcart", auth, async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        data: "المستخدم غير موجود",
      });
    }

    for (var i = 0; i < user.cart.length; i++) {
      if (user.cart[i].cartItem.storeID == id) {
        user.cart.splice(i--, 1);
      }
    }

    await user.save();

    res.status(200).json({
      error: false,
      message: "تم حذف المنتج من السلة بنجاح",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      message: error.message,
    });
  }
});

router.patch("/deleteitemfromcart", auth, async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        data: "المستخدم غير موجود",
      });
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.id.toString() === id
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        error: true,
        message: "المنتج غير موجود في السلة",
      });
    }

    user.cart.splice(cartItemIndex, 1);
    await user.save();

    res.status(200).json({
      error: false,
      message: "تم حذف المنتج من السلة بنجاح",
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء حذف المنتج من السلة",
    });
  }
});

module.exports = router;
