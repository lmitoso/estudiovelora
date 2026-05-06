import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

let permissionRequested = false;

export const isNative = () => Capacitor.isNativePlatform();

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative()) return false;
  if (permissionRequested) return true;
  permissionRequested = true;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

export async function notifyIncomingMessage(opts: {
  title: string;
  body: string;
  conversationId?: string;
}) {
  if (!isNative()) {
    // Browser fallback
    if ("Notification" in window) {
      try {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        if (Notification.permission === "granted") {
          new Notification(opts.title, { body: opts.body });
        }
      } catch {}
    }
    return;
  }
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Math.random() * 2147483647),
          title: opts.title,
          body: opts.body,
          extra: { conversationId: opts.conversationId },
        },
      ],
    });
  } catch (e) {
    console.error("notifyIncomingMessage error", e);
  }
}
