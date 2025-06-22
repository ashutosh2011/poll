# Real-Time Quiz Application

This project is a minimalist, real-time quiz application built with Python, FastAPI, and vanilla JavaScript. It is designed to function like a simple version of Kahoot, where a presenter controls the quiz flow and an audience participates live from their own devices using a unique session code.

The core focus of this project is its clean, decoupled architecture, specifically the use of a **swappable storage backend**. This ensures the application is maintainable and easy to upgrade in the future.

## Key Features

-   **Dynamic Quiz Creation:** Create quizzes with a variable number of questions and four options each. Presenters can mark the correct answer for each question.
-   **Presenter & Audience Roles:** Separate views and controls for the quiz presenter and the audience.
-   **Player Nicknames & Session Joining:** Audience members join a specific quiz using a randomly generated 4-letter code and provide a nickname.
-   **Fully Real-Time:** All state changes (starting the quiz, advancing questions, showing results) are pushed to all clients instantly using **WebSockets**. No page reloads are necessary.
-   **Live Audience Count & Player List:** The presenter can see a list of joined players, and both presenter and audience see a live count of connected participants.
-   **Live Result Charting with Scoring:** Vote results are displayed as a live bar chart using Chart.js, which now highlights the correct answer. Scores are awarded for correct answers, with more points given for faster responses.
-   **Live Leaderboard:** A leaderboard ranking players by their score is displayed to all participants after each question.
-   **Question Bank:** Presenters can create, save, and manage a reusable bank of questions. Quizzes can be quickly assembled by selecting from the bank, or by combining banked questions with manually entered ones.
-   **Quiz History & Analytics:** Completed quizzes are automatically saved to MongoDB with detailed analytics including leaderboards, individual player responses, timing data, and question performance metrics.
-   **Clean, Swappable Architecture:** The application logic is completely decoupled from the data storage mechanism. It currently uses a simple in-memory dictionary with strongly-typed data structures (`TypedDict`), but can be switched to Redis (or any other database) by changing only one line of code in `storage.py`.

## Technology Stack

-   **Backend:**
    -   Python 3
    -   FastAPI (for the web server and API endpoints)
    -   WebSockets (for real-time, bidirectional communication)
    -   Uvicorn (as the ASGI server)
    -   MongoDB (for quiz history storage)
-   **Frontend:**
    -   Plain HTML5
    -   Plain CSS3
    -   Vanilla JavaScript (no frameworks)
    -   Chart.js (for data visualization)
-   **Architecture:**
    -   Storage Adapter Pattern

## Core Architectural Concepts

The project is built on two key architectural principles: **the Storage Adapter Pattern** and a **Modular, Service-Oriented Structure**.

### 1. The Storage Adapter

The most important architectural decision is the abstraction of the storage layer, which allows for a swappable backend.

-   **The Interface (`storage.py`):** We define a `QuizStorage` protocol that dictates the methods any storage system must implement (e.g., `get_session`, `save_session`).
-   **The Implementation (`storage.py`):** We provide an initial `MemoryStorage` class that implements this protocol using a simple Python dictionary.
-   **The Decoupling:** The application logic **only** interacts with the `storage` object, which conforms to the `QuizStorage` interface. It has no knowledge of whether the data is being saved to a dictionary, Redis, or a SQL database.

This makes the system incredibly flexible. To upgrade to Redis, one would simply create a `RedisStorage` class that implements the same methods and change a single line in `storage.py`.

### 2. Quiz History Storage

The application now includes a separate quiz history system that automatically saves completed quizzes to MongoDB:

-   **Automatic Saving:** When a quiz finishes, all data is automatically saved to the database
-   **Detailed Analytics:** Stores leaderboards, individual player responses, timing data, and question performance
-   **Separate Architecture:** The history system is completely separate from the main storage, ensuring it doesn't interfere with real-time performance
-   **Easy Access:** View quiz history at `/history` to see all completed quizzes with detailed analytics

### 3. Modular Application Structure

To ensure the application remains maintainable and easy to understand as it grows, the core logic has been refactored out of a single `main.py` file into a modular structure with clear separation of concerns.

-   **`main.py`:** The main entry point of the application. Its only jobs are to initialize the FastAPI app, mount the static directory, and include the application's routes.
-   **`routing.py`:** Defines all HTTP and WebSocket API endpoints using a FastAPI `APIRouter`. It handles incoming requests and directs them to the appropriate logic, but does not contain the business logic itself.
-   **`event_handler.py`:** Contains all the core business logic for handling real-time WebSocket events like `join`, `vote`, `start_quiz`, etc. It manipulates the session state based on user actions.
-   **`connection.py`:** Manages all active WebSocket connections. The `ConnectionManager` class tracks all connected clients for each quiz session and provides a simple interface for broadcasting messages.
-   **`storage.py`:** Implements the storage adapter pattern, completely decoupling the application from the data persistence method.
-   **`quiz_history.py`:** Handles saving completed quiz data to MongoDB with detailed analytics and provides methods to retrieve quiz history.
-   **`utils.py`:** A collection of helper functions that can be used across the application (e.g., `generate_session_code`).

This structure makes the codebase cleaner, easier to navigate, and more extensible for future development.

## Setup and Running

1.  **Clone the repository (or create the files as provided).**

