import os
import stripe
from dotenv import load_dotenv
from fastapi import HTTPException, status
from typing import Dict

# Load environment variables
load_dotenv()

# Stripe configuration
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
stripe.api_key = STRIPE_SECRET_KEY

# Product info (hardcoded for simplicity)
LIFETIME_DEAL = {
    "price": 24900,  # $249 in cents
    "name": "Nova Lifetime Deal",
    "description": "Unlimited bots, unlimited documents, private community access",
}


def create_checkout_session(
    user_id: str, email: str, success_url: str, cancel_url: str
) -> Dict:
    """Create a Stripe checkout session for the lifetime deal."""
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer_email=email,
            client_reference_id=user_id,
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": LIFETIME_DEAL["name"],
                            "description": LIFETIME_DEAL["description"],
                        },
                        "unit_amount": LIFETIME_DEAL["price"],
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user_id,
                "plan": "pro",
            },
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}",
        )


def handle_webhook_event(payload: str, signature: str) -> Dict:
    """Handle Stripe webhook events, particularly successful payments."""
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )

        # Handle successful payment
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]

            # Extract customer details
            user_id = session.get("client_reference_id")
            plan = session.get("metadata", {}).get("plan")

            if not user_id or not plan:
                return {
                    "status": "error",
                    "message": "Missing user_id or plan in session metadata",
                }

            # Return data for updating user in database
            return {
                "status": "success",
                "user_id": user_id,
                "plan": plan,
                "payment_status": "paid",
            }

        # Return basic success for other event types
        return {"status": "success", "event_type": event["type"]}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook error: {str(e)}",
        )
