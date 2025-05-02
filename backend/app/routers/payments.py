from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from typing import Optional, Dict
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.services.dependencies import get_current_user
from app.services.payment_service import create_checkout_session, handle_webhook_event
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter(
    prefix="/api/payment",
    tags=["payments"],
)


class CheckoutRequest(BaseModel):
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_stripe_checkout(
    request: CheckoutRequest, current_user=Depends(get_current_user)
):
    """Create a Stripe checkout session for the lifetime deal."""
    try:
        # Get checkout URL
        checkout_data = create_checkout_session(
            user_id=current_user["id"],
            email=current_user["email"],
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )

        return checkout_data

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}",
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook notifications."""
    try:
        # Get request body
        payload = await request.body()

        # Process webhook
        result = handle_webhook_event(payload, stripe_signature)

        # Update user plan if payment successful
        if result.get("status") == "success" and result.get("payment_status") == "paid":
            user_id = result.get("user_id")
            plan = result.get("plan")

            # Update user in Supabase
            supabase.table("users").update({"plan": plan}).eq("id", user_id).execute()

        return {"status": "success"}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Webhook error: {str(e)}"
        )