2.  **Create and activate a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up MongoDB (for quiz history):**
    ```bash
    # Run the setup script to install MongoDB
    python setup_mongodb.py
    
    # Or install MongoDB manually:
    # macOS: brew install mongodb-community && brew services start mongodb-community
    # Ubuntu: sudo apt-get install mongodb && sudo systemctl start mongodb
    # Windows: Download from https://www.mongodb.com/try/download/community
    # Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest
    ```

5.  **Run the application:**
    ```bash
    uvicorn main:app --reload
    ```
    The `--reload` flag automatically restarts the server when you make changes to the code.

6.  **Access the application:**
    -   Open a browser and navigate to `http://127.0.0.1:8000/create` to create a quiz as the presenter.
    -   To manage your saved questions, navigate to `http://127.0.0.1:8000/question-bank`.
    -   To view quiz history and analytics, navigate to `http://127.0.0.1:8000/history`.
    -   In a separate browser window (or incognito tab), navigate to `http://127.0.0.1:8000` to join as an audience member using the code provided on the presenter's screen.

---

## Quiz History Feature

The quiz history system automatically saves detailed information about completed quizzes to MongoDB:

### What Gets Saved:
- **Quiz Information:** Name, session code, start/end times, duration
- **Final Leaderboard:** All players ranked by final score
- **Question Details:** Each question with options and correct answers
- **Player Responses:** What each player answered, how long they took, points earned
- **Vote Analytics:** Total votes per option for each question
- **Performance Metrics:** Number of correct answers per question

### Accessing History:
- Navigate to `/history` to see all completed quizzes
- Each quiz shows detailed analytics and performance metrics
- View individual player performance and question difficulty analysis

### Database Schema:
The quiz history is stored in MongoDB with the following structure:
```javascript
{
  quiz_name: "Science Quiz",
  session_code: "ABCD",
  start_time: ISODate("2024-01-01T10:00:00Z"),
  end_time: ISODate("2024-01-01T10:15:00Z"),
  questions: [
    {
      question_text: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correct_answer: "Paris",
      player_answers: [
        {
          nickname: "Alice",
          answer: "Paris",
          time_taken: 5.2,
          correct: true,
          points_earned: 850
        }
      ],
      total_votes: {"London": 0, "Paris": 3, "Berlin": 1, "Madrid": 0}
    }
  ],
  final_leaderboard: {"Alice": 850, "Bob": 500},
  total_players: 2
}
```

---

## To-Do & Future Improvements

This list outlines potential features and enhancements to evolve this minimalist app into a more robust and feature-rich platform.

### Core Functionality Enhancements
-   [x] **Multiple Questions:** Update the creation form and backend logic to support creating and running a quiz with more than one question.
-   [x] **Correct Answer & Scoring:**
    -   Allow the presenter to mark one option as the "correct" answer during quiz creation.
    -   Display the correct answer during the "Results" phase.
    -   Award points to players who answer correctly.
-   [x] **Player Nicknames & Leaderboard:**
    -   Prompt users for a nickname when they join a session.
    -   Display a list of joined players on the presenter's screen.
    -   Implement a leaderboard that is displayed between questions, ranking players by score.
-   [x] **Question Bank:** Allow presenters to create and save questions to a reusable question bank, and then build new quizzes by selecting from it.
-   [x] **Question Timers:** Add a configurable countdown timer for each question. The server automatically advances the state, and scoring is weighted to reward faster answers.
-   [x] **Quiz History & Analytics:** Automatically save completed quizzes to MongoDB with detailed analytics including leaderboards, player responses, and performance metrics.

### Technical & Architectural Improvements
-   [ ] **Implement `RedisStorage`:** Create the `RedisStorage` class in `storage.py` as a new implementation of the `QuizStorage` protocol. This would provide persistence, allowing quizzes to survive a server restart.
-   [ ] **Robust Error Handling:** Improve error handling for edge cases (e.g., invalid WebSocket messages, attempts to vote on a non-existent option, joining a full/non-existent session).
-   [ ] **Presenter Reconnection:** Implement logic to handle cases where the presenter disconnects and then reconnects to the same session, re-establishing their control.
-   [ ] **Automated Testing:** Add a test suite using `pytest` and `httpx` to write unit and integration tests for the API endpoints and WebSocket logic.
-   [ ] **Session Cleanup:** Implement a background task that periodically cleans up old, inactive sessions from storage to prevent memory leaks (especially important for `MemoryStorage`).
-   [ ] **Quiz History Export:** Add functionality to export quiz history as CSV or PDF reports.
-   [ ] **Advanced Analytics:** Add more detailed analytics including question difficulty analysis, player performance trends, and quiz effectiveness metrics.

### User Experience (UX/UI)
-   [ ] **UI/UX Polish:** Improve the visual design with better styling, transitions, and animations to make the experience more engaging.
-   [ ] **Responsive Design:** Further refine the CSS to ensure the layout looks great on all devices, from mobile phones to desktops.
-   [ ] **End-of-Quiz Summary:** Create a final screen that shows the top 3 players (the podium) and a summary of the quiz.
-   [ ] **Accessibility (a11y):** Review the HTML and CSS to ensure the application is accessible to users with disabilities (e.g., proper use of ARIA attributes, keyboard navigation, color contrast).
-   [ ] **Quiz History Dashboard:** Create an enhanced dashboard for viewing quiz history with filtering, search, and advanced analytics.