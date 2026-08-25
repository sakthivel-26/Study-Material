import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method Not Allowed" });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, package_id } = req.body;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_SECRET) {
    return res.status(503).json({ detail: "Payments are not configured." });
  }

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(payload).digest("hex");

  if (expected !== razorpay_signature) {
    return res.status(400).json({ detail: "Invalid payment signature." });
  }

  return res.status(200).json({ verified: true, package_id });
}
