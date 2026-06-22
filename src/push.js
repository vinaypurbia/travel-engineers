// Travel Engineers — Push notification helpers (frontend)
// Plain JS, no React dependency, so it's safe to import from anywhere
// (App.jsx, BookingExtensions.jsx) without circular-import concerns.

const API = "/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

// NOTE: service worker registration is already handled in index.html on
// window load, registering the real /service-worker.js (which already has
// push + notificationclick handlers, plus offline caching). This file does
// NOT register a service worker itself — doing so here too would either be
// a harmless no-op (if pointed at the same URL) or, worse, register a
// second/wrong one. subscribeToPush() below just waits for whichever
// registration is already active via navigator.serviceWorker.ready.

// Returns "granted" | "denied" | "default" | "unsupported" without
// prompting — use this to decide whether to show a "Notifications enabled"
// vs "Enable notifications" button state.
export function getPushPermissionState() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Actually prompts for permission (if not already decided) and creates a
// push subscription, then registers it with the backend.
// ownerType: "customer" (needs customerPhone) or "staff" (needs admin/staff
// headers to already be set up — see adminHeaders() in App.jsx).
export async function subscribeToPush({ ownerType, customerPhone, authHeaders = {} }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push notifications aren't supported on this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "Notification permission was not granted." };
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const keyRes = await fetch(`${API}/bookings?resource=push&action=vapid-public-key`).then(r => r.json());
    if (!keyRes?.publicKey) {
      return { success: false, error: "Push isn't configured on the server yet." };
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey),
      });
    }

    const body = {
      subscription: subscription.toJSON(),
      ownerType,
      ...(ownerType === "customer" ? { customerPhone } : {}),
    };

    const res = await fetch(`${API}/bookings?resource=push&action=subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(body),
    }).then(r => r.json());

    if (!res.success) return { success: false, error: res.error || "Failed to save subscription" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Something went wrong" };
  }
}

// Unsubscribes both locally (browser) and on the server.
export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator)) return { success: true };
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return { success: true };

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await fetch(`${API}/bookings?resource=push&action=unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
