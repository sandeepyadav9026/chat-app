import { createHmac } from "node:crypto";

export function getIceConfiguration(userId, env = process.env, now = Date.now()) {
    const iceServers = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
    const urls = (env.TURN_URLS || "").split(",").map((url) => url.trim()).filter(Boolean);
    if (urls.some((url) => !/^turns?:[^\s]+$/i.test(url))) {
        throw new Error("TURN_URLS must contain turn: or turns: server addresses");
    }
    if (urls.length) {
        let username = env.TURN_USERNAME;
        let credential = env.TURN_CREDENTIAL;
        if (env.TURN_SHARED_SECRET) {
            username = `${Math.floor(now / 1000) + 3600}:${userId}`;
            credential = createHmac("sha1", env.TURN_SHARED_SECRET).update(username).digest("base64");
        }
        if (!username || !credential) throw new Error("TURN credentials are not configured");
        iceServers.push({ urls, username, credential });
    }
    return { iceServers, relayConfigured: iceServers.length > 1 };
}
