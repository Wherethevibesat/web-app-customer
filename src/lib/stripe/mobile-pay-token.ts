import { createHmac, timingSafeEqual } from "crypto";
import { customerPortalUrl } from "@/lib/email/send";

export type MobilePayKind = "night_package" | "vibe_share";

export type MobilePayPayload = {
  cs: string;
  pi: string;
  uid: string;
  kind: MobilePayKind;
  amountLabel: string;
  exp: number;
};

function secret() {
  const s =
    process.env.MOBILE_PAY_HMAC_SECRET?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim();
  if (!s) throw new Error("Missing MOBILE_PAY_HMAC_SECRET or STRIPE_SECRET_KEY");
  return s;
}

export function signMobilePayToken(payload: Omit<MobilePayPayload, "exp"> & { exp?: number }) {
  const full: MobilePayPayload = {
    ...payload,
    exp: payload.exp ?? Date.now() + 30 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(full), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMobilePayToken(token: string): MobilePayPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as MobilePayPayload;
    if (!payload?.cs || !payload?.pi || !payload?.uid || !payload?.kind) return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function mobilePayUrl(token: string) {
  return customerPortalUrl(`/pay/mobile?t=${encodeURIComponent(token)}`);
}

export function buildMobilePayUrl(params: {
  clientSecret: string;
  paymentIntentId: string;
  userId: string;
  kind: MobilePayKind;
  amountLabel: string;
}) {
  const token = signMobilePayToken({
    cs: params.clientSecret,
    pi: params.paymentIntentId,
    uid: params.userId,
    kind: params.kind,
    amountLabel: params.amountLabel,
  });
  return mobilePayUrl(token);
}
