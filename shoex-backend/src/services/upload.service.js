const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const base64 = fileBuffer.toString("base64");
    const dataUri = `data:${mimetype};base64,${base64}`;

    cloudinary.uploader.upload(
      dataUri,
      {
        folder: "shoex/products",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          key: result.public_id,
        });
      }
    );
  });
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`✅ Image deleted: ${publicId}`);
  } catch (error) {
    console.error("❌ Image delete error:", error.message);
  }
};

module.exports = { uploadImage, deleteImage };