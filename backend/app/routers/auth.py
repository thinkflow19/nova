from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from app.models.user import UserCreate, UserResponse
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(
    prefix="/api",
    tags=["authentication"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


@router.post("/signup", response_model=UserResponse)
async def signup(user: UserCreate):
    """
    Register a new user in our backend database.
    Note: Actual authentication should happen on the frontend using Supabase Auth.
    This endpoint ensures we have a user record in our database.
    """
    try:
        result = register_user(user.email, user.password)
        return result
    except HTTPException as e:
        # Re-raise the HTTPException directly
        raise e
    except Exception as e:
        # Log the error for debugging
        print(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}",
        )


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Legacy login endpoint - only used for testing.
    Production login should use Supabase Auth directly on the frontend.
    """
    print(f"Backend login attempt for user: {form_data.username}")
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"]},
        expires_delta=access_token_expires,
    )

    print(f"Login successful, generated access token for user {user['email']}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "email": user["email"],
        "plan": user["plan"],
    }
