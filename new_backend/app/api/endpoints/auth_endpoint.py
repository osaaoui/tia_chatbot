import logging
from fastapi import APIRouter, HTTPException, status, Body
from typing import Annotated # For Depends, Body etc. if needed more explicitly

from ...services import user_service
from ...models.schemas import UserCreateRequest, UserResponse, LoginRequest
from ...core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup_new_user(
    user_data: UserCreateRequest = Body(...)
):
    """
    Registers a new user.
    """
    logger.info(f"Signup attempt for username: {user_data.username}, role: {user_data.role}")

    created_user_info, error_message = user_service.create_user(
        username=user_data.username,
        plain_password=user_data.password,
        full_name=user_data.full_name or "", # Ensure full_name is not None
        role=user_data.role
    )

    if error_message:
        logger.warning(f"Signup failed for {user_data.username}: {error_message}")
        if "Username already exists" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_message,
            )
        elif "Invalid role" in error_message:
             raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, # Or 400 Bad Request
                detail=error_message,
            )
        else: # General creation error (e.g., failed to save file)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_message,
            )

    if not created_user_info: # Should be caught by error_message but as a safeguard
        logger.error(f"User creation returned no info and no error for {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during user creation.",
        )

    # Map service response to Pydantic UserResponse
    # Assuming 'id' in UserResponse is the username for this simple setup
    return UserResponse(
        id=created_user_info["username"],
        username=created_user_info["username"],
        full_name=created_user_info["full_name"],
        role=created_user_info["role"]
    )

@router.post("/login", response_model=UserResponse) # Later, this might return Token
async def login_for_access(
    form_data: LoginRequest = Body(...)
):
    """
    Authenticates a user and returns user information.
    (Later, this could return an access token).
    """
    logger.info(f"Login attempt for username: {form_data.username}")

    authenticated_user_info = user_service.authenticate_user(
        username=form_data.username,
        plain_password=form_data.password
    )

    if not authenticated_user_info:
        logger.warning(f"Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}, # Or "Basic" if that were the scheme
        )

    logger.info(f"User {form_data.username} logged in successfully.")
    # Map service response to Pydantic UserResponse
    return UserResponse(
        id=authenticated_user_info["username"],
        username=authenticated_user_info["username"],
        full_name=authenticated_user_info["full_name"],
        role=authenticated_user_info["role"]
    )

# Example of a protected route (conceptual, would require dependency injection for current user)
# from fastapi import Depends
# from ..dependencies import get_current_active_user # This dependency would need to be created
# @router.get("/users/me", response_model=UserResponse)
# async def read_users_me(current_user: UserResponse = Depends(get_current_active_user)):
#     return current_user
