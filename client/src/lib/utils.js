export function formatMessageTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function formatMessageDate(date) {
    if (!date) return "";

    const messageDate = new Date(date);
    const today = new Date();
    const isToday = messageDate.toDateString() === today.toDateString();

    if (isToday) return "Today";

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return messageDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export function formatRelativeTime(date) {
    if (!date) return "";

    const seconds = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 1000));

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

    return `${Math.floor(seconds / 86400)}d ago`;
}

export function getUserDisplayName(user) {
    if (user?.isGroup) return user?.name || "Unnamed group";
    return user?.fullName || user?.fullname || "Unknown user";
}

export function getUserInitials(user) {
    const displayName = getUserDisplayName(user);

    return displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

export function isGroupChat(user) {
    return Boolean(user?.isGroup);
}

export const AI_CONTACT_ID = "pulse-ai-assistant";

export const AI_CONTACT = {
    _id: AI_CONTACT_ID,
    fullName: "Pulse AI",
    bio: "Plan, rewrite, summarize, and get quick help without leaving your chats.",
    isAI: true,
};

export function isAiUser(user) {
    return Boolean(user?.isAI || user?._id === AI_CONTACT_ID);
}
