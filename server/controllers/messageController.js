import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/message.js";
import { io, userSocketMap } from "../server.js";
import { destroyImage, uploadBase64Image } from "../lib/media.js";

const normalizeUser = (user) => {
    if (!user) return null;

    return {
        _id: user._id,
        fullname: user.fullname,
        fullName: user.fullname,
        profilePic: user.profilePic || "",
        bio: user.bio || "",
    };
};

const normalizeGroup = (group) => {
    if (!group) return null;

    return {
        _id: group._id,
        name: group.name,
        bio: group.bio || "",
        image: group.image || "",
        isGroup: true,
        members: Array.isArray(group.members) ? group.members.map(normalizeUser).filter(Boolean) : [],
        admins: Array.isArray(group.admins) ? group.admins.map((member) => String(member?._id || member)).filter(Boolean) : [],
        createdBy: String(group.createdBy?._id || group.createdBy || ""),
    };
};

const emitToUsers = (userIds, eventName, payload, excludedUserIds = []) => {
    const excluded = new Set(excludedUserIds.map(String));

    userIds.forEach((userId) => {
        const normalizedUserId = String(userId);
        if (excluded.has(normalizedUserId)) return;

        const socketId = userSocketMap[normalizedUserId];
        if (socketId) {
            io.to(socketId).emit(eventName, payload);
        }
    });
};

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");
        const groups = await Group.find({ members: userId })
            .populate("members", "fullname profilePic bio")
            .populate("admins", "_id")
            .populate("createdBy", "_id");

        const unseenMessages = {};

        await Promise.all(
            filteredUsers.map(async (user) => {
                const unseenCount = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: userId,
                    chatType: "direct",
                    seen: false,
                });

                if (unseenCount > 0) {
                    unseenMessages[user._id] = unseenCount;
                }
            })
        );

        await Promise.all(
            groups.map(async (group) => {
                const unseenCount = await Message.countDocuments({
                    groupId: group._id,
                    chatType: "group",
                    senderId: { $ne: userId },
                    seenBy: { $ne: userId },
                });

                if (unseenCount > 0) {
                    unseenMessages[group._id] = unseenCount;
                }
            })
        );

        res.json({
            success: true,
            users: [...filteredUsers.map(normalizeUser), ...groups.map(normalizeGroup)],
            unseenMessages,
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId, chatType: "direct" },
                { senderId: selectedUserId, receiverId: myId, chatType: "direct" },
            ],
        }).sort({ createdAt: 1 });

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId, chatType: "direct" },
            { seen: true }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const myId = req.user._id;
        const group = await Group.findOne({ _id: groupId, members: myId })
            .populate("members", "fullname profilePic bio")
            .populate("admins", "_id")
            .populate("createdBy", "_id");

        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        const messages = await Message.find({ groupId, chatType: "group" })
            .sort({ createdAt: 1 })
            .populate("senderId", "fullname profilePic");

        await Message.updateMany(
            { groupId, chatType: "group", senderId: { $ne: myId }, seenBy: { $ne: myId } },
            { $addToSet: { seenBy: myId } }
        );

        res.json({ success: true, messages, group: normalizeGroup(group) });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();
        const message = await Message.findById(id);

        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        if (message.senderId.toString() !== userId) {
            return res.json({ success: false, message: "You can delete only your own messages" });
        }

        if (message.imagePublicId) {
            await destroyImage(message.imagePublicId);
        }

        await Message.findByIdAndDelete(id);

        if (message.chatType === "group" && message.groupId) {
            const group = await Group.findById(message.groupId).select("members");
            if (group) {
                emitToUsers(group.members, "messageDeleted", {
                    messageId: id,
                    groupId: String(message.groupId),
                    senderId: userId,
                }, [userId]);
            }
        } else if (message.receiverId) {
            const receiverSocketId = userSocketMap[message.receiverId.toString()];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", { messageId: id, senderId: userId });
            }
        }

        res.json({ success: true, messageId: id });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl = "";
        let imagePublicId = "";
        if (image) {
            const uploadResponse = await uploadBase64Image(image, "quickchat/messages");
            imageUrl = uploadResponse.secureUrl;
            imagePublicId = uploadResponse.publicId;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            chatType: "direct",
            text,
            image: imageUrl,
            imagePublicId,
        });

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            const messagePayload = newMessage.toObject ? newMessage.toObject() : newMessage;
            io.to(receiverSocketId).emit("newMessage", messagePayload);
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { name, memberIds = [] } = req.body;
        const currentUserId = req.user._id.toString();

        if (!name?.trim()) {
            return res.json({ success: false, message: "Group name is required" });
        }

        const uniqueMemberIds = [...new Set([currentUserId, ...memberIds.map(String)])];

        if (uniqueMemberIds.length < 2) {
            return res.json({ success: false, message: "Add at least one member" });
        }

        const validUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select("_id");
        if (validUsers.length !== uniqueMemberIds.length) {
            return res.json({ success: false, message: "One or more members are invalid" });
        }

        const group = await Group.create({
            name: name.trim(),
            createdBy: currentUserId,
            admins: [currentUserId],
            members: uniqueMemberIds,
        });

        const populatedGroup = await Group.findById(group._id)
            .populate("members", "fullname profilePic bio")
            .populate("admins", "_id")
            .populate("createdBy", "_id");

        const normalizedGroup = normalizeGroup(populatedGroup);
        emitToUsers(uniqueMemberIds, "groupCreated", normalizedGroup);

        res.json({ success: true, group: normalizedGroup });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const groupId = req.params.id;
        const senderId = req.user._id;
        const group = await Group.findOne({ _id: groupId, members: senderId }).select("members");

        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        let imageUrl = "";
        let imagePublicId = "";
        if (image) {
            const uploadResponse = await uploadBase64Image(image, "quickchat/messages");
            imageUrl = uploadResponse.secureUrl;
            imagePublicId = uploadResponse.publicId;
        }

        const newMessage = await Message.create({
            senderId,
            groupId,
            chatType: "group",
            text,
            image: imageUrl,
            imagePublicId,
            seenBy: [senderId],
        });

        const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullname profilePic");
        emitToUsers(group.members, "newGroupMessage", {
            ...(populatedMessage?.toObject ? populatedMessage.toObject() : populatedMessage),
            groupId: String(groupId),
        }, [String(senderId)]);

        res.json({ success: true, newMessage: populatedMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
