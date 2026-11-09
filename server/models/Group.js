import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    image: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

export default Group;
