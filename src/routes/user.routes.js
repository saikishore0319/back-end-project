import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  userAccountDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);

//secured routers
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/update-user-details").post(verifyJWT, updateUserDetails);
userRouter
  .route("/update-user-avatar")
  .post(upload.single("avatar"), verifyJWT, updateUserAvatar);
userRouter
  .route("/update-user-coverImage")
  .post(upload.single("coverImage"), verifyJWT, updateUserCoverImage);
userRouter.route("/account-detailes").post(verifyJWT, userAccountDetails);

export { userRouter };
