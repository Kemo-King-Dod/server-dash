const express = require('express');
const router = express.Router();
const Report = require('../database/report');
const { auth } = require('../middleware/auth'); // افتراض وجود middleware للمصادقة

// طلب إضافة بلاغ جديد
router.post('/addReport', auth, async (req, res) => {
    try {
        const { description, reportedabout, reportedBy } = req.body;

        // التحقق من وجود الوصف
        if (!description || !reportedabout || !reportedBy) {
            return res.status(400).json({
                success: false,
                message: 'الوصف مطلوب لإنشاء البلاغ'
            });
        }

        // إنشاء بلاغ جديد
        const newReport = new Report({
            description,
            reportedabout,
            reportedat: req.userId
        });

        // حفظ البلاغ في قاعدة البيانات
        await newReport.save();

        res.status(201).json({
            success: true,
            message: 'تم إضافة البلاغ بنجاح',
            data: newReport
        });
    } catch (error) {
        console.error('خطأ في إضافة البلاغ:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء إضافة البلاغ',
            error: error.message
        });
    }
});

// طلب الحصول على جميع البلاغات
router.get('/getAllReports', auth, async (req, res) => {
    try {
        const reports = await Report.find().populate('reportedBy', 'name email');
        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء استرجاع البلاغات',
            error: error.message
        });
    }
});

// طلب الحصول على بلاغ محدد
router.get('/getReport', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.body.id).populate('reportedBy', 'name email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء استرجاع البلاغ',
            error: error.message
        });
    }
});

// طلب تحديث حالة البلاغ
router.put('/changeReportStatus', auth, async (req, res) => {
    try {
        const { status, description } = req.body;

        const report = await Report.findById(req.body.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        // تحديث البيانات
        if (status) report.status = status;
        if (description) report.description = description;

        await report.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث البلاغ بنجاح',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تحديث البلاغ',
            error: error.message
        });
    }
});

// طلب حذف بلاغ
router.delete('/deleteReport', auth, async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.body.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'البلاغ غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف البلاغ بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء حذف البلاغ',
            error: error.message
        });
    }
});

module.exports = router;
