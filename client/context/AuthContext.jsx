import { createContext, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import {toast} from 'react-hot-toast'
import { io} from "socket.io-client";
import { useState } from "react";


const configuredBackendUrl = (import.meta.env.VITE_BACKEND_URL || "").trim().replace(/\/+$/, "");
const backendUrl = configuredBackendUrl || "";

console.log('Resolved VITE_BACKEND_URL =', backendUrl);
axios.defaults.baseURL = backendUrl;

// Context and its provider intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();
export const AuthProvider = ({children}) => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser,setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(localStorage.getItem("token")));
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const socketRef = useRef(null);
    const authUserRef = useRef(null);

    useEffect(() => {
        authUserRef.current = authUser;
    }, [authUser]);
     


    //check if user is authenticated and if so,set the user data and connect the socket

    const connectSocket = useCallback((userData = authUserRef.current) => {
        const resolvedUser = userData || authUserRef.current;

        const existingSocket = socketRef.current;

        if (!resolvedUser) {
            return existingSocket || null;
        }

        if (existingSocket?.io?.opts?.query?.userId === resolvedUser._id) {
            if (!existingSocket.connected && !existingSocket.active) {
                existingSocket.connect();
            }
            return existingSocket;
        }

        if (existingSocket) {
            existingSocket.off("connect");
            existingSocket.off("disconnect");
            existingSocket.off("connect_error");
            existingSocket.off("getOnlineUsers");
            existingSocket.disconnect();
        }

        const newSocket = io(backendUrl, {
            path: "/socket.io",
            withCredentials: true,
            autoConnect: false,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000,
            query: {
                userId: resolvedUser._id,
            }
        });

        newSocket.on("connect", () => {
            console.log("Socket connected", newSocket.id, "for user", resolvedUser._id);
            setIsSocketConnected(true);
        });

        newSocket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setIsSocketConnected(false);
        });

        newSocket.on("connect_error", (error) => {
            console.error("Socket connect error:", error);
            setIsSocketConnected(false);
        });

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        newSocket.connect();
        socketRef.current = newSocket;
        setSocket(newSocket);
        return newSocket;
    }, []);

    const checkAuth = useCallback(async(signal) => {
        if (!token) {
            setIsCheckingAuth(false);
            return;
        }

        try{
            const{data} = await axios.get("/api/auth/check", { signal });
            if (signal?.aborted) return;
            if (data.success) {
                setAuthUser(data.user)
                connectSocket(data.user);
            } else {
                setAuthUser(null);
                localStorage.removeItem("token");
                delete axios.defaults.headers.common.token;
                setToken(null);
            }
        }catch(error){
            if (signal?.aborted) return;
            console.log("error Massage" ,error);
            setAuthUser(null);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                delete axios.defaults.headers.common.token;
                setToken(null);
            } else {
                toast.error("Unable to reach the server. Please try again.");
            }
        } finally {
            if (!signal?.aborted) setIsCheckingAuth(false);
        }
    }, [token, connectSocket]);
// login funtion to handle user authentication and socket connection
    const login = async(state,credentials) => {
        try{
            const { data } = await axios.post(`/api/auth/${state}`,credentials);    
            if(data.success){
                setAuthUser(data.userData);
                axios.defaults.headers.common["token"] = data.token;
                setToken(data.token);
                localStorage.setItem("token",data.token);
                toast.success(data.message);
                return true;
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || "Unable to sign in. Check that the server is running.")
        }
        return false;
    }

    //logout function to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        authUserRef.current = null;
        setOnlineUsers([]);
        setIsSocketConnected(false);
        delete axios.defaults.headers.common.token;
        toast.success("Logged out successfully");
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocket(null);
    }

     //update profile funs=ction to handle user profile update
    const updateProfile = async (body) => {
        setIsUpdatingProfile(true);
        try{
            const { data } = await axios.put("/api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                return true;
            }
            toast.error(data.message);
            return false;
        }catch(error){
            toast.error(error.message);
            return false;
        } finally {
            setIsUpdatingProfile(false);
        }
    }

    //connect socket funstion to handle socket connection and online users updates
    // const connectSocket = (userData) => {
    //     if(!userData || socket?.connected) return;
    //     const newSocket = io(backendUrl, {
    //         query: {
                
    //             userId: userData._id,
    //         }
    //     });
    //     newSocket.connect();
    //     setSocket(newSocket);

    //     newSocket.on("getOnlineUsers", (userIds) => {
    //         setOnlineUsers(userIds);
    //     })
    // }    
    useEffect(() => {
        const controller = new AbortController();
        if(token){
            axios.defaults.headers.common["token"] = token;
        } else {
            delete axios.defaults.headers.common.token;
        }
        checkAuth(controller.signal);
        return () => controller.abort();
        },[token, checkAuth])

    useEffect(() => {
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);


    const value={
        axios,
        authUser,
        onlineUsers,
        socket,
        isSocketConnected,
        connectSocket,
        isCheckingAuth,
        isUpdatingProfile,
        login,
        logout,
        updateProfile
    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider> 


    )
}

    
