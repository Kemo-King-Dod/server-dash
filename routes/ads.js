const express = require("express");
const route = express.Router();
const Ads = require("../database/ads");
const deleteUploadedFile = require("../utils/deleteImage");

route.get("/getAdses", async (req, res) => {
  const allAds = await Ads.find({});

  return res.status(200).json({
    error: false,
    data: {
      adses: allAds,
    },
  });
});
route.post("/addAdeses", async (req, res) => {
  try {
    const { ads } = req.body.ads;
    const newAds = await Ads.create(ads);
    return res.status(200).json({
      error: false,
      data: {
        ads: newAds,
      },
    });
  } catch (error) {
    return res.status(200).json({
      error: true,
      message:error,
    });
  }
});

// تعديل إعلان
route.patch("/editAdeses/:id", async (req, res) => {
  try {
    const adId = req.params.id;
    const updateData = req.body;
    const updatedAd = await Ads.findByIdAndUpdate(adId, updateData, { new: true });
    if (!updatedAd) {
      return res.status(404).json({
        error: true,
        message: "الإعلان غير موجود",
      });
    }
    return res.status(200).json({
      error: false,
      data: {
        ads: updatedAd,
      },
      message: "تم تعديل الإعلان بنجاح",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء تعديل الإعلان",
    });
  }
});

// حذف إعلان
route.delete("/deleteAdeses/:id", async (req, res) => {
  try {
    const adId = req.params.id;
    const deletedAd = await Ads.findByIdAndDelete(adId);

    if (!deletedAd) {
      return res.status(404).json({
        error: true,
        message: "الإعلان غير موجود",
      });
    }

    await deleteUploadedFile(deletedAd.picture);

    return res.status(200).json({
      error: false,
      message: "تم حذف الإعلان بنجاح",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "حدث خطأ أثناء حذف الإعلان",
    });
  }
});

module.exports = route;
