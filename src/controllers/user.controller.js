import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload, cloudinaryDelete } from "../utils/coludinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

/**
 * The function generates access and refresh tokens for a user based on their ID.
 * @param userId - The `userId` parameter is the unique identifier of a user for whom we want to
 * generate access and refresh tokens. It is used to find the user in the database and generate tokens
 * for that specific user.
 * @returns The `generateAccesssAndRefreshToken` function returns an object containing the access token
 * and refresh token generated for the user.
 */
const generateAccesssAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;
  console.log(req.body);

  if (email) {
    if (email.includes("@")) {
      // console.log("email", email);
    } else {
      throw new ApiError(400, "enter a valid email address");
    }
  } else {
    throw new ApiError(400, "please enter an email adderss");
  }
  if (!userName) {
    throw new ApiError(400, "please enter a user name");
  } else {
    console.log("User Name", userName);
  }
  if (!password) {
    throw new ApiError(400, "please enter a password");
  }
  if (!fullName) {
    throw new ApiError(400, "please enter a full name");
  } else {
    console.log("Full Name", fullName);
  }

  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existingUser) {
    console.log(existingUser);
    throw new ApiError(409, "User with the username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const avatarResult = await cloudinaryUpload(avatarLocalPath);
  const coverImageResult = await cloudinaryUpload(coverImageLocalPath);

  if (!avatarResult) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarResult.url,
    coverImage: coverImageResult?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "failed to create a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // const { email, userName, password } = req.body;

  const email = req.body.email;
  const userName = req.body.userName;
  const password = req.body.password;

  console.log(email);
  console.log(userName), console.log("body of thr request ", req.body);

  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });
  console.log("The user is ", user);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("is password valid ", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccesssAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  /* The `const options` object is used to specify the options for setting cookies in the HTTP
  response. In this case, the options are set as follows: */
  /* `httpOnly` is set to true to prevent client-side JavaScript from accessing the cookie. `secure` is set to true to
  ensure that the cookie is only sent over HTTPS connections. */
  const options = {
    httpOnly: true,
    secure: true,
  };

  /* The function first checks if the user exists in the database using either their email or username.
  If the user is found, it then checks if the provided password is correct using the `isPasswordCorrect`
  method. If the password is valid, it generates access and refresh tokens using the `generateAccesssAndRefreshToken`
  function. The access token and refresh token are then set as cookies in the HTTP response using the `res.cookie`
  method. Finally, it returns a JSON response containing the logged-in user, access token, and refresh token. */

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access ");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      throw new ApiError(403, "Invalid token");
    }
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid user token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccesssAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "User's access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "something went wrong while refreshing the access token"
    );
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }
  user.password = newpassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  // console.log("here");

  if (!(fullName || email)) {
    throw new ApiError(
      400,
      "please enter full name or email to update user details"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;

  const user = await User.findById(req.user?._id).select("avatar");
  // console.log(user)
  const cloudinaryUrl = user?.avatar; // Access the avatar field
  // console.log(cloudinaryUrl);

  if (!localPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  const avatar = await cloudinaryUpload(localPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar image");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  if (cloudinaryUrl) {
    const response = await cloudinaryDelete(cloudinaryUrl);
    console.log(response);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "user updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localPath = req.file?.path;

  const coverimg = await User.findById(req.user._id).select("coverImage");
  const cloudinaryUrl = coverimg?.coverImage;
  if (!localPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  const coverImage = await cloudinaryUpload(localPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading Cover image");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  if (cloudinaryUrl) {
    cloudinaryDelete(cloudinaryUrl);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "user updated successfully"));
});

const userAccountDetails = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  console.log(req.params)
  if (!userName?.trim()) {
    throw new ApiError(400, "user is not found");
  }

  const channel = await User.aggregate([
    /* The below code is a MongoDB aggregation pipeline stage using the  operator to filter
   documents based on the value of the "userName" field. It is checking if the "userName" field is
   equal to the value of the variable "username" converted to lowercase using the optional chaining
   operator (?.). */
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    /* The below code is using the `` aggregation pipeline stage in MongoDB to perform a left
   outer join between the current collection (presumably a collection of channels) and the
   "subscriptions" collection. It is matching documents where the `_id` field in the current
   collection matches the `channel` field in the "subscriptions" collection. The result of this
   operation is stored in a new field called "subscribers" in the output documents. */
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subcribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          if: { $in: [req.user?.id, "$subscribers.subscriber"] },
          then: true,
          else: false,
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        channelsSubscribedTo: 1,
        isSubscribed: 1,
        subcribersCount: 1,
        coverImage: 1,
        email: 1
      },
    },
  ]);

  console.log(channel)

  if(!channel?.length){
    throw new ApiError(404, "channel does not exist")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "User channel fetched successfully"))
});


const getWatchHistroy = asyncHandler(async(req, res)=>{

  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    userName:1,
                    avatar: 1,
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  if(!user.length){
    console.log("User not found");
    throw new ApiError(404, "User not found")
  }

  return res
  .status(200)
  .json( new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully "))
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  userAccountDetails,
  getWatchHistroy,
};
