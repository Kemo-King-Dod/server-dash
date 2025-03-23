/**
 * تحقق مما إذا كانت النقطة تقع داخل المضلع
 * @param {Object} point - كائن يحتوي على خط الطول وخط العرض للنقطة المراد فحصها
 * @param {Array} polygonPoints - مصفوفة من النقاط التي تشكل المضلع
 * @returns {boolean} - يعيد true إذا كانت النقطة داخل المضلع، false إذا كانت خارجه
 */
function isPointInsidePolygon(point, polygonPoints) {
    let i, j = polygonPoints.length - 1;
    let oddNodes = false;

    for (i = 0; i < polygonPoints.length; i++) {
        if ((polygonPoints[i].latitude < point.latitude && polygonPoints[j].latitude >= point.latitude ||
                polygonPoints[j].latitude < point.latitude && polygonPoints[i].latitude >= point.latitude) &&
            (polygonPoints[i].longitude <= point.longitude || polygonPoints[j].longitude <= point.longitude)) {
            
            if (polygonPoints[i].longitude + (point.latitude - polygonPoints[i].latitude) /
                    (polygonPoints[j].latitude - polygonPoints[i].latitude) *
                    (polygonPoints[j].longitude - polygonPoints[i].longitude) <
                point.longitude) {
                oddNodes = !oddNodes;
            }
        }
        j = i;
    }

    return oddNodes;
}

module.exports = { isPointInsidePolygon };
