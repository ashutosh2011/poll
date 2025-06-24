# event_handler.py

import json
import asyncio
import time
import random
from storage import storage
from connection import manager
from quiz_history import quiz_history_storage

# A dictionary to keep track of active timer tasks for each session
timer_tasks = {}

async def _timer_task(session_code: str, question_index: int):
    """A background task that moves the quiz to RESULTS when the timer expires."""
    session = await storage.get_session(session_code)
    if not session:
        return
    
    await asyncio.sleep(session["timer"])
    
    # After sleeping, check if the state is still the same
    current_session = await storage.get_session(session_code)
    if (current_session and 
        current_session["state"] == "QUESTION" and 
        current_session["current_question_index"] == question_index):
        
        print(f"Timer expired for {session_code}. Moving to results.")
        current_session["state"] = "RESULTS"
        await storage.save_session(session_code, current_session)
        await broadcast_state(session_code)


def _get_broadcast_payload(session, audience_count):
    """Constructs the payload for broadcasting."""
    # Only count online players
    online_players = {pid: p for pid, p in session["players"].items() if p.get("online", False)}
    
    payload = {
        "audience_count": len(online_players),
        "state": session["state"],
        "players": {p["nickname"]: {"score": p["score"]} for p in online_players.values()}
    }

    if session["state"] in ["QUESTION", "RESULTS"]:
        q_index = session["current_question_index"]
        question_data = session["questions"][q_index]
        
        # Create a copy of options and shuffle them for random ordering
        shuffled_options = question_data["options"].copy()
        # random.shuffle(shuffled_options)
        
        payload.update({
            "question": question_data["text"],
            "options": shuffled_options,
            "question_index": q_index,
            "total_questions": len(session["questions"]),
            "timer": session.get("timer")
        })

    if session["state"] == "RESULTS":
        q_index = session["current_question_index"]
        payload.update({
            "results": session["questions"][q_index]["answers"],
            "correct_answer": session["questions"][q_index]["correct_answer"],
            "scores": {p["nickname"]: {"score": p["score"]} for p in online_players.values()}
        })
    
    return payload


async def broadcast_state(session_code: str):
    """Fetches the current state and broadcasts it to all clients."""
    session = await storage.get_session(session_code)
    if not session or not session_code in manager.active_connections:
        return

    audience_count = len(manager.active_connections.get(session_code, {}))
    
    # Send different randomized options to each participant
    for player_id, connection in manager.active_connections[session_code].items():
        payload = _get_broadcast_payload(session, audience_count)
        await manager._safe_send(connection, payload, player_id)


async def start_question_timer(session_code: str, session):
    """Starts the timer for the current question."""
    # Cancel any existing timer for this session
    if session_code in timer_tasks:
        timer_tasks[session_code].cancel()

    session["question_start_time"] = time.time()
    await storage.save_session(session_code, session)

    # Start a new timer
    question_index = session["current_question_index"]
    task = asyncio.create_task(_timer_task(session_code, question_index))
    timer_tasks[session_code] = task


async def save_completed_quiz(session_code: str, session):
    """Saves the completed quiz to the database."""
    try:
        quiz_name = session.get("quiz_name", f"Quiz {session_code}")
        await quiz_history_storage.save_completed_quiz(session_code, quiz_name, session)
        print(f"Quiz '{quiz_name}' completed and saved to database.")
    except Exception as e:
        print(f"Error saving quiz to database: {e}")


