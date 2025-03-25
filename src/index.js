import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT}`); // server is listening on port 8000 if not specified in .env file
    });
  })
  .catch((error) => {
    console.log("Connection to the database failed", error);
  });
