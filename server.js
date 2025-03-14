const express = require("express");
const app = express();
const fireAdmin = require("./firebase/firebase_admin.js")
const path = require("path");
const { sendNotification } = require("./firebase/notification.js")
// database
const { createserver, connect } = require("./connention/socketio.js");
const connecting = require("./database/database.js");
connecting();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const expressserver = app.listen(4000, () => {
  console.log("server is listening on port 4000");
});

const io = createserver(expressserver);
io.on("connection", connect);


// const errorHandler = require('./middleware/ErrorHandler');
// app.use(errorHandler.AppError);
// app.use(errorHandler.catchAsync);
// app.use(errorHandler.errorHandler);


const loadphoto = require("./routes/loadPhoto.js");
app.use(loadphoto);

const signup = require("./routes/signUp.js");
app.use(signup);

const login = require("./routes/login.js");
app.use(login);

const cart = require("./routes/cart.js");
app.use(cart);

const favorite = require("./routes/favorite.js");
app.use(favorite);

const follow = require("./routes/follow.js");
app.use(follow);

const admin = require("./routes/admin.js");
app.use(admin);

const items = require("./routes/Items.js");
app.use(items);

const store = require("./routes/store.js");
app.use(store);

const user = require("./routes/user.js");
app.use(user);

const driver = require("./routes/driver.js");
app.use(driver);

const orders = require("./routes/orders.js");
app.use(orders);

const categiries = require("./routes/getcategiries.js");
app.use(categiries);

const wallet = require("./routes/wallet.js");
app.use(wallet);

const likes = require("./routes/likes.js");
app.use(likes);

const retrenchments = require("./routes/retrenchments.js");
app.use(retrenchments);

const search = require("./routes/search.js");
app.use(search);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'try.html'))
})
// sendNotification({token:"fdpKPZE7THW8ezJMF5ohkW:APA91bE96fqDdDBef5KOfknWGs-WgERfmu-uVyWRp8vAs9hDqNwHaELG42utZ2yCbhPi319vg0FLHSXFhj_b7is8-CfY6dHlloozbLxoobq3oMhunqUUV2Y",title:"تجربة", body:"اول رسالة"})