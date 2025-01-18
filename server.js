const express = require("express");
const app = express();

const path = require("path");
// database
const { createserver, connect } = require("./connention/socketio.js");
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


const loadphoto = require("./routes/loadPhoto.js");
app.use(loadphoto);

const signup = require("./routes/signUp.js");
app.use(signup);

const login = require("./routes/login.js");
app.use(login);

// Error handling middleware (should be last)
const errorHandler = require('./middleware/ErrorHandler');
app.use(errorHandler.AppError);
app.use(errorHandler.catchAsync);
app.use(errorHandler.errorHandler);

const admin = require("./routes/admin.js");
app.use(admin);

// const ShopLogin = require("./routess/shopLogin.js");
// const showshpsrequists = require("./routess/showshpsrequists.js");
// const acceptshop = require("./routess/acceptshop.js");
// const addItems = require("./routess/addItems.js");
// const getshopItems = require("./routess/getshopitems.js");
// const getitems = require("./routess/getitems.js");
// const usersignup = require("./routess/usersignup.js");
// const add_to_favorite = require("./routess/add_to_favorite.js");
// const addtocart = require("./routess/addtocart.js");
// const locations = require("./routess/locations.js");
// const requist = require("./routess/requist.js");
// app.use(ShopLogin);
// app.use(acceptshop);
// app.use(showshpsrequists);
// app.use(addItems);
// app.use(getshopItems);
// app.use(getitems);
// app.use(usersignup);
// app.use(add_to_favorite);
// app.use(addtocart);
// app.use(requist);
// app.use(locations);

