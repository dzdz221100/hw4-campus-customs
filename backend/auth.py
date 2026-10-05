import hashlib
import hmac
import secrets

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS, dklen=32)
    return f"{ALGORITHM}${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt, hex_digest = stored_hash.split("$")
    except ValueError:
        return False
    if algorithm != ALGORITHM:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS, dklen=32)
    return hmac.compare_digest(digest.hex(), hex_digest)
