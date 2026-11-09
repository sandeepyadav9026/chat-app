import express from "express";
import { deleteAiMessage, getAiMessages, sendAiMessage } from "../controllers/aiController.js";
import { protectRoute } from "../middleware/auth.js";

const aiRouter = express.Router();

aiRouter.get("/messages", protectRoute, getAiMessages);
aiRouter.post("/chat", protectRoute, sendAiMessage);
aiRouter.delete("/messages/:id", protectRoute, deleteAiMessage);

export default aiRouter;
