import express from "express";
import { config } from "dotenv";
import cors from "cors";
import session from "express-session";
import compression from "compression";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

import { connectToPg } from "./db/db.js";
import getAllBlogsRoute from "./routes/getPosts.js";
import getPostBySlugRoute from "./routes/getPostBySlug.js";
import analyticsRoute from "./routes/patchAnalytics.js";
import insertPostRoute from "./routes/insertPost.js";
import postBlogRoute from "./routes/postBlog.js";
import updateReadtimeRoute from "./routes/updateReadTime.js";
import adminLoginRoute from "./routes/adminLogin.js";
import dashboardRoute from "./routes/dashboard.js";
import authCheck from "./middleware/authCheck.js";
import deleteBlogRoute from "./routes/deleteBlog.js";
import adminGetPostBySlugRoute from "./routes/adminGetBySlug.js";

const app = express();

config();

app.set("view engine", "pug");
app.use(express.urlencoded({ extended: true }));

// Redis client setup
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
await redisClient.connect().then(() => console.log("Connected to Redis"));

let redisStore = new RedisStore({
  client: redisClient,
})

app.use(
    session({
        store: redisStore,
        secret: process.env.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: false, // true if behind HTTPS (Railway + proxy)
          httpOnly: true,
          maxAge: 30 * 60 * 1000, // 30 minutes
        },
    })
);

app.use(compression()); // Compress the response

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || process.env.ALLOWEDORIGIN.includes(origin)) {
                // Allow the request from allowed origins or if no origin is provided (e.g., mobile apps)
                callback(null, true);
            } else {
                // Reject requests from other origins
                callback(new Error("Not allowed by CORS"), false);
            }
        },
        methods: "GET,POST,PUT,DELETE,PATCH",
        credentials: true,
    })
);

app.use(express.json());

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("login");
});

app.use("/all", getAllBlogsRoute);
app.use("/blog", getPostBySlugRoute);
app.use("/analytics", analyticsRoute);
app.use("/insert", authCheck, insertPostRoute);
app.use("/post", authCheck, postBlogRoute);
app.use("/readtime", updateReadtimeRoute);
app.use("/login", adminLoginRoute);
app.use("/dashboard", authCheck, dashboardRoute);
app.use('/delete', authCheck, deleteBlogRoute);
app.use('/blogbyid', authCheck, adminGetPostBySlugRoute);
app.use("/logout", authCheck, (req, res) => {
    (req.session.admin = null), res.redirect("/");
});

connectToPg(() => {
    app.listen(process.env.PORT, () => {
        console.log("Listening at port:", process.env.PORT);
    });
});
