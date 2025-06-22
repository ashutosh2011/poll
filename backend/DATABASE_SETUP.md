# Database Configuration Setup

This document explains how to configure MongoDB connections in the polls application.

## Overview

The application now uses a centralized database configuration system that allows you to easily switch between different MongoDB environments (local, cloud, etc.) by simply changing environment variables. All data (questions and quiz history) is stored in a single database.

## Files Changed

- `database.py` - New centralized database configuration
- `question_bank.py` - Updated to use centralized config
- `quiz_history.py` - Updated to use centralized config
- `requirements.txt` - Added python-dotenv dependency
- `env.example` - Example environment configuration

## Environment Variables

The following environment variables can be configured:

### Required
- `MONGO_CONNECTION_STRING` - MongoDB connection string

### Optional (with defaults)
- `DB_NAME` - Database name for all collections (default: "PollsApp")
- `QUESTIONS_COLLECTION` - Collection name for questions (default: "questions")
- `QUIZ_HISTORY_COLLECTION` - Collection name for quiz history (default: "quiz_history")

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

#### Option A: Using .env file (Recommended)
1. Copy the example file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` file with your MongoDB connection string:
   ```bash
   # For local MongoDB
   MONGO_CONNECTION_STRING=mongodb://username:password@localhost:27017/?retryWrites=true&w=majority&appName=PollsApp
   
   # For MongoDB Atlas (cloud)
   MONGO_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=PollsApp
   ```

#### Option B: Using System Environment Variables
Set the environment variables directly in your shell:
```bash
export MONGO_CONNECTION_STRING="your_mongodb_connection_string"
```

### 3. Test Configuration
The application will automatically use the configured MongoDB connection when it starts.

## Database Structure

The application uses a single database with the following collections:

- `questions` - Stores the question bank
- `quiz_history` - Stores completed quiz sessions

## Connection String Examples

### Local MongoDB
```
mongodb://username:password@localhost:27017/?retryWrites=true&w=majority&appName=PollsApp
```

### MongoDB Atlas (Cloud)
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=PollsApp
```

### MongoDB Atlas with Database Name
```
mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority&appName=PollsApp
```

## Benefits

1. **Easy Environment Switching**: Change from local to cloud MongoDB by updating one environment variable
2. **Security**: No hardcoded credentials in source code
3. **Flexibility**: Easy to configure different database names and collection names
4. **Centralized Management**: All database configuration in one place
5. **Single Database**: All data stored in one database for easier management
6. **Backward Compatibility**: Existing code continues to work without changes

## Migration Notes

- The old hardcoded connection strings have been removed
- All MongoDB operations now go through the centralized `database.py` configuration
- Both questions and quiz history now use the same database
- The application will use the same default connection string if no environment variable is set
- No changes needed to existing application logic

## Troubleshooting

### Connection Issues
1. Verify your MongoDB connection string is correct
2. Check if MongoDB is running (for local installations)
3. Ensure network connectivity (for cloud installations)
4. Verify username/password credentials

### Environment Variable Not Loading
1. Make sure `.env` file is in the backend directory
2. Verify `python-dotenv` is installed: `pip install python-dotenv`
3. Check that the environment variable name matches exactly (case-sensitive)

### Database/Collection Not Found
1. Verify database and collection names in environment variables
2. Check if the database and collections exist in your MongoDB instance
3. Ensure your MongoDB user has appropriate permissions 