const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const items = require("../database/items");
const Store = require("../database/store");
const User = require("../database/users");

// Create indexes when the application starts
async function createIndexes() {
    try {
        // Create text indexes for both collections
        await Store.collection.createIndex({ name: "text" });
        await items.collection.createIndex({ name: "text" });
        console.log('Text indexes created successfully');
    } catch (error) {
        console.error('Error creating text indexes:', error);
    }
}

// Call createIndexes when your application starts
createIndexes();

route.post('/search', async (req, res) => {
    try {
        var id = null;
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (token) {
            const JWT_SECRET = "Our_Electronic_app_In_#Sebha2024_Kamal_&_Sliman";
            const decoded = jwt.verify(token, JWT_SECRET);
            id = decoded.id;
        }

        const searchTerm = req.body.keyWord;

        // Try text search first for stores
        let allStores = await Store.aggregate([
            {
                $match: {
                    $text: { $search: searchTerm }
                }
            },
            {
                $sort: {
                    score: { $meta: "textScore" }
                }
            },
            {
                $limit: 2
            }
        ]);

        // If no results, fall back to regex search for stores
        if (allStores.length === 0) {
            allStores = await Store.aggregate([
                {
                    $match: {
                        name: {
                            $regex: searchTerm,
                            $options: 'i'
                        }
                    }
                },
                {
                    $limit: 2
                }
            ]);
        }

        // Try text search first for items
        let allItems = await items.aggregate([
            {
                $match: {
                    $text: { $search: searchTerm }
                }
            },
            {
                $sort: {
                    score: { $meta: "textScore" }
                }
            },
            {
                $limit: 4
            }
        ]);

        // If no results, fall back to regex search for items
        if (allItems.length === 0) {
            allItems = await items.aggregate([
                {
                    $match: {
                        name: {
                            $regex: searchTerm,
                            $options: 'i'
                        }
                    }
                },
                {
                    $limit: 4
                }
            ]);
        }

        // add store name and image to the items
        for (let i = 0; i < allItems.length; i++) {
            if (!allItems[i]) continue;
            var itemStore = await Store.findById(allItems[i].storeID);
            allItems[i].storeName = itemStore.name;
            allItems[i].storeImage = itemStore.picture;
        }

        // Handle visitor case
        if (req.headers.isvisiter && req.headers.isvisiter == "true") {
            res.json({
                error: false,
                data: {
                    products: allItems,
                    stores: allStores
                }
            });
            return;
        }

        // Handle authenticated user case
        // Add isFavorite property to stores
        for (var i = 0; i < allStores.length; i++) {
            if (!allStores[i]) continue;
            allStores[i].isFavorite = false;
        }

        if (id) {
            const user = await User.findOne({ _id: id });
            // Update store favorites
            for (var i = 0; i < allStores.length; i++) {
                if (!allStores[i]) continue;
                for (var j = 0; j < user.favorateStors.length; j++) {
                    if (!user.favorateStors[j]) continue;
                    if (user.favorateStors[j]._id.toString() === allStores[i]._id.toString()) {
                        allStores[i].isFavorite = true;
                    }
                }
            }

            // Add isFollow property to stores
            for (var i = 0; i < allStores.length; i++) {
                if (!allStores[i]) continue;
                allStores[i].isFollow = false;
                for (var j = 0; j < user.followedStores.length; j++) {
                    if (user.followedStores[j] == allStores[i]._id) {
                        allStores[i].isFollow = true;
                    }
                }
            }

            // Add isFavorite property to items
            for (var i = 0; i < allItems.length; i++) {
                if (!allItems[i]) continue;
                allItems[i].isFavorite = false;
                for (var j = 0; j < user.favorateItems.length; j++) {
                    if (!user.favorateItems[j]) continue;
                    if (user.favorateItems[j]._id.toString() === allItems[i]._id.toString()) {
                        allItems[i].isFavorite = true;
                    }
                }
            }

            // Add like property to items
            for (var i = 0; i < allItems.length; i++) {
                if (!allItems[i]) continue;
                allItems[i].like = false;
                for (var j = 0; j < user.likedItems.length; j++) {
                    if (!user.likedItems[j]) continue;
                    if (user.likedItems[j] == allItems[i]._id.toString()) {
                        allItems[i].like = true;
                    }
                }
            }
        }

        res.json({
            error: false,
            data: {
                products: allItems,
                stores: allStores
            }
        });
    } catch (error) {
        console.log(error);
        res.status(401).json({
            error: true,
            message: error.message,
        });
    }
});

module.exports = route;
