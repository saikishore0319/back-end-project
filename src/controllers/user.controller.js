import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { cloudinaryUpload } from "../utils/coludinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { userName, email, fullName, password } = req.body;

  if (email) {
    if (email.includes("@")) {
      console.log("email", email);
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

  const existingUser = User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existingUser) {
    console.log(existingUser);
    throw new ApiError(409, "User with the username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const avatarResult = await cloudinaryUpload(avatarLocalPath);
  const coverImageResult = await cloudinaryUpload(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatarResult.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refershToken"
  )

  if(!createdUser){
    throw new ApiError(500,"failed to create a user")
  }
  
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User created successfully")
  )
});

export { registerUser };
