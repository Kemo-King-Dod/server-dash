const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth')
const notification = require("../database/notification");
const User = require('../database/users');
const { sendNotification, sendNotificationToTopic } = require('../firebase/notification');

// Mark notification as read
router.get('/notification', auth, async (req, res) => {
    try {
        const data = await (await notification.find({ id: req.userId })).reverse()
        res.json({
            error: false,
            data
        })

        for (let i = 0; i < data.length; i++) {
            data[i].isRead = true
            data[i].save()
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
})

// Get count of unread notifications
router.get("/notificationCount", auth, async (req, res) => {
    try {
        // Get count of unread notifications for the authenticated user
        const count = await notification.countDocuments({
            id: req.userId,
            isRead: false
        });

        return res.json({
            error: false,
            data: {
                count
            }
        });
    } catch (error) {
        // Log error for debugging
        console.error('Error getting notification count:', error);

        return res.status(500).json({
            error: true,
            message: 'Failed to get notification count'
        });
    }
});

router.post('/deleteNotification', auth, async (req, res) => {
    try {
        await notification.findByIdAndDelete(req.body.id)
        res.json({
            error: false,
            message: 'تم حذف الإشعار بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في حذف الإشعار'
        });
    }
})

router.post('/deleteAllNotifications', auth, async (req, res) => {
    try {
        await notification.deleteMany({ id: req.userId })
        res.json({
            error: false,
            message: 'تم حذف الإشعارات بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            error: true,
            message: 'فشل في حذف الإشعار'
        });
    }
})

router.post('/sendNotification',auth,async(req,res)=>{
    try {
        console.log(req.body)
        const {title,body,type,target,phone,origin} = req.body;
        if(target=="specific"){
            const user = await User.findOne({phone})
            if(!user){
                return res.status(401).json({
                    error:true,
                    message:"User not found"
                })
            }
            sendNotification({token:user.fcmToken,title,body})
            return res.json({
                error:false,
                message:"Notification sent successfully",
                target,
                origin,
                topicName:target
            })

        }else{
            const trgt = getTarget(target)
            if(trgt=="null"){
                return res.status(401).json({
                    error:true,
                    message:"Invalid target"
                })
            }
            
            // Format and sanitize topic name according to Firebase requirements
            let topicName = (origin + trgt).toLowerCase();
            topicName = topicName.replace(/[^a-zA-Z0-9-_.~%]/g, '_');
            console.log(topicName)
            sendNotificationToTopic({topic: topicName, title, body})
            return res.json({
                error:false,
                message:"Notification sent successfully",
                target,
                origin,
                topicName
            })




        }

        
        


        
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            error:true,
            message:"Failed to send notification"
        })
        
    }

});
router.get("/getOrigins",auth,async(req,res)=>{
    try {
        const origins =require("../utils/cities.json")
        res.json({
            error:false,
            data:origins,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            error:true,
            message:"Failed to get origins"
        })
    }
})

const getTarget = (target)=>{
    switch(target){
        case "all":
            return "all"
        case "users":
            return "_users"
        case "drivers":
            return "_drivers"
        default:
            return "null"
    }
}




module.exports = router; 