import Status from "../models/Status.js";
import { destroyImage, uploadBase64Image } from "../lib/media.js";

export const getStatuses = async (req, res) => {
    try {
        const now = new Date();
        const statuses = await Status.find({ expiresAt: { $gt: now } })
            .populate("userId", "fullname profilePic bio")
            .sort({ createdAt: -1 });

        const grouped = statuses.reduce((acc, status) => {
            const ownerId = status.userId?._id?.toString();
            if (!ownerId) return acc;

            if (!acc[ownerId]) {
                acc[ownerId] = {
                    user: status.userId,
                    items: [],
                };
            }

            acc[ownerId].items.push(status);
            return acc;
        }, {});

        res.json({
            success: true,
            statuses: Object.values(grouped),
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const createStatus = async (req, res) => {
    try {
        const { text = "", image = "" } = req.body;
        const userId = req.user._id;

        if (!text.trim() && !image) {
            return res.json({ success: false, message: "Add text or an image to your status" });
        }

        let imageUrl = "";
        let imagePublicId = "";

        if (image) {
            const uploadedImage = await uploadBase64Image(image, "quickchat/statuses");
            imageUrl = uploadedImage.secureUrl;
            imagePublicId = uploadedImage.publicId;
        }

        const status = await Status.create({
            userId,
            text: text.trim(),
            image: imageUrl,
            imagePublicId,
        });

        await status.populate("userId", "fullname profilePic bio");

        res.json({ success: true, status });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = await Status.findById(id);

        if (!status) {
            return res.json({ success: false, message: "Status not found" });
        }

        if (status.userId.toString() !== req.user._id.toString()) {
            return res.json({ success: false, message: "You can delete only your own status" });
        }

        if (status.imagePublicId) {
            await destroyImage(status.imagePublicId);
        }

        await Status.findByIdAndDelete(id);

        res.json({ success: true, statusId: id });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
