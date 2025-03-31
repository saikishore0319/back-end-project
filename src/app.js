import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

/* This code snippet is setting up CORS (Cross-Origin Resource Sharing) configuration for the Express
application. */
app.use(
  cors({
    //app.use is used for usiing middlewares
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());



import {userRouter} from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter)


export { app };
