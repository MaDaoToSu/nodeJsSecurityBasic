//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import session from "express-session";
import LocalStrategy from 'passport-local';
import GoogleStrategy from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';

dotenv.config();

const app = express();
const port = 3000;
const DBName = "authentication";
const Url = "mongodb://localhost:27017";
mongoose
    .connect(Url + "/" + DBName, {
        useNewUrlParser: true,
        useUnifiedTopology: true,

    })
    .then(console.log("Connect DB success"));

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

const userSchema = mongoose.Schema({
    googleId: String,
    email: String,
    password: String,
});
//init session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
// Thêm strategy xác thực vào Express
app.use(passport.initialize());
app.use(passport.session());
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("user", userSchema);
// Tạo một strategy xác thực
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            done(err, null);
        })
});

// Oath20 google
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// Login google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: '/secrets',
    failureRedirect: '/login'
}), (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    // Xác thực người dùng
    User.findOne({ email }, (err, user) => {
        if (err) {
            next(err);
            return;
        }

        if (!user) {
            res.status(401).send("Email hoặc mật khẩu không chính xác");
            return;
        }

        // Kiểm tra mật khẩu
        if (!user.authenticate(password)) {
            res.status(401).send("Email hoặc mật khẩu không chính xác");
            return;
        }

        // Đăng nhập người dùng
        req.login(user, (err) => {
            if (err) {
                next(err);
                return;
            }
            res.redirect("/secrets");
        });
    });
});
app.get("/register", (req, res) => {
    res.render("register");
});
// Register
app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    User.register({ username: email }, password)
        .then((user) => {
            req.login(user, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect("/register");
                } else {
                    res.redirect("/secrets");
                }
            });
        })
        .catch((err) => {
            console.log(err);
            res.redirect("/register");
        });
});

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("davao 2");
        res.render("secrets");
    } else {
        res.redirect("/login")
    }

});




app.listen(port, (req, res) => {
    console.log(`app is running on port ${port}`);
});