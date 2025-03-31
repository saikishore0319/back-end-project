import multer from "multer";

/* This code snippet is configuring the storage settings for file uploads using the `multer` middleware
in a Node.js application. Here's a breakdown of what each part does: */
const storage = multer.diskStorage({
   /* The `destination` function in the `multer.diskStorage` configuration is specifying the directory
   where uploaded files will be stored on the server. In this case, it is set to "../public/temp",
   which means that uploaded files will be saved in the "temp" directory within the "public"
   directory. The `cb` function is a callback that needs to be called once the destination directory
   is determined. */
    destination: function (req, file, cb) {
      cb(null, "../public/temp")
    },
    /* The `filename` function in the `multer.diskStorage` configuration is specifying how the uploaded
    file should be named when it is saved on the server. In this case, the function is using
    `file.originalname` to keep the original name of the uploaded file. The `cb` function is a
    callback that needs to be called once the new filename is determined. */
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ 
    storage,
 })

