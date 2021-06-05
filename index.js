// Import Dependancies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const { albumRouter } = require("./routes/albumRouter");
const { authRouter } = require("./routes/authRouter");
const { songRouter } = require("./routes/songRouter");

// Database
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

// =============== API Routes ===============
app.use("/api/album", albumRouter);
app.use("/api/auth", authRouter);
app.use("/api/song", songRouter);
