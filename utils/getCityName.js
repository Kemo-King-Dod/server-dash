const cities = require("./cities.json");
const { isPointInsidePolygon } = require("./is_inside_polygon");

function getCityName(point) {
    let cityName = "";
    for (const city of cities) {
        if (isPointInsidePolygon(point, city.boundary)) {
            cityName = city.Arabicname;
            break;
        }
    }
    return cityName;
}

module.exports = getCityName;