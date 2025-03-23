const express = require("express");
const getCityName = require("../utils/getCityName");
const router = express.Router();
const itemsM = require("../database/items");
const stores = require("../database/store");


router.post("/getCity",async (req,res)=>{
try{
    
    const {point} =req.body
    console.log("point",point)
    const city =  getCityName(point);
    console.log("city",city)
    return res.status(200).json({
        error:false,
        data:{
            city:city,
        }
    })

}catch{(e)=>{
return res.json({
    error:true,
    message:e.message
})
}}  
    
})
// setCitiestoItems(); 
async function setCitiestoItems() {
    try {
        // Get all items from database
        const items = await itemsM.find({});
        
        // Process items in parallel using Promise.all
        await Promise.all(items.map(async (item) => {
            try {
                // Find associated store
                const store = await stores.findById(item.storeID);
                if (!store) {
                    console.error(`Store not found for item: ${item.name}`);
                    return;
                }

                // Set city based on store location
                item.city = getCityName(store.location);
                item.storeName = store.name;
                item.storeImage = store.picture; 
 
                console.log("store", store.location);
                console.log("city", item.name, " - ", item.city);

                // Save updated item
                await item.save();
            } catch (error) {
                console.error(`Error processing item ${item.name}:`, error);
            }
        }));

        console.log("All items processed successfully");
    } catch (error) {
        console.error("Error in setCitiestoItems:", error);
    }
}

module.exports = router;
