import express from "express";
import { createGroup, deleteMessage, getGroupMessages, getMessages, getUsersForSidebar, markMessageAsSeen, sendGroupMessage, sendMessage } from "../controllers/messageController.js";
import { protectRoute } from "../middleware/auth.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/group/:id", protectRoute, getGroupMessages);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/groups", protectRoute, createGroup);
messageRouter.post("/group/send/:id", protectRoute, sendGroupMessage);
messageRouter.post("/send/:id", protectRoute, sendMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);

export default messageRouter;
