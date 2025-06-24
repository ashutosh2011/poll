# storage.py

import asyncio
from typing import Dict, List, Literal, Optional, Protocol, TypedDict

# --- Data Structures ---
# Using TypedDicts for structured data makes the code more readable,
# self-documenting, and allows static analysis tools to catch bugs.

class PlayerVote(TypedDict):
    answer: str
    time_taken: float  # seconds from question start
    points_earned: int

class Player(TypedDict):
    nickname: str
    score: int
    voted_question: int # The index of the last question the player voted on
    votes: Dict[int, PlayerVote]  # Maps question index to vote details
    online: bool  # Whether the player is currently connected

class Question(TypedDict):
    text: str
    options: List[str]
    answers: Dict[str, int] # Maps option text to vote count
    correct_answer: str
    tags: List[str]  # List of tags/subjects for categorization

QuizState = Literal["LOBBY", "QUESTION", "RESULTS", "FINISHED"]

class QuizSession(TypedDict):
    presenter: Optional[str] # player_id of the presenter
    state: QuizState
    current_question_index: int
    questions: List[Question]
    players: Dict[str, Player] # Maps player_id to Player object
    timer: int # Time limit in seconds for each question
    question_start_time: float # Timestamp when the current question was started
    quiz_name: str  # Name of the quiz
    quiz_start_time: Optional[float]  # Timestamp when quiz was started

# --- The Storage Abstraction (Interface) ---
# We use a Protocol to define the methods our storage classes must have.
# This allows for "duck typing" and makes swapping backends easy.
# The methods are async to support future I/O-bound backends (like Redis)
# without changing the application logic that uses this interface.

class QuizStorage(Protocol):
    """Defines the interface for session storage."""

    async def get_session(self, session_code: str) -> Optional[QuizSession]:
        """Retrieves a session's data by its code."""
        ...

    async def save_session(self, session_code: str, data: QuizSession) -> None:
        """Saves a session's data."""
        ...

    async def session_exists(self, session_code: str) -> bool:
        """Checks if a session exists."""
        ...

# --- In-Memory Storage Implementation ---
# This is our first implementation of the QuizStorage interface.
# It uses a simple Python dictionary to store data. It's fast and
# simple, but data is lost when the server restarts.

class MemoryStorage:
    """In-memory implementation of the QuizStorage protocol."""

    def __init__(self):
        self._sessions: Dict[str, QuizSession] = {}
        print("Initialized MemoryStorage.")

    async def get_session(self, session_code: str) -> Optional[QuizSession]:
        # We use a short asyncio.sleep(0) to simulate a non-blocking I/O call,
        # which is good practice when adhering to an async interface.
        await asyncio.sleep(0)
        return self._sessions.get(session_code)

    async def save_session(self, session_code: str, data: QuizSession) -> None:
        await asyncio.sleep(0)
        self._sessions[session_code] = data

    async def session_exists(self, session_code: str) -> bool:
        await asyncio.sleep(0)
        return session_code in self._sessions

# --- Global Storage Instance ---
# The rest of our application will import this `storage` object.
# To switch to Redis, you would simply change this one line:
# storage: QuizStorage = RedisStorage()
# ...and all other application code would work without modification.

storage: QuizStorage = MemoryStorage()