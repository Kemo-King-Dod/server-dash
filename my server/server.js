const express = require("express");
const app = express();
const ShopLogin = require("./routes/shopLogin.js");
const showshpsrequists = require("./routes/showshpsrequists.js");
const acceptshop = require("./routes/acceptshop.js");
const addItems = require("./routes/addItems.js");
const getshopItems = require("./routes/getshopitems.js");
const getitems = require("./routes/getitems.js");
const usersignup = require("./routes/usersignup.js");
const add_to_favorite = require("./routes/add_to_favorite.js");
const addtocart = require("./routes/addtocart.js");
const locations = require("./routes/locations.js");
const requist = require("./routes/requist.js");
const { createserver, connect } = require("./connention/s.js");
const path = require("path");

const connecting = require("./database/database.js");
connecting();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

const expressserver = app.listen(4000, () => {
  console.log("server is listening on port 4000");
});

const io = createserver(expressserver);

io.on("connection", connect);

app.use(ShopLogin);
app.use(acceptshop);
app.use(showshpsrequists);
app.use(addItems);
app.use(getshopItems);
app.use(getitems);
app.use(usersignup);
app.use(add_to_favorite);
app.use(addtocart);
app.use(requist);
app.use(locations);
