import express from "express";
import { config } from "dotenv";
import cors from "cors";

import { connectToPg } from "./db/db.js";
import getAllBlogsRoute from "./routes/getPosts.js";
import getPostBySlugRoute from "./routes/getPostBySlug.js";
import analyticsRoute from "./routes/patchAnalytics.js";
import insertPostRoute from "./routes/insertPost.js";

const app = express();

config();

app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH',
    credentials: true,
}));
app.use(express.json())

app.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>')
})

app.use('/all', getAllBlogsRoute);
app.use('/blog', getPostBySlugRoute);
app.use('/analytics', analyticsRoute);
app.use('/insert', insertPostRoute);

connectToPg(() => {
    app.listen(process.env.PORT, () => {
        console.log("Listening at port:", process.env.PORT)
    })
})