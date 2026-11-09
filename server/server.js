import 'dotenv/config';
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import statusRouter from "./routes/statusRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creae Express app and HTTP server
const app = express();
const server = http.createServer(app) ;  

const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOriginResolver = (origin, callback) => {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error("Not allowed by CORS"));
};

// Initialize socket.io server
export const io = new Server (server, {
    cors: {
        origin: allowedOrigins.length ? allowedOrigins : true,
        credentials: true,
    }
})

//store online users
export const userSocketMap = {};
 
//socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query?.userId;
    
    if (userId) {
        console.log("User connected", userId);
        userSocketMap[userId] = socket.id;
        
        //Emit online users to all connected clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        socket.on("call:initiate", ({ to, offer, callType, caller }) => {
            const receiverSocketId = userSocketMap[to];
            if (!receiverSocketId) {
                socket.emit("call:unavailable", {
                    to,
                    reason: "offline",
                });
                return;
            }

            io.to(receiverSocketId).emit("call:incoming", {
                from: userId,
                offer,
                callType,
                caller,
            });
        });

        socket.on("call:accept", ({ to, answer }) => {
            const callerSocketId = userSocketMap[to];
            if (callerSocketId) {
                io.to(callerSocketId).emit("call:accepted", {
                    from: userId,
                    answer,
                });
            }
        });

        socket.on("call:ice-candidate", ({ to, candidate }) => {
            const peerSocketId = userSocketMap[to];
            if (peerSocketId) {
                io.to(peerSocketId).emit("call:ice-candidate", {
                    from: userId,
                    candidate,
                });
            }
        });

        socket.on("call:decline", ({ to }) => {
            const callerSocketId = userSocketMap[to];
            if (callerSocketId) {
                io.to(callerSocketId).emit("call:declined", {
                    from: userId,
                });
            }
        });

        socket.on("call:end", ({ to }) => {
            const peerSocketId = userSocketMap[to];
            if (peerSocketId) {
                io.to(peerSocketId).emit("call:ended", {
                    from: userId,
                });
            }
        });
        
        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`User ${userId} disconnected:`, reason);
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                io.emit("getOnlineUsers", Object.keys(userSocketMap));
            }
        });

        // Handle errors
        socket.on("error", (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    } else {
        console.warn("Connection attempt without userId");
        socket.disconnect(true);
    }
})



// Middleware   setup

app.use(express.json({limit: "4mb"}));
app.use(cors({
    origin: corsOriginResolver,
    credentials: true,
}));

//Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/statuses", statusRouter);
app.use("/api/ai", aiRouter);




// connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}
export default server;