async def process_event(session_code: str, player_id: str, data: str):
    """Processes a single event from a client and updates the state."""
    event = json.loads(data)
    event_type = event.get("type")

    session = await storage.get_session(session_code)
    is_presenter = session.get("presenter") == player_id

    # Event Handling
    if event_type == "join":
        nickname = event.get("nickname", "Anonymous")
        
        # Check if this username is already online
        online_player_id = None
        for pid, player_data in session["players"].items():
            if player_data["nickname"] == nickname and player_data.get("online", False):
                online_player_id = pid
                break
        
        if online_player_id:
            # Username is already online - send error message
            await manager._safe_send(manager.active_connections[session_code][player_id], {
                "type": "join_error",
                "message": "You are already joined from another device. Please disconnect from the other device first."
            }, player_id)
            return
        
        # Check if this username exists but is offline (reconnection)
        offline_player_id = None
        for pid, player_data in session["players"].items():
            if player_data["nickname"] == nickname and not player_data.get("online", False):
                offline_player_id = pid
                break
        
        if offline_player_id:
            # This is a reconnection - restore the player's data
            session["players"][player_id] = session["players"][offline_player_id]
            session["players"][player_id]["online"] = True
            del session["players"][offline_player_id]
            
            # Update presenter reference if needed
            if session.get("presenter") == offline_player_id:
                session["presenter"] = player_id
            
            print(f"Player {nickname} reconnected successfully. Restored from offline player ID: {offline_player_id}")
        else:
            # This is a new player
            if nickname == 'Presenter' or session.get("presenter") is None:
                session["presenter"] = player_id
            session["players"][player_id] = {
                "nickname": nickname, 
                "score": 0, 
                "voted_question": -1,
                "votes": {},
                "online": True
            }
            print(f"New player {nickname} joined with ID: {player_id}")

    elif is_presenter:
        # Cancel timer if presenter manually advances state
        if event_type in ["show_results", "next_question"] and session_code in timer_tasks:
            timer_tasks[session_code].cancel()
            del timer_tasks[session_code]

        if event_type == "start_quiz":
            session["state"] = "QUESTION"
            session["current_question_index"] = 0
            session["quiz_start_time"] = time.time()
            await start_question_timer(session_code, session)
        elif event_type == "show_results" and session["state"] == "QUESTION":
            session["state"] = "RESULTS"
        elif event_type == "next_question":
            index = session["current_question_index"]
            if index < len(session["questions"]) - 1:
                session["current_question_index"] += 1
                session["state"] = "QUESTION"
                await start_question_timer(session_code, session)
            else:
                session["state"] = "FINISHED"
                # Save completed quiz to database
                await save_completed_quiz(session_code, session)

    elif event_type == "vote":
        index = session["current_question_index"]
        option = event.get("option")
        player_data = session["players"].get(player_id)
        time_limit = session.get("timer", 30)

        if player_data and player_data["voted_question"] != index and 0 <= index < len(session["questions"]) and option:
            session["questions"][index]["answers"][option] += 1
            player_data["voted_question"] = index
            
            # Calculate time taken and points
            time_taken = time.time() - session.get("question_start_time", time.time())
            max_points = 1000
            min_points = 500
            
            if time_taken >= time_limit:
                points_earned = min_points
            else:
                score_range = max_points - min_points
                points_earned = max_points - (time_taken / time_limit) * score_range

            # Check if answer is correct
            is_correct = option == session["questions"][index]["correct_answer"]
            if is_correct:
                player_data["score"] += int(points_earned)
                actual_points = int(points_earned)
            else:
                actual_points = 0

            # Store vote details
            player_data["votes"][index] = {
                "answer": option,
                "time_taken": time_taken,
                "points_earned": actual_points
            }

    await storage.save_session(session_code, session)
    await broadcast_state(session_code)


async def handle_disconnect(session_code: str, player_id: str):
    """Handles a client disconnecting, updates session, and broadcasts."""
    session = await storage.get_session(session_code)
    # Cancel timer if the presenter disconnects
    if session and session.get("presenter") == player_id and session_code in timer_tasks:
        timer_tasks[session_code].cancel()
        del timer_tasks[session_code]

    manager.disconnect(session_code, player_id)
    if session and player_id in session["players"]:
        # Mark player as offline instead of removing them
        session["players"][player_id]["online"] = False
        print(f"Player {session['players'][player_id]['nickname']} marked as offline")
        await storage.save_session(session_code, session)
        await broadcast_state(session_code) 