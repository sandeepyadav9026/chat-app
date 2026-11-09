import express from "express";
import { login, signup, updateProfile, checkAuth } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
import { getIceConfiguration } from "../lib/ice.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.get("/ice-servers", protectRoute, (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        res.json({ success: true, ...getIceConfiguration(String(req.user._id)) });
    } catch (error) {
        console.error("Invalid TURN configuration:", error.message);
        res.status(503).json({ success: false, message: "Call relay configuration is unavailable" });
    }
});

export default userRouter;
