import { createSign } from "node:crypto";

export type FcmSendResult = {
  ok: boolean;
  error?: string;
  invalidToken?: boolean;
};

function fcmConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim(),
  );
}

export function isFcmConfigured(): boolean {
  return fcmConfigured();
}

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Google service-account JWT → OAuth access token (no google-auth-library). */
async function getAccessToken(): Promise<string> {
  const email = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Firebase service account is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64Url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claimSet}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(key);
  const jwt = `${unsigned}.${base64Url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM token exchange failed: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Failed to obtain FCM access token");
  }
  return data.access_token;
}

/** Send a single FCM notification to a device token (HTTP v1). */
export async function sendFcmPush(input: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<FcmSendResult> {
  if (!fcmConfigured()) {
    return { ok: false, error: "FCM is not configured (set FIREBASE_* env vars)" };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID!.trim();

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: input.token,
            notification: {
              title: input.title,
              body: input.body,
            },
            data: input.data ?? {},
            android: {
              priority: "HIGH",
              notification: {
                sound: "default",
                channelId: "wtva_default",
              },
            },
            apns: {
              payload: {
                aps: { sound: "default", badge: 1 },
              },
            },
          },
        }),
      },
    );

    if (res.ok) return { ok: true };

    const text = await res.text();
    return {
      ok: false,
      error: text.slice(0, 500) || `FCM HTTP ${res.status}`,
      invalidToken: /UNREGISTERED|INVALID_ARGUMENT|not a valid fcm/i.test(text),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "FCM send failed",
    };
  }
}

export async function sendFcmToUser(input: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (!fcmConfigured()) return;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: tokens } = await admin
    .from("device_push_tokens")
    .select("token")
    .eq("user_id", input.userId)
    .limit(20);

  for (const row of tokens ?? []) {
    const token = row.token as string;
    if (!token) continue;
    const result = await sendFcmPush({
      token,
      title: input.title,
      body: input.body,
      data: input.data,
    });
    if (result.invalidToken) {
      await admin.from("device_push_tokens").delete().eq("token", token);
    }
  }
}
