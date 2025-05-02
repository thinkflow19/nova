import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import PyJWTError
from pydantic import BaseModel
from typing import Optional

# Load environment variables from .env file in the project root
# load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
# Env vars should be loaded by main.py now

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Define the expected audience for Supabase tokens
EXPECTED_AUDIENCE = 'authenticated'

if not SECRET_KEY:
    raise EnvironmentError("JWT_SECRET_KEY environment variable not set.")

# OAuth2PasswordBearer will look for the token in the Authorization header
# as 'Bearer <token>'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # tokenUrl is dummy here, Supabase handles token generation

class TokenData(BaseModel):
    sub: Optional[str] = None # 'sub' usually contains the user ID
    email: Optional[str] = None
    aud: Optional[str] = None # Include aud if needed elsewhere

async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    print(f"Received token: {token[:10]}...") 
    
    try:
        # Decode the JWT from Supabase, verifying the audience
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            audience=EXPECTED_AUDIENCE # Explicitly verify the audience
        )
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        audience: Optional[str] = payload.get("aud")
        
        if user_id is None:
            print("JWT Validation Error: 'sub' (user ID) claim not found in token.")
            raise credentials_exception
            
        # Optional: Log success with user ID
        print(f"Successfully validated token for user: {user_id} with aud: {audience}")
        
        token_data = TokenData(sub=user_id, email=email, aud=audience)
        
    except PyJWTError as e:
        # Log the specific JWT error
        print(f"JWT Validation Error: {e}")
        raise credentials_exception
    
    return token_data

# Dependency to get only the user ID
async def get_user_id(current_user: TokenData = Depends(get_current_user)) -> str:
    if not current_user.sub:
         # This should ideally not happen if get_current_user enforces sub presence
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User ID not found in token")
    return current_user.sub 