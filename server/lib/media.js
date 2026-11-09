import cloudinary from "./cloudinary.js";

export const uploadBase64Image = async (base64Image, folder) => {
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder,
        resource_type: "image",
        quality: "auto:good",
        fetch_format: "auto",
    });

    return {
        secureUrl: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
    };
};

export const destroyImage = async (publicId) => {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
        });
    } catch (error) {
        console.error("Failed to delete Cloudinary asset:", error.message || error);
    }
};
