// ---------- Dependencies ----------
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

// ---------- Components ----------
const { albumRouter } = require("./_routes/albumRouter");
const { authRouter } = require("./_routes/authRouter");
const { songRouter } = require("./_routes/songRouter");

// ---------- Express app initialization ----------
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Database ----------
const mongoose = require("mongoose");
const uri = process.env.URI;
mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");

        app.listen(port, () => {
            console.log("Listening at http://localhost:" + port);
        });
    })
    .catch((err) => console.log(err));

// ---------- API Routes ----------
app.use("/api/album", albumRouter);
app.use("/api/auth", authRouter);
app.use("/api/song", songRouter);
