const express = require("express");
const route = express.Router();
const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const items = require("../database/items");
const Store = require("../database/store");
const { auth } = require("../middleware/auth");

let the_items

read();
async function read() {
    const data = await fs.readFile(
        path.join(__dirname, "..", "data", "data.txt"),
    );
    the_items = parseInt(data.toString());
}


route.post("/additems", auth, async (req, res) => {
    console.log(req.body)
    console.log('--------------------------------------------')
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header
        const { name, price, desc, options } = req.body;

        if (!token) {
            return res.status(401).json({
                error: true,
                message: "Token not provided"
            });
        }

        const the_store = await Store.findOne({ _id: await jwt.verify(token, "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman").id });

        if (!the_store || the_store.registerCondition !== "accepted") {
            console.log('غير مصرح')
            return res.status(403).json({
                error: true,
                operation: "addProduct",
                message: "غير مصرح"
            });
        }

        const item = {
            name,
            price,
            description: desc,
            options,
            picture: req.file ? req.file.filename : null,
            storeid: the_store.id,
            store_register_condition: the_store.registerCondition,
            quantity: req.body.quantity || 0,
            is_retrenchment: req.body.is_retrenchment || false,
            retrenchment_percent: req.body.retrenchment_percent || 0
        };

        const newItem = await items.create(item);
        await Store.updateOne(
            { _id: the_store.id },
            { $push: { items: newItem._id } }
        );
        console.log(newItem);
        the_items++;
        await fs.writeFile(
            path.join(__dirname, "..", "data", "data.txt"),
            `${the_items}`
        );

        res.status(200).json({
            error: false,
            operation: "addProduct",
            message: newItem
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({
            error: true,
            operation: "addProduct",
            message: "حدث خطأ في السيرفر"
        });
    }
});

route.post("/updateitem", auth, async (req, res) => {
    try {
        await items.findByIdAndUpdate(req.body.id, {
            $set: {
                name: req.body.name,
                price: req.body.price,
                desc: req.body.desc,
                options: req.body.options,
            },
        });
        res.status(200).json({
            error: false,
            operation: "editProduct",
            message: "تم التعديل بنجاح",
        });
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            error: false,
            operation: "editProduct",
            message: error.message,
        });
    }
});
route.patch("/deleteitem", auth, async (req, res) => {
    try {
        await items.findByIdAndDelete(req.body.id);
        res.status(200).json({
            error: false,
            operation: "deleteProduct",
            message: "تم الحذف بنجاح",
        });
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            error: false,
            operation: "deleteProduct",
            message: error.message,
        });
    }
});


module.exports = route;
