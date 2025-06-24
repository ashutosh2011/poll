# connection.py
import asyncio
import json
from typing import Dict

from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections for each quiz session."""

    def __init__(self):
        # Maps session_code to a dictionary of player_id: WebSocket
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_code: str, player_id: str):
        """Accepts a new WebSocket connection and adds it to the session."""
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = {}
        self.active_connections[session_code][player_id] = websocket
        print(f"New connection {player_id} in room: {session_code}. Total: {len(self.active_connections[session_code])}")

    def disconnect(self, session_code: str, player_id: str):
        """Removes a WebSocket connection upon disconnect."""
        if session_code in self.active_connections and player_id in self.active_connections[session_code]:
            del self.active_connections[session_code][player_id]
            if not self.active_connections[session_code]:
                del self.active_connections[session_code]
        print(f"Connection {player_id} closed in room: {session_code}.")

    def update_player_connection(self, session_code: str, old_player_id: str, new_player_id: str):
        """Updates the connection mapping when a player reconnects with a new ID."""
        if (session_code in self.active_connections and 
            old_player_id in self.active_connections[session_code] and
            new_player_id in self.active_connections[session_code]):
            
            # Move the connection from old ID to new ID
            self.active_connections[session_code][new_player_id] = self.active_connections[session_code][old_player_id]
            del self.active_connections[session_code][old_player_id]
            print(f"Updated connection mapping: {old_player_id} -> {new_player_id} in room: {session_code}")

    async def broadcast(self, session_code: str, message: dict):
        """Broadcasts a message to all clients in a session."""
        if session_code in self.active_connections:
            # Create a list of tasks to send messages concurrently
            tasks = []
            for player_id, connection in self.active_connections[session_code].items():
                task = self._safe_send(connection, message, player_id)
                tasks.append(task)
            
            # Use asyncio.gather with return_exceptions=True to handle individual failures
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log any exceptions that occurred
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    player_id = list(self.active_connections[session_code].keys())[i]
                    print(f"Failed to send message to {player_id}: {result}")

    async def _safe_send(self, websocket: WebSocket, message: dict, player_id: str):
        """Safely sends a message to a single WebSocket connection."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            # If sending fails, the connection is likely closed
            # We'll let the disconnect handler clean it up later
            print(f"Failed to send message to {player_id}: {e}")
            raise


manager = ConnectionManager() 