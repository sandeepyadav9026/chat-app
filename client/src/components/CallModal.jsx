import { useContext, useEffect, useRef, useState } from "react";
import { FiMic, FiMicOff, FiPhone, FiVideo, FiVideoOff, FiX } from "react-icons/fi";
import { CallContext } from "../../context/CallContext.jsx";
import { getUserDisplayName, getUserInitials } from "../lib/utils.js";

function RemoteAudio({ stream }) {
    const audioRef = useRef(null);
    const [needsPlayback, setNeedsPlayback] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        audio.srcObject = stream || null;
        if (stream) {
            audio.play().then(() => setNeedsPlayback(false)).catch(() => setNeedsPlayback(true));
        }
        return () => { audio.srcObject = null; };
    }, [stream]);

    return <>
        <audio ref={audioRef} autoPlay />
        {needsPlayback && <button type="button" className="absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full bg-emerald-500 px-5 py-3 text-sm text-white" onClick={() => {
            audioRef.current.play().then(() => setNeedsPlayback(false)).catch(() => setNeedsPlayback(true));
        }}>Tap to hear call audio</button>}
    </>;
}

function MediaTile({ label, stream, profilePic, fallbackText, isVideoEnabled, isLocal = false }) {
    const videoRef = useRef(null);
    const hasVideoTrack = Boolean(stream?.getVideoTracks?.().length);
    const showVideo = Boolean(hasVideoTrack && isVideoEnabled);

    useEffect(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream || null;
        if (stream) videoRef.current.play().catch(() => {});
    }, [stream, showVideo]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70">
            {showVideo ? (
                <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${isLocal ? "-scale-x-100" : ""}`} />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(3,7,18,0.98))]">
                    {profilePic ? (
                        <img src={profilePic} alt="" className="h-24 w-24 rounded-[28px] object-cover" />
                    ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-semibold text-slate-950">
                            {fallbackText}
                        </div>
                    )}
                    <p className="text-sm text-slate-300">{showVideo ? "Live video" : "Audio mode"}</p>
                </div>
            )}
            <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white backdrop-blur">
                {label}
            </div>
        </div>
    );
}

function CallModal() {
    const {
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        isCallMuted,
        isCameraEnabled,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        toggleMute,
        toggleCamera,
    } = useContext(CallContext);

    if (!activeCall && !incomingCall) {
        return null;
    }

    if (incomingCall && !activeCall) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#091223] p-6 text-center shadow-[0_30px_120px_rgba(2,8,23,0.65)]">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-300 to-blue-500 text-2xl font-semibold text-slate-950">
                        {getUserInitials(incomingCall.caller)}
                    </div>
                    <p className="mt-5 text-xs uppercase tracking-[0.3em] text-cyan-200/70">Incoming {incomingCall.callType} call</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">{getUserDisplayName(incomingCall.caller)}</h2>
                    <p className="mt-3 text-sm text-slate-400">Accept karte hi microphone {incomingCall.callType === "video" ? "aur camera " : ""}permission use hogi.</p>

                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={declineIncomingCall}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white transition hover:scale-[1.02]"
                        >
                            <FiX size={22} />
                        </button>
                        <button
                            type="button"
                            onClick={acceptIncomingCall}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:scale-[1.02]"
                        >
                            <FiPhone size={22} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const callUser = activeCall?.user;
    const isVideoCall = activeCall?.callType === "video";
    const statusLabel = activeCall?.status === "connected"
        ? "Connected"
        : activeCall?.status === "connecting"
            ? "Connecting..."
            : "Ringing...";

    return (
        <div role="dialog" aria-modal="true" aria-label={`${isVideoCall ? "Video" : "Voice"} call`} className="fixed inset-0 z-50 bg-slate-950/95 sm:p-4 backdrop-blur-sm">
            <RemoteAudio stream={remoteStream} />
            <div className="mx-auto flex h-full max-w-6xl flex-col sm:rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,28,0.96),rgba(9,18,35,0.94))] p-4 sm:p-5 shadow-[0_30px_120px_rgba(2,8,23,0.7)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{isVideoCall ? "Video call" : "Voice call"}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{getUserDisplayName(callUser)}</h2>
                        <p className="mt-2 text-sm text-slate-400">{statusLabel}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => endCall(true)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                    >
                        Close
                    </button>
                </div>

                <div className="relative mt-4 min-h-0 flex-1">
                    <MediaTile
                        label={getUserDisplayName(callUser)}
                        stream={remoteStream}
                        profilePic={callUser?.profilePic || ""}
                        fallbackText={getUserInitials(callUser)}
                        isVideoEnabled={isVideoCall}
                    />
                    {isVideoCall && <div className="absolute right-3 top-3 h-40 w-28 overflow-hidden rounded-2xl shadow-xl sm:h-52 sm:w-36">
                        <MediaTile label="You" stream={localStream} fallbackText="You" isVideoEnabled={isCameraEnabled} isLocal />
                    </div>}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={toggleMute}
                        className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm transition ${isCallMuted ? "bg-amber-400 text-slate-950" : "border border-white/10 bg-white/5 text-white"}`}
                    >
                        {isCallMuted ? <FiMicOff size={18} /> : <FiMic size={18} />}
                        {isCallMuted ? "Unmute" : "Mute"}
                    </button>

                    {isVideoCall && (
                        <button
                            type="button"
                            onClick={toggleCamera}
                            className={`flex items-center gap-2 rounded-full px-5 py-3 text-sm transition ${!isCameraEnabled ? "bg-amber-400 text-slate-950" : "border border-white/10 bg-white/5 text-white"}`}
                        >
                            {isCameraEnabled ? <FiVideo size={18} /> : <FiVideoOff size={18} />}
                            {isCameraEnabled ? "Camera on" : "Camera off"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => endCall(true)}
                        className="flex items-center gap-2 rounded-full bg-rose-500 px-5 py-3 text-sm text-white transition hover:scale-[1.02]"
                    >
                        <FiPhone size={18} className="rotate-[135deg]" />
                        End call
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CallModal;
