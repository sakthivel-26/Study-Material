"""Razorpay order and signature-verification endpoints.
Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET only on the backend host; never expose
RAZORPAY_KEY_SECRET as a VITE_ variable or in frontend code.
"""
import os
import hmac
import hashlib
from decimal import Decimal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import razorpay

router = APIRouter(prefix="/api/payments", tags=["payments"])
KEY_ID = os.getenv("RAZORPAY_KEY_ID")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
client = razorpay.Client(auth=(KEY_ID, KEY_SECRET)) if KEY_ID and KEY_SECRET else None

# Keep pricing authoritative on the server. Update these values when changing plans.
PRICES = {"banking": 499, "tnpsc": 599, "ssc": 499, "railway": 399, "navy": 399}
COUPONS = {}  # Example: {"BANK20": 20}; replace with Firestore/admin data in production.

class OrderRequest(BaseModel):
    package_id: str
    amount: int = Field(ge=1)
    coupon: str = ""
class VerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    package_id: str

@router.post("/order")
def create_order(body: OrderRequest):
    if not client: raise HTTPException(503, "Payments are not configured. Add Razorpay backend keys.")
    base = PRICES.get(body.package_id)
    if not base: raise HTTPException(400, "Unknown course package.")
    discount = COUPONS.get(body.coupon.upper(), 0)
    amount = int(Decimal(base) * (100 - discount) / 100)
    order = client.order.create({"amount": amount * 100, "currency": "INR", "receipt": f"ken_{body.package_id}_{os.urandom(4).hex()}", "notes": {"package_id": body.package_id, "coupon": body.coupon.upper()}})
    return {"order_id": order["id"], "amount": amount * 100, "key": KEY_ID}

@router.post("/verify")
def verify_payment(body: VerifyRequest):
    if not KEY_SECRET: raise HTTPException(503, "Payments are not configured.")
    payload = f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode()
    expected = hmac.new(KEY_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.razorpay_signature): raise HTTPException(400, "Invalid payment signature.")
    # Production: write package_id and payment id to Firestore for the authenticated uid
    # only after this verified response, ideally also process Razorpay webhooks.
    return {"verified": True, "package_id": body.package_id}
