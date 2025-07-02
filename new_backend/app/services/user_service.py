import logging
from typing import Dict, Any, Optional, Tuple

from ..core.security import load_users_from_file, save_users_to_file, hash_password, verify_password
from ..core.config import settings # For logging level

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

# User roles - could be an Enum for more robustness
VALID_ROLES = ["admin", "reader"]

class UserAlreadyExistsError(Exception):
    pass

class UserCreationError(Exception):
    pass

class AuthenticationError(Exception):
    pass


def get_user_details(username: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves user details (excluding hashed_password) if the user exists.
    """
    users_data = load_users_from_file()
    user_info = users_data.get("users", {}).get(username)
    if user_info:
        # Return a copy excluding the hashed password for safety if this were to be exposed
        return {k: v for k, v in user_info.items() if k != "hashed_password"}
    return None

def create_user(username: str, plain_password: str, full_name: str, role: str) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Creates a new user, hashes their password, and saves to the user store.

    Args:
        username (str): The desired username.
        plain_password (str): The user's plain text password.
        full_name (str): The user's full name.
        role (str): The user's role (e.g., "admin", "reader").

    Returns:
        Tuple (user_info_dict, None) if successful, where user_info_dict excludes password.
        Tuple (None, error_message_str) if unsuccessful.
    """
    if not username or not plain_password or not full_name:
        return None, "Username, password, and full name cannot be empty."
    if role not in VALID_ROLES:
        return None, f"Invalid role specified. Must be one of: {', '.join(VALID_ROLES)}"

    users_data = load_users_from_file()

    if username in users_data.get("users", {}):
        logger.warning(f"Attempt to create user that already exists: {username}")
        return None, "Username already exists."

    hashed_pw = hash_password(plain_password)

    new_user_entry = {
        "full_name": full_name,
        "hashed_password": hashed_pw,
        "role": role
    }

    # Ensure 'users' key exists
    if "users" not in users_data:
        users_data["users"] = {}

    users_data["users"][username] = new_user_entry

    if save_users_to_file(users_data):
        logger.info(f"User '{username}' created successfully with role '{role}'.")
        # Return user info without the hashed password
        return {"username": username, "full_name": full_name, "role": role}, None
    else:
        logger.error(f"Failed to save new user '{username}' to file.")
        return None, "Failed to save user data. Please try again later."


def authenticate_user(username: str, plain_password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticates a user by checking username and verifying password.

    Args:
        username (str): The username to authenticate.
        plain_password (str): The plain text password to verify.

    Returns:
        User info dict (excluding hashed_password) if authentication is successful,
        None otherwise.
    """
    users_data = load_users_from_file()
    user_account_data = users_data.get("users", {}).get(username)

    if not user_account_data:
        logger.warning(f"Authentication attempt for non-existent user: {username}")
        return None # User not found

    hashed_pw_on_record = user_account_data.get("hashed_password")
    if not hashed_pw_on_record:
        logger.error(f"User '{username}' record is missing hashed_password. Cannot authenticate.")
        return None # Data integrity issue

    if verify_password(plain_password, hashed_pw_on_record):
        logger.info(f"User '{username}' authenticated successfully.")
        # Return user info without the hashed password
        return {
            "username": username,
            "full_name": user_account_data.get("full_name", ""),
            "role": user_account_data.get("role", "reader") # Default to reader if role somehow missing
        }
    else:
        logger.warning(f"Authentication failed for user: {username} (incorrect password).")
        return None


if __name__ == "__main__":
    print("Testing user_service...")
    # Ensure users.json is clean for these tests for predictability
    test_users_file = settings.BASE_DIR / "users.json"
    if test_users_file.exists():
        test_users_file.unlink()
        print(f"Removed existing {test_users_file} for user_service testing.")

    # Test user creation
    print("\n--- Test User Creation ---")
    user1_info, err1 = create_user("testadmin", "adminpass", "Admin User", "admin")
    assert user1_info is not None and err1 is None, f"Admin creation failed: {err1}"
    print(f"Admin user created: {user1_info}")
    assert user1_info["username"] == "testadmin"
    assert user1_info["role"] == "admin"

    user2_info, err2 = create_user("testreader", "readerpass", "Reader User", "reader")
    assert user2_info is not None and err2 is None, f"Reader creation failed: {err2}"
    print(f"Reader user created: {user2_info}")

    # Test creating existing user
    _, err_exists = create_user("testadmin", "newpass", "Another Admin", "admin")
    assert err_exists == "Username already exists.", "Duplicate user creation test failed."
    print("Duplicate user creation correctly prevented.")

    # Test creating user with invalid role
    _, err_role = create_user("testinvalidrole", "pass", "Invalid Role User", "superuser")
    assert "Invalid role specified" in err_role, "Invalid role creation test failed."
    print("User creation with invalid role correctly prevented.")


    # Test authentication
    print("\n--- Test Authentication ---")
    auth_admin = authenticate_user("testadmin", "adminpass")
    assert auth_admin is not None and auth_admin["username"] == "testadmin", "Admin authentication failed."
    print(f"Admin authenticated: {auth_admin}")

    auth_reader = authenticate_user("testreader", "readerpass")
    assert auth_reader is not None and auth_reader["username"] == "testreader", "Reader authentication failed."
    print(f"Reader authenticated: {auth_reader}")

    auth_fail_pass = authenticate_user("testadmin", "wrongpass")
    assert auth_fail_pass is None, "Incorrect password authentication test failed."
    print("Authentication with incorrect password correctly failed.")

    auth_fail_user = authenticate_user("nosuchuser", "anypass")
    assert auth_fail_user is None, "Non-existent user authentication test failed."
    print("Authentication for non-existent user correctly failed.")

    # Test get_user_details
    print("\n--- Test Get User Details ---")
    admin_details = get_user_details("testadmin")
    assert admin_details is not None and admin_details["full_name"] == "Admin User", "get_user_details failed for admin."
    print(f"Details for admin: {admin_details}")
    assert "hashed_password" not in admin_details, "hashed_password present in get_user_details output."

    non_existent_details = get_user_details("nosuchuseragain")
    assert non_existent_details is None, "get_user_details for non-existent user failed."
    print("get_user_details for non-existent user returned None as expected.")

    # Clean up
    if test_users_file.exists():
        test_users_file.unlink()
    print(f"\nCleaned up {test_users_file} after user_service tests.")
    print("\nuser_service tests completed.")
