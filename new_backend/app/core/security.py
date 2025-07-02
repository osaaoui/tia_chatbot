import json
import logging
from pathlib import Path
from passlib.context import CryptContext

from .config import settings # To get base directory for users.json

logger = logging.getLogger(__name__)
logging.basicConfig(level=settings.LOG_LEVEL)

# --- Password Hashing ---
# Use passlib for robust password hashing
# bcrypt is a good default algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e: # Catch potential errors from passlib (e.g., malformed hash)
        logger.error(f"Error verifying password: {e}")
        return False

# --- User Data Storage (JSON file) ---
# Define the path for users.json at the project root (new_backend/)
# This is a temporary storage solution.
USERS_FILE_PATH = settings.BASE_DIR / "users.json"

# Define the expected structure for user data in the JSON file
# Example:
# {
#   "users": {
#     "username1": {"full_name": "Alice Smith", "hashed_password": "...", "role": "admin"},
#     "username2": {"full_name": "Bob Johnson", "hashed_password": "...", "role": "reader"}
#   }
# }
DEFAULT_USERS_DATA = {"users": {}}

def load_users_from_file() -> dict:
    """
    Loads user data from the JSON file.
    If the file doesn't exist, it creates one with default (empty) structure.
    """
    if not USERS_FILE_PATH.exists():
        logger.warning(f"Users file not found at {USERS_FILE_PATH}. Creating a new one.")
        save_users_to_file(DEFAULT_USERS_DATA) # Create with default empty structure
        return DEFAULT_USERS_DATA.copy() # Return a copy

    try:
        with open(USERS_FILE_PATH, "r") as f:
            users_data = json.load(f)
            if "users" not in users_data or not isinstance(users_data["users"], dict):
                logger.error(f"Invalid format in users file {USERS_FILE_PATH}. Reinitializing with default.")
                save_users_to_file(DEFAULT_USERS_DATA)
                return DEFAULT_USERS_DATA.copy()
            return users_data
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from users file {USERS_FILE_PATH}. Reinitializing with default.")
        save_users_to_file(DEFAULT_USERS_DATA)
        return DEFAULT_USERS_DATA.copy()
    except Exception as e:
        logger.error(f"Unexpected error loading users file {USERS_FILE_PATH}: {e}", exc_info=True)
        # Depending on policy, might return default or raise
        return DEFAULT_USERS_DATA.copy()

def save_users_to_file(users_data: dict) -> bool:
    """
    Saves the provided user data structure to the JSON file.
    """
    if "users" not in users_data or not isinstance(users_data["users"], dict):
        logger.error("Invalid users_data structure passed to save_users_to_file. Not saving.")
        return False
    try:
        with open(USERS_FILE_PATH, "w") as f:
            json.dump(users_data, f, indent=4)
        logger.info(f"User data successfully saved to {USERS_FILE_PATH}.")
        return True
    except Exception as e:
        logger.error(f"Error saving user data to {USERS_FILE_PATH}: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    print("Testing security utils...")

    # Test password hashing
    test_password = "mypassword123"
    hashed = hash_password(test_password)
    print(f"Original: {test_password}, Hashed: {hashed}")
    assert verify_password(test_password, hashed), "Password verification failed for correct password."
    assert not verify_password("wrongpassword", hashed), "Password verification succeeded for wrong password."
    print("Password hashing and verification tests passed.")

    # Test user data loading/saving
    # Ensure USERS_FILE_PATH is clean for a predictable test
    if USERS_FILE_PATH.exists():
        USERS_FILE_PATH.unlink()
        print(f"Removed existing {USERS_FILE_PATH} for testing.")

    # 1. Test loading when file doesn't exist (should create default)
    print("\nTest 1: Loading users when file does not exist.")
    initial_users = load_users_from_file()
    print(f"Initial users loaded: {initial_users}")
    assert initial_users == DEFAULT_USERS_DATA, "Default users not loaded correctly."
    assert USERS_FILE_PATH.exists(), "Users file was not created on first load."

    # 2. Test saving new user data
    print("\nTest 2: Saving new user data.")
    new_data_to_save = {
        "users": {
            "testuser": {
                "full_name": "Test User",
                "hashed_password": hash_password("testpass"),
                "role": "reader"
            }
        }
    }
    save_success = save_users_to_file(new_data_to_save)
    assert save_success, "Failed to save user data."

    loaded_after_save = load_users_from_file()
    print(f"Data loaded after save: {loaded_after_save}")
    assert loaded_after_save["users"]["testuser"]["full_name"] == "Test User", "User data not saved/loaded correctly."
    assert verify_password("testpass", loaded_after_save["users"]["testuser"]["hashed_password"]), "Saved user password verification failed."

    # 3. Test loading corrupted JSON (manual step: corrupt users.json then run)
    # print("\nTest 3: Loading corrupted JSON (manual step).")
    # To test this, manually edit users.json to be invalid, then uncomment and run:
    # corrupted_users = load_users_from_file()
    # print(f"Data after attempting to load corrupted JSON: {corrupted_users}")
    # assert corrupted_users == DEFAULT_USERS_DATA, "Corrupted JSON did not result in default data."
    # assert USERS_FILE_PATH.exists(), "Users file was not re-created after corruption."
    # print("Test for corrupted JSON load passed (assuming manual corruption was done and file re-initialized).")


    # Clean up after tests
    if USERS_FILE_PATH.exists():
        USERS_FILE_PATH.unlink()
        print(f"\nCleaned up {USERS_FILE_PATH} after tests.")

    print("\nSecurity utils tests completed.")
