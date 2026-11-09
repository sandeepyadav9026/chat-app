import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { getIceConfiguration } from "./ice.js";

test("direct calling remains available without a relay", () => {
    const config = getIceConfiguration("user", {});
    assert.equal(config.relayConfigured, false);
    assert.equal(config.iceServers.length, 1);
});
test("TURN credentials include UDP, TCP and TLS addresses", () => {
    const config = getIceConfiguration("user", {
        TURN_URLS: "turn:relay.example:3478, turn:relay.example:3478?transport=tcp,turns:relay.example:443?transport=tcp",
        TURN_USERNAME: "test-user", TURN_CREDENTIAL: "test-password",
    });
    assert.equal(config.relayConfigured, true);
    assert.equal(config.iceServers[1].urls.length, 3);
    assert.equal(config.iceServers[1].username, "test-user");
});
test("shared secret generates expiring credentials without exposing the secret", () => {
    const config = getIceConfiguration("user", { TURN_URLS: "turn:relay.example:3478", TURN_SHARED_SECRET: "test-secret" }, 1000000);
    assert.equal(config.iceServers[1].username, "4600:user");
    assert.equal(config.iceServers[1].credential, createHmac("sha1", "test-secret").update("4600:user").digest("base64"));
    assert.equal(JSON.stringify(config).includes("test-secret"), false);
});
test("rejects malformed or incomplete relay settings", () => {
    assert.throws(() => getIceConfiguration("user", { TURN_URLS: "https://example.com" }));
    assert.throws(() => getIceConfiguration("user", { TURN_URLS: "turn:relay.example:3478" }));
});
