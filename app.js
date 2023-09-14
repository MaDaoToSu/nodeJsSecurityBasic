//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";
import dotenv from "dotenv";
import md5 from "md5";
import bcrypt from "bcrypt";
const saltRounds = 10;
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
    email: { type: String, unique: true },
    password: String,
});
// Encrypt
// const secret = process.env.secret;
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });
const User = mongoose.model("user", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/register", (req, res) => {
    res.render("register");
});
app.get("/secrets", (req, res) => {
    res.render("secrets");
});
app.get("/submit", (req, res) => {
    res.render("submit");
});

app.post("/register", (req, res) => {
    const email = req.body.username;
    // Hash md5
    // const password = md5(req.body.password);
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) {
            console.log(err);
        } else {
            const newUser = new User({
                email: email,
                password: hash,
            });
            newUser
                .save()
                .then((user) =>
                    console.log("save user success", user.email, "-", user.password)
                )
                .then(res.redirect("/secrets"));
        }
    });
});

app.post("/login", (req, res) => {
    const email = req.body.username;
    // Hash md5
    //   const password = md5(req.body.password);


    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                console.log("khong ton tai user");
            } else {
                bcrypt.compare(req.body.password, user.password, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else if (result === false) {
                        console.log("mat khau khong dung");
                    } else {
                        console.log("login success");
                        res.redirect("/secrets");
                    }
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.listen(port, (req, res) => {
    console.log(`app is running on port ${port}`);
});
