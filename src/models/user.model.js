import { Schema, model } from "mongoose";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/* This code snippet is a Mongoose middleware function that runs before saving a user document to the
database. Specifically, it is a pre-save hook that checks if the password field of the user document
has been modified. If the password has been modified, it hashes the password using bcrypt with a
cost factor of 10 before saving it to the database. This ensures that the password is securely
hashed before being stored in the database. */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  } else {
    this.password = await hash(this.password, 10);
    next();
  }
});

/* This code snippet is defining a method called `isPasswordCorrect` on the `userSchema.methods`
object. This method is used to compare a plain text password input with the hashed password stored
in the user document. */
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    userName: this.userName,
    email: this.email,
    fullName: this.fullName,
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,  
  }
);
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,  
  }
);
};


export const User = model("User", userSchema);
