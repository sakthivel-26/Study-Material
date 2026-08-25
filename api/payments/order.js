import Razorpay from "razorpay";
import crypto from "crypto";

const PRICES = { banking: 499, tnpsc: 599, ssc: 499, railway: 399, navy: 399 };
const COUPONS = {}; // Example: {"BANK20": 20}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method Not Allowed" });
  }

  const { package_id, amount: reqAmount, coupon } = req.body;

  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  if (!KEY_ID || !KEY_SECRET) {
    return res.status(503).json({ detail: "Payments are not configured. Add Razorpay backend keys." });
  }

  const base = PRICES[package_id];
  if (!base) {
    return res.status(400).json({ detail: "Unknown course package." });
  }

  const discount = COUPONS[(coupon || "").toUpperCase()] || 0;
  const amount = Math.floor(base * (100 - discount) / 100);

  try {
    const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
    
    const receipt = `ken_${package_id}_${crypto.randomBytes(4).toString("hex")}`;
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay takes amount in paise
      currency: "INR",
      receipt: receipt,
      notes: { package_id, coupon: (coupon || "").toUpperCase() }
    });

    return res.status(200).json({ order_id: order.id, amount: amount * 100, key: KEY_ID });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    const msg = error?.error?.description || error?.description || error?.message || "Invalid keys or configuration.";
    return res.status(500).json({ detail: `Razorpay Error: ${msg}` });
  }
}
