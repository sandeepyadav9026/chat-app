import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { AuthContext } from "./AuthContext.jsx";

// eslint-disable-next-line react-refresh/only-export-components
export const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { socket, authUser, connectSocket, axios } = useContext(AuthContext);

    const [activeCall, setActiveCall] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallMuted, setIsCallMuted] = useState(false);
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);

    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const callTargetRef = useRef(null);
    const activeCallRef = useRef(null);
    const incomingCallRef = useRef(null);

    useEffect(() => {
        activeCallRef.current = activeCall;
    }, [activeCall]);

    useEffect(() => {
        incomingCallRef.current = incomingCall;
    }, [incomingCall]);

    const resetCallState = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.ontrack = null;
            peerConnectionRef.current.onicecandidate = null;
            peerConnectionRef.current.onconnectionstatechange = null;
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        if (remoteStreamRef.current) {
            remoteStreamRef.current.getTracks().forEach((track) => track.stop());
            remoteStreamRef.current = null;
        }

        pendingCandidatesRef.current = [];
        callTargetRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
        setIncomingCall(null);
        setIsCallMuted(false);
        setIsCameraEnabled(true);
    };

    const flushPendingCandidates = async () => {
        const peerConnection = peerConnectionRef.current;
        if (!peerConnection?.remoteDescription) return;

        while (pendingCandidatesRef.current.length) {
            const candidate = pendingCandidatesRef.current.shift();
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error("Failed to add queued ICE candidate", error);
            }
        }
    };

    const createPeerConnection = async (targetUserId) => {
        const { data } = await axios.get("/api/auth/ice-servers", { timeout: 10000 });
        if (!data.success) throw new Error(data.message || "Unable to load call connection settings");
        const peerConnection = new RTCPeerConnection({ iceServers: data.iceServers });
        const nextRemoteStream = new MediaStream();

        remoteStreamRef.current = nextRemoteStream;
        setRemoteStream(nextRemoteStream);
        callTargetRef.current = targetUserId;

        peerConnection.ontrack = (event) => {
            const tracks = event.streams[0]?.getTracks() || [event.track];
            tracks.forEach((track) => {
                if (nextRemoteStream.getTracks().some((existing) => existing.id === track.id)) return;
                nextRemoteStream.addTrack(track);
            });
            setRemoteStream(new MediaStream(nextRemoteStream.getTracks()));
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket && callTargetRef.current) {
                socket.emit("call:ice-candidate", {
                    to: callTargetRef.current,
                    candidate: event.candidate,
                });
            }
        };

        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;

            if (state === "connected") {
                setActiveCall((currentCall) => currentCall ? { ...currentCall, status: "connected" } : currentCall);
            }

            if (state === "failed") {
                toast.error(data.relayConfigured
                    ? "Call connection failed. Please check your network and try again."
                    : "This network needs a call relay. TURN is not configured on the server.");
                resetCallState();
            } else if (state === "disconnected") {
                setActiveCall((currentCall) => currentCall ? { ...currentCall, status: "connecting" } : currentCall);
            } else if (state === "closed") {
                resetCallState();
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        peerConnectionRef.current = peerConnection;
        return peerConnection;
    };

    const prepareLocalStream = async (callType) => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Media devices API unavailable");
        }

        if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
            throw new Error("Microphone and camera access requires HTTPS or localhost");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: callType === "video",
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCallMuted(false);
        setIsCameraEnabled(callType === "video");
        return stream;
    };

    const ensureSocketConnected = async () => {
        const liveSocket = socket?.connected ? socket : connectSocket(authUser);

        if (!liveSocket) {
            throw new Error("Socket unavailable");
        }

        if (liveSocket.connected) {
            return liveSocket;
        }

        await new Promise((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                liveSocket.off("connect", handleConnect);
                liveSocket.off("connect_error", handleError);
                reject(new Error("Socket connection timeout"));
            }, 5000);

            const handleConnect = () => {
                window.clearTimeout(timeoutId);
                liveSocket.off("connect_error", handleError);
                resolve();
            };

            const handleError = (error) => {
                window.clearTimeout(timeoutId);
                liveSocket.off("connect", handleConnect);
                reject(error || new Error("Socket connect error"));
            };

            liveSocket.once("connect", handleConnect);
            liveSocket.once("connect_error", handleError);

            if (!liveSocket.active) {
                liveSocket.connect();
            }
        });

        return liveSocket;
    };

    const getReadableCallError = (error, callType) => {
        if (!error) {
            return "Unable to start the call.";
        }

        if (error?.name === "NotAllowedError") {
            return callType === "video"
                ? "Camera and microphone permission was denied."
                : "Microphone permission was denied.";
        }

        if (error?.name === "NotFoundError") {
            return callType === "video"
                ? "No camera or microphone was found."
                : "No microphone was found.";
        }

        if (error?.name === "NotReadableError") {
            return "Your microphone or camera is being used by another app.";
        }

        if (error?.name === "AbortError") {
            return "The browser interrupted device access. Please try again.";
        }

        if (error?.name === "SecurityError") {
            return "This browser blocked access to microphone or camera.";
        }

        if (error?.name === "TypeError") {
            return "This browser does not support the required call features.";
        }

        if (String(error?.message || "").includes("timeout")) {
            return "Socket connection timed out. Please check that the backend is running.";
        }

        if (String(error?.message || "").includes("HTTPS or localhost")) {
            return "Microphone and camera access requires HTTPS or localhost.";
        }

        if (String(error?.message || "").includes("RTCPeerConnection")) {
            return "This browser does not support WebRTC calling.";
        }

        return error?.message || "Unable to start the call.";
    };

    const startCall = async (user, callType = "audio") => {
        if (!user?._id) {
            toast.error("Select a user first.");
            return;
        }

        if (activeCallRef.current || incomingCallRef.current) {
            toast.error("Finish the current call first.");
            return;
        }

        try {
            if (typeof window.RTCPeerConnection === "undefined") {
                throw new Error("RTCPeerConnection is not available in this browser");
            }

            const connectedSocket = await ensureSocketConnected();
            await prepareLocalStream(callType);
            const peerConnection = await createPeerConnection(user._id);
            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(offer);

            setActiveCall({
                user,
                callType,
                direction: "outgoing",
                status: "calling",
            });

            connectedSocket.emit("call:initiate", {
                to: user._id,
                offer,
                callType,
                caller: {
                    _id: authUser?._id,
                    fullName: authUser?.fullName || authUser?.fullname || "Unknown User",
                    profilePic: authUser?.profilePic || "",
                },
            });
        } catch (error) {
            console.error("Failed to start call", error);
            resetCallState();
            toast.error(getReadableCallError(error, callType));
        }
    };

    const acceptIncomingCall = async () => {
        if (!socket?.connected || !incomingCallRef.current) return;

        try {
            const currentIncomingCall = incomingCallRef.current;
            await prepareLocalStream(currentIncomingCall.callType);
            const peerConnection = await createPeerConnection(currentIncomingCall.from);

            await peerConnection.setRemoteDescription(new RTCSessionDescription(currentIncomingCall.offer));
            await flushPendingCandidates();

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            setActiveCall({
                user: currentIncomingCall.caller,
                callType: currentIncomingCall.callType,
                direction: "incoming",
                status: "connecting",
            });

            socket.emit("call:accept", {
                to: currentIncomingCall.from,
                answer,
            });

            setIncomingCall(null);
        } catch (error) {
            console.error("Failed to accept incoming call", error);
            toast.error(getReadableCallError(error, incomingCallRef.current?.callType));
            resetCallState();
        }
    };

    const declineIncomingCall = () => {
        if (!socket?.connected || !incomingCallRef.current) return;

        socket.emit("call:decline", {
            to: incomingCallRef.current.from,
        });

        setIncomingCall(null);
    };

    const endCall = (emitSignal = true) => {
        if (emitSignal && socket && callTargetRef.current) {
            socket.emit("call:end", {
                to: callTargetRef.current,
            });
        }

        resetCallState();
    };

    const toggleMute = () => {
        if (!localStreamRef.current) return;

        const nextMuted = !isCallMuted;
        localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !nextMuted;
        });
        setIsCallMuted(nextMuted);
    };

    const toggleCamera = () => {
        if (!localStreamRef.current) return;

        const videoTracks = localStreamRef.current.getVideoTracks();
        if (!videoTracks.length) return;

        const nextEnabled = !isCameraEnabled;
        videoTracks.forEach((track) => {
            track.enabled = nextEnabled;
        });
        setIsCameraEnabled(nextEnabled);
    };

    useEffect(() => {
        if (!socket) return undefined;

        const handleIncomingCall = (payload) => {
            if (activeCallRef.current || incomingCallRef.current) {
                socket.emit("call:decline", {
                    to: payload.from,
                });
                return;
            }

            setIncomingCall(payload);
        };

        const handleAcceptedCall = async ({ answer }) => {
            try {
                if (!peerConnectionRef.current) return;
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                await flushPendingCandidates();
                setActiveCall((currentCall) => currentCall ? { ...currentCall, status: "connecting" } : currentCall);
            } catch (error) {
                console.error("Failed to apply remote answer", error);
                toast.error("Unable to connect the call");
                resetCallState();
            }
        };

        const handleIceCandidate = async ({ candidate }) => {
            if (!candidate) return;

            try {
                if (peerConnectionRef.current?.remoteDescription) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    return;
                }
            } catch (error) {
                console.error("Failed to add ICE candidate", error);
            }

            pendingCandidatesRef.current.push(candidate);
        };

        const handleDeclinedCall = () => {
            toast.error("Call declined.");
            resetCallState();
        };

        const handleUnavailableCall = ({ reason }) => {
            if (reason === "offline") {
                toast.error("This user is offline.");
            } else {
                toast.error("This user is not available right now.");
            }
            resetCallState();
        };

        const handleEndedCall = () => {
            toast("Call ended");
            resetCallState();
        };

        socket.on("call:incoming", handleIncomingCall);
        socket.on("call:accepted", handleAcceptedCall);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:declined", handleDeclinedCall);
        socket.on("call:unavailable", handleUnavailableCall);
        socket.on("call:ended", handleEndedCall);

        return () => {
            socket.off("call:incoming", handleIncomingCall);
            socket.off("call:accepted", handleAcceptedCall);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:declined", handleDeclinedCall);
            socket.off("call:unavailable", handleUnavailableCall);
            socket.off("call:ended", handleEndedCall);
        };
    }, [socket]);

    useEffect(() => () => {
        resetCallState();
    }, []);

    const value = {
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        isCallMuted,
        isCameraEnabled,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        toggleMute,
        toggleCamera,
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};
