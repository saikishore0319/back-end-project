import {asyncHandler} from "../utils/asyncHandler.js";

const reigsterUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { reigsterUser };