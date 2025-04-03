import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
    api_key: process.env.CLOUDINARY_API_KEY,   // Click 'Create' above to get your API key, 
    api_secret: process.env.CLOUDINARY_API_SECRET
     // Click 'View API Keys' above to copy your API secret
});

const cloudinaryUpload = async(localFilepath)=>{
    try {
        if(!localFilepath) return null;
        //upload file to cloudinary
       /* The code snippet you provided is a function named `cloudinaryUpload` that uploads a file
       located at the `localFilepath` to Cloudinary using the Cloudinary SDK. Here is a breakdown of
       what the code is doing: */
        const response = await cloudinary.uploader.upload(localFilepath,{
            resource_type: 'auto',
        })
        //file upload done successfully
        console.log(response.url);
        console.log(response)
        fs.unlinkSync(localFilepath)
        return response;    
    } catch (error) {
        /* `fs.unlinkSync(localFilepath)` is a method in Node.js that synchronously removes the file
        specified by the `localFilepath`. In this context, it is used in the catch block of the
        `cloudinaryUpload` function to delete the local file if an error occurs during the file
        upload process to Cloudinary. This helps in cleaning up any temporary files that were
        created during the upload process. */
        fs.unlinkSync(localFilepath)
        return null;
    }
}

export{cloudinaryUpload}