const fs = require('fs').promises;
const path = require('path');

/**
 * دالة لحذف ملف تم رفعه على الخادم
 * @param {string} filePath - مسار الملف المراد حذفه
 */
async function deleteUploadedFile(filePath) {
  try {
    if (!filePath) return;
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, '..', filePath);
    await fs.unlink(absolutePath);
  } catch (error) {
    console.error("حدث خطأ أثناء حذف الملف:", error);
  }
}

module.exports = deleteUploadedFile;
