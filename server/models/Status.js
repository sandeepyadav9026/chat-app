import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, default: "" },
        image: { type: String, default: "" },
        imagePublicId: { type: String, default: "" },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

const Status = mongoose.model("Status", statusSchema);

export default Status;
