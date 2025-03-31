import { Router } from "express";
import { reigsterUser } from "../controllers/user.controller.js";

const userRouter = Router()
userRouter.route("/register").post(reigsterUser)


export {userRouter};