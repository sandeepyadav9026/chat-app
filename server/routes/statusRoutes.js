import express from "express";
import { createStatus, deleteStatus, getStatuses } from "../controllers/statusController.js";
import { protectRoute } from "../middleware/auth.js";

const statusRouter = express.Router();

statusRouter.get("/", protectRoute, getStatuses);
statusRouter.post("/", protectRoute, createStatus);
statusRouter.delete("/:id", protectRoute, deleteStatus);

export default statusRouter;
