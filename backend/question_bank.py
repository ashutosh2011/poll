import hashlib
from typing import List, Dict, Any
from database import db_config

# Get database and collection from centralized config
question_collection = db_config.get_questions_collection()

def calculate_question_hash(question_text: str, options: List[str]) -> str:
    """Calculates a SHA256 hash for a question to prevent duplicates."""
    # Sort options to ensure consistent hash
    sorted_options = sorted(options)
    hash_input = f"{question_text.strip().lower()}{''.join(sorted_options).lower()}"
    return hashlib.sha256(hash_input.encode()).hexdigest()

async def add_question_to_bank(question_text: str, options: List[str], correct_answer: str, tags: List[str] = None) -> Dict[str, Any]:
    """Adds a new question to the MongoDB question bank."""
    question_hash = calculate_question_hash(question_text, options)

    # Check for duplicates
    existing_question = await question_collection.find_one({"hash": question_hash})
    if existing_question:
        return {"error": "Duplicate question"}

    # Normalize tags - convert to lowercase and remove duplicates
    normalized_tags = []
    if tags:
        normalized_tags = list(set([tag.strip().lower() for tag in tags if tag.strip()]))

    question_doc = {
        "text": question_text,
        "options": options,
        "correct_answer": correct_answer,
        "hash": question_hash,
        "tags": normalized_tags,
    }
    result = await question_collection.insert_one(question_doc)
    return {"_id": str(result.inserted_id), **question_doc}

async def get_all_questions() -> List[Dict[str, Any]]:
    """Retrieves all questions from the question bank."""
    questions = []
    cursor = question_collection.find({})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        questions.append(document)
    return questions

async def search_questions_by_tags(tags: List[str]) -> List[Dict[str, Any]]:
    """Search questions by tags (case-insensitive)."""
    if not tags:
        return await get_all_questions()
    
    # Convert tags to lowercase for case-insensitive search
    normalized_tags = [tag.lower() for tag in tags]
    
    # Find questions that have any of the specified tags
    questions = []
    cursor = question_collection.find({"tags": {"$in": normalized_tags}})
    async for document in cursor:
        document["_id"] = str(document["_id"])
        questions.append(document)
    return questions

async def get_all_tags() -> List[str]:
    """Get all unique tags from the question bank."""
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags"}},
        {"$sort": {"_id": 1}}
    ]
    
    tags = []
    cursor = question_collection.aggregate(pipeline)
    async for document in cursor:
        tags.append(document["_id"])
    return tags

async def delete_question_from_bank(question_id: str):
    """Deletes a question from the bank by its hash."""
    await question_collection.delete_one({"hash": question_id})
    return {"status": "deleted"} 