import os
import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv not installed, continue without it
    print("python-dotenv not installed, continuing without it")
    pass

class DatabaseConfig:
    """Centralized database configuration for MongoDB."""
    
    def __init__(self):
        # Get MongoDB connection string from environment variable
        # Default to localhost if not set
        print("MONGO_CONNECTION_STRING", os.getenv('MONGO_CONNECTION_STRING'))
        self.mongo_connection_string = os.getenv(
            'MONGO_CONNECTION_STRING')
        
        # Single database name for all collections
        self.db_name = os.getenv('DB_NAME', 'PollsApp')
        
        # Collection names
        self.questions_collection = os.getenv('QUESTIONS_COLLECTION', 'questions')
        self.quiz_history_collection = os.getenv('QUIZ_HISTORY_COLLECTION', 'quiz_history')
        
        # Initialize client
        self.client: Optional[AsyncIOMotorClient] = None
        self._db = None
    
    def get_client(self) -> AsyncIOMotorClient:
        """Get or create MongoDB client."""
        if self.client is None:
            if os.getenv('MONGO_CONNECTION_STRING').startswith('mongodb+srv://'):   
                self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_connection_string, tls=True,
                    tlsAllowInvalidCertificates=True
                )
            else:
                self.client = motor.motor_asyncio.AsyncIOMotorClient(self.mongo_connection_string)
        return self.client
    
    def get_db(self):
        """Get the main database instance."""
        if self._db is None:
            client = self.get_client()
            self._db = client[self.db_name]
        return self._db
    
    def get_questions_collection(self):
        """Get questions collection from the main database."""
        return self.get_db()[self.questions_collection]
    
    def get_quiz_history_collection(self):
        """Get quiz_history collection from the main database."""
        return self.get_db()[self.quiz_history_collection]
    
    async def close(self):
        """Close the database connection."""
        if self.client:
            self.client.close()
            self.client = None
            self._db = None

# Global database configuration instance
db_config = DatabaseConfig()

# Convenience functions for backward compatibility
def get_mongo_client() -> AsyncIOMotorClient:
    """Get MongoDB client (for backward compatibility)."""
    return db_config.get_client()

def get_db():
    """Get the main database (for backward compatibility)."""
    return db_config.get_db() 