# quiz_history.py

import asyncio
import time
from typing import Dict, List, Optional, TypedDict
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from database import db_config

# Data structures for storing quiz history
class PlayerAnswer(TypedDict):
    nickname: str
    answer: str
    time_taken: float  # seconds
    correct: bool
    points_earned: int

class QuestionResult(TypedDict):
    question_text: str
    options: List[str]
    correct_answer: str
    player_answers: List[PlayerAnswer]
    total_votes: Dict[str, int]

class QuizHistory(TypedDict):
    quiz_name: str
    session_code: str
    start_time: datetime
    end_time: datetime
    questions: List[QuestionResult]
    final_leaderboard: Dict[str, int]  # nickname -> final score
    total_players: int

class QuizHistoryStorage:
    """Handles storing completed quiz data to MongoDB."""
    
    def __init__(self):
        self.client = db_config.get_client()
        self.db = db_config.get_db()
        self.collection = db_config.get_quiz_history_collection()
        print("Initialized QuizHistoryStorage with MongoDB.")
    
    async def save_completed_quiz(self, session_code: str, quiz_name: str, session_data: dict) -> str:
        """Saves a completed quiz to the database."""
        await asyncio.sleep(0)  # Simulate async I/O
        
        # Extract data from session
        questions_data = []
        for i, question in enumerate(session_data["questions"]):
            # Get player answers for this question
            player_answers = []
            for player_id, player in session_data["players"].items():
                # Check if player voted on this question
                if player.get("voted_question") == i:
                    vote_data = player.get("votes", {}).get(i, {})
                    
                    player_answers.append(PlayerAnswer(
                        nickname=player["nickname"],
                        answer=vote_data.get("answer", "Unknown"),
                        time_taken=vote_data.get("time_taken", 0.0),
                        correct=vote_data.get("answer") == question["correct_answer"],
                        points_earned=vote_data.get("points_earned", 0)
                    ))
            
            questions_data.append(QuestionResult(
                question_text=question["text"],
                options=question["options"],
                correct_answer=question["correct_answer"],
                player_answers=player_answers,
                total_votes=question["answers"]
            ))
        
        # Create final leaderboard
        final_leaderboard = {
            player["nickname"]: player["score"] 
            for player in session_data["players"].values()
        }
        
        # Calculate start and end times
        start_time = datetime.fromtimestamp(session_data.get("quiz_start_time", time.time()))
        end_time = datetime.now()
        
        # Create quiz history record
        quiz_history = QuizHistory(
            quiz_name=quiz_name,
            session_code=session_code,
            start_time=start_time,
            end_time=end_time,
            questions=questions_data,
            final_leaderboard=final_leaderboard,
            total_players=len(session_data["players"])
        )
        
        # Save to MongoDB
        result = await self.collection.insert_one(quiz_history)
        print(f"Saved completed quiz '{quiz_name}' to database with ID: {result.inserted_id}")
        return str(result.inserted_id)
    
    async def get_quiz_history(self, limit: int = 10) -> List[QuizHistory]:
        """Retrieves recent quiz history."""
        await asyncio.sleep(0)
        cursor = self.collection.find().sort("end_time", -1).limit(limit)
        quizzes = await cursor.to_list(length=limit)
        return quizzes
    
    async def get_quiz_by_id(self, quiz_id: str) -> Optional[QuizHistory]:
        """Retrieves a specific quiz by its ID."""
        await asyncio.sleep(0)
        from bson import ObjectId
        quiz = await self.collection.find_one({"_id": ObjectId(quiz_id)})
        return quiz

# Global instance
quiz_history_storage = QuizHistoryStorage() 