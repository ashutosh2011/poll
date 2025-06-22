import random
import string


def generate_session_code(length: int = 4) -> str:
    """Generates a random, uppercase session code."""
    return "".join(random.choices(string.ascii_uppercase, k=length)) 