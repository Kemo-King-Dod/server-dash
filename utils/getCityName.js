const cities = require("./cities.json");
const { isPointInsidePolygon } = require("./is_inside_polygon");

function getCityName(point) {
    let cityName = "";
    let englishName = "";
    for (const city of cities) {
        if (isPointInsidePolygon(point, city.boundary)) {
            cityName = city.Arabicname;
            englishName = city.Englishname;
            break;
        } else {
            cityName = "خارج النطاق"
            englishName = "Outside the scope"
        }
    }
    return { cityName, englishName };
}

module.exports = getCityName;