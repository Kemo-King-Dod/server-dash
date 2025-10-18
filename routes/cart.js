const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const User = require("../database/users");
const Item = require("../database/items");
const Store = require("../database/store");
const Retrenchments = require("../database/Retrenchments");
const getCityName = require("../utils/getCityName");

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
    let discoundIds = [];
    for (let i = 0; i < user.cart.length; i++) {
      let the_item = await Item.findById(user.cart[i].cartItem.id);
      if (the_item.retrenchment_end < Date.now()) {
        discoundIds.push(the_item._id);
        the_item.retrenchment_end = null;
        the_item.retrenchment_percent = null;
        the_item.is_retrenchment = false;
        await Item.findByIdAndUpdate(the_item._id, {
          $set: {
            retrenchment_end: null,
            retrenchment_percent: null,
            is_retrenchment: false,
          },
        });
      }
      if (!the_item.is_retrenchment) {
        user.cart[i].cartItem.price = the_item.price;
      } else {
        user.cart[i].cartItem.price =
          the_item.price * (1 - the_item.retrenchment_percent / 100);
      }
    }
    // delete if retrenchment_end is bigger than or equl now
    Retrenchments.deleteMany({
      retrenchment_end: { $lt: Date.now() },
    });

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
          companyFee: store.companyFee,
          location: store.location,
          isModfiy: store.isModfiy,
          modfingPrice: store.modfingPrice,
          items: [
            {
              id: item._id,
              image: item.imageUrl,
              name: item.name,
              price: user.cart[i].cartItem.price,
              quantity: user.cart[i].cartItem.quantity,
              options: user.cart[i].cartItem.options,
              addOns: user.cart[i].cartItem.addOns,
              quantity: user.cart[i].cartItem.quantity,
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
              quantity: user.cart[i].cartItem.quantity,
              options: user.cart[i].cartItem.options,
              addOns: user.cart[i].cartItem.addOns,
              shopId: item.storeID,
              quantity: user.cart[i].cartItem.quantity
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
            companyFee: store.companyFee,
            location: store.location,
            isModfiy: store.isModfiy,
            modfingPrice: store.modfingPrice,

            items: [
              {
                id: item._id,
                image: item.imageUrl,
                name: item.name,
                price: user.cart[i].cartItem.price,
                quantity: user.cart[i].quantity,
                options: user.cart[i].cartItem.options,
                addOns: user.cart[i].cartItem.addOns,
                shopId: item.storeID,
                quantity: user.cart[i].cartItem.quantity

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
    const storeID = cartItem.storeID;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        operation: "null",
        data: "المستخدم غير موجود",
      });
    }
    const store = await Store.findById(storeID);
    if (!store) {
      return res.status(404).json({
        error: true,
        operation: "null",
        data: "المتجر غير موجود",
      });
    }

    // Check for blocked status based on cancelOrderLimit
    if (user.cancelOrderLimit >= 5) {
      return res.status(403).json({
        error: true,
        data: "تم حظر حسابك بسبب كثرة إلغاء الطلبات",
      });
    }

    // Set initial cart item properties
    const newCartItem = {
      storeID: cartItem.storeID,
      id: cartItem.id,
      options: cartItem.options || [],
      addOns: cartItem.addOns || [],
      price: Number(cartItem.price), // تأكد من أن السعر رقم
      isModfiy: store.isModfiy,
      modfingPrice: store.modfingPrice,
      quantity: 1 // تأكد من أن الكمية رقم
    };
    

    // Calculate total price including options and addons
    for (const option of newCartItem.options) {
      if (option.isSelected) {
        newCartItem.price += option.price;
      }
    }
    for (const addon of newCartItem.addOns) {
      if (addon.isSelected) {
        newCartItem.price += addon.price;
      }
    }

    // نسخ السلة الحالية للمستخدم
    let updatedCart = [...user.cart];

    // التحقق من وجود المنتج في السلة
    const existingItemIndex = updatedCart.findIndex(
      (item) => 
        item.cartItem.id === newCartItem.id && 
        item.cartItem.storeID === newCartItem.storeID &&
        JSON.stringify(item.cartItem.options) === JSON.stringify(newCartItem.options) &&
        JSON.stringify(item.cartItem.addOns) === JSON.stringify(newCartItem.addOns)
    );

    if (existingItemIndex !== -1) {
        // حساب السعر الأساسي للمنتج الواحد (قبل زيادة الكمية)
        const currentQuantity = Number(updatedCart[existingItemIndex].cartItem.quantity);
        const currentPrice = Number(updatedCart[existingItemIndex].cartItem.price);
        
        // زيادة الكمية (تأكد من أنها رقم)
        updatedCart[existingItemIndex].cartItem.quantity = currentQuantity + 1;
        
        // تحديث السعر الإجمالي للمنتج بناءً على الكمية الجديدة
        
    } else {
      // إضافة منتج جديد (تأكد من أن الكمية رقم)
      newCartItem.quantity = Number(newCartItem.quantity);
      updatedCart.push({ cartItem: newCartItem });
    }

    // تحديث السلة باستخدام updateOne
    const result = await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        operation: "null",
        data: "فشل تحديث السلة"
      });
    }

    res.status(200).json({
      error: false,
      data: {
        message: "تمت إضافة المنتج إلى السلة بنجاح",
        operation: "success",
        cart: updatedCart,
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
// Add item to cart 
router.post("/addtocartfromstore", auth, async (req, res) => {
  try {
    const { cartItems, storeId } = req.body;
    const userId = req.userId;
    const storeID = storeId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        operation: "null",
        data: "المستخدم غير موجود",
      });
    }

    // Check if store exists
    const store = await Store.findById(storeID);
    if (!store) {
      return res.status(404).json({
        error: true,
        operation: "null",
        data: "المتجر غير موجود",
      });
    }

    // Check for blocked status based on cancelOrderLimit
    if (user.cancelOrderLimit >= 5) {
      return res.status(403).json({
        error: true,
        data: "تم حظر حسابك بسبب كثرة إلغاء الطلبات",
      });
    }

    let updatedCart = [...user.cart];

    // Process each cart item
    for (const cartItem of cartItems) {
      const newCartItem = {
        storeID: storeId,
        id: cartItem.id,
        options: cartItem.options || [],
        addOns: cartItem.addOns || [],
        price: Number(cartItem.price),
        isModfiy: store.isModfiy,
        modfingPrice: store.modfingPrice,
        quantity: Number(cartItem.quantity)
      };

      // Calculate total price including options and addons
      for (const option of newCartItem.options) {
        if (option.isSelected) {
          newCartItem.price += option.price;
        }
      }
      for (const addon of newCartItem.addOns) {
        if (addon.isSelected) {
          newCartItem.price += addon.price;
        }
      }

      // Find existing item index
      const existingItemIndex = updatedCart.findIndex(
        (item) => 
          item.cartItem.id === newCartItem.id && 
          item.cartItem.storeID === newCartItem.storeID &&
          JSON.stringify(item.cartItem.options) === JSON.stringify(newCartItem.options) &&
          JSON.stringify(item.cartItem.addOns) === JSON.stringify(newCartItem.addOns)
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        const currentQuantity = Number(updatedCart[existingItemIndex].cartItem.quantity);
        const currentPrice = Number(updatedCart[existingItemIndex].cartItem.price);
        const basePrice = currentPrice / currentQuantity;
        
        updatedCart[existingItemIndex].cartItem.quantity = currentQuantity + newCartItem.quantity;
        updatedCart[existingItemIndex].cartItem.price = basePrice * updatedCart[existingItemIndex].cartItem.quantity;
      } else {
        // Add new item
        newCartItem.quantity = Number(newCartItem.quantity);
        newCartItem.price = Number(newCartItem.price);
        updatedCart.push({ cartItem: newCartItem });
      }
    }

    // Update user cart using updateOne
    const result = await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        operation: "null",
        data: "فشل تحديث السلة"
      });
    }

    res.status(200).json({
      error: false,
      data: {
        message: "تمت إضافة المنتج إلى السلة بنجاح",
        operation: "success",
        cart: updatedCart
      }
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      error: true,
      operation: "null",
      data: error.message
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

    let updatedCart = [...user.cart];
    updatedCart = updatedCart.filter(item => item.cartItem.storeID != id);

    // تحديث السلة باستخدام updateOne
    const result = await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        message: "فشل تحديث السلة",
      });
    }

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

    let updatedCart = [...user.cart];
    const cartItemIndex = updatedCart.findIndex(
      (item) => item.cartItem && item.cartItem.id == id
    );
 

    if (cartItemIndex === -1) {
      return res.status(404).json({
        error: true,
        message: "المنتج غير موجود في السلة",
      });
    }

    updatedCart.splice(cartItemIndex, 1);
    
    // تحديث السلة باستخدام updateOne
    const result = await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        message: "فشل تحديث السلة",
      });
    }

    res.status(200).json({
      error: false,
      message: "تم حذف المنتج من السلة بنجاح",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء حذف المنتج من السلة",
    });
  }
});
router.patch("/editeQuantity", auth, async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.userId;

    // Find user and validate
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        data: "المستخدم غير موجود"
      });
    }

    // Create updated cart array
    let updatedCart = [...user.cart];
    
    // Find item index in cart
    const itemIndex = updatedCart.findIndex(item => item.cartItem.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        error: true,
        data: "المنتج غير موجود في السلة"
      });
    }

    // Calculate new price based on quantity
    const currentItem = updatedCart[itemIndex];
    // const basePrice = currentItem.cartItem.price / currentItem.cartItem.quantity;
    
    // Update quantity and recalculate total price
    updatedCart[itemIndex].cartItem.quantity = Number(quantity);
    // updatedCart[itemIndex].cartItem.price = basePrice * Number(quantity);

    // Update cart in database
    const result = await User.updateOne(
      { _id: userId },
      { $set: { cart: updatedCart } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        error: true,
        data: "فشل تحديث السلة"
      });
    }
    console.log("success")

    res.status(200).json({
      error: false,
      data: {
        message: "تم تحديث الكمية بنجاح",
        cart: updatedCart
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: true,
      data: "حدث خطأ أثناء تحديث الكمية"
    });
  }
});


router.post ("/getPriceForCart",auth,async(req,res)=>{
  try {
    console.log(req.body);
    const {point,storePoint,isModfiy,distance}=req.body;
    
    let price = 0;
   if( getCityName(point).englishName != getCityName(storePoint).englishName){
    return res.status(200).json({
      error: true,
      message: "لا يمكن الطلب من مدن مختلفة",
    });
   }
    if(!isModfiy){
      if(distance<=4){
        price = 10;
      }else if(distance<=13){
        price = 15;
      }else if(distance<=23){
        price = 20;
      }else if(distance<=35){
        price = 25;
      }else if(distance<=65){
        price = 30;
      }else if(distance<=95){
        price = 35;
      }else if(distance<=125){
        price = 40;

      }
    }

    return res.status(200).json({
      error: false,
      data: {
        price: price
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء حساب السعر",
    });
    
  }


})


module.exports = router;
