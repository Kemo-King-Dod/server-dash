const express = require("express");
const getCityName = require("../utils/getCityName");
const router = express.Router();

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

module.exports = router;
