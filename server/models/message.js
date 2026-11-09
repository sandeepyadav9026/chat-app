import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
    senderId:{type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    receiverId:{type: mongoose.Schema.Types.ObjectId, ref: "User", default: null},
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
    chatType: { type: String, enum: ["direct", "group"], default: "direct" },
    text: {type: String},
    image: {type: String, },
    imagePublicId: {type: String, default: ""},
    seen: {type: Boolean, default: false},
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, {timestamps: true});


 const Message = mongoose.model("message", messageSchema);

 
 export default Message;
