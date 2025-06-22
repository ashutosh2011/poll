# Real-Time Quiz Application

A modern, real-time quiz application built with a decoupled architecture featuring both a Python FastAPI backend and a React TypeScript frontend. This application provides a Kahoot-like experience where presenters can create and host interactive quizzes while audiences participate in real-time from their devices.

## 🚀 Features

### Core Functionality
- **Dynamic Quiz Creation**: Create quizzes with multiple questions and four options each
- **Real-Time Interaction**: WebSocket-based communication for instant updates
- **Presenter & Audience Roles**: Separate interfaces for quiz hosts and participants
- **Session Management**: Join quizzes using unique 4-letter session codes
- **Live Scoring**: Points awarded for correct answers with time-based bonuses
- **Real-Time Leaderboard**: Live ranking of participants during quizzes

### Advanced Features
- **Question Bank**: Save and reuse questions across multiple quizzes
- **Quiz History & Analytics**: Detailed analytics stored in MongoDB
- **Live Result Visualization**: Real-time charts showing vote distribution
- **Timer System**: Configurable countdown timers for each question
- **Player Management**: Track connected participants and their responses

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI**: Modern, fast web framework for building APIs
- **WebSockets**: Real-time bidirectional communication
- **Storage Adapter Pattern**: Swappable storage backends (Memory/Redis/MongoDB)
- **Modular Design**: Clean separation of concerns across modules

### Frontend (React/TypeScript)
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Beautiful, accessible UI components
- **React Router**: Client-side routing

### Database
- **MongoDB**: Document database for quiz history and analytics
- **Docker Support**: Easy containerized deployment

## 📁 Project Structure

```
polls/
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Application entry point
│   ├── routing.py          # API routes and WebSocket handlers
│   ├── event_handler.py    # Business logic for quiz events
│   ├── connection.py       # WebSocket connection management
│   ├── storage.py          # Storage adapter pattern implementation
│   ├── quiz_history.py     # MongoDB integration for analytics
│   ├── utils.py            # Helper functions
│   ├── templates/          # HTML templates (legacy)
│   ├── static/             # Static assets
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── App.tsx         # Main application component
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
├── frontend_basic/         # Legacy vanilla JS frontend
├── docker-compose.yml      # MongoDB container setup
└── README.md              # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+
- Docker (optional, for MongoDB)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up MongoDB** (choose one option):

   **Option A: Using Docker (Recommended)**
   ```bash
   # From project root
   docker-compose up -d mongodb
   ```

   **Option B: Local MongoDB**
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   
   # Windows: Download from https://www.mongodb.com/try/download/community
   ```

5. **Run the backend server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## 🎯 Usage

### For Presenters
1. Navigate to the application
2. Click "Create Quiz" to start a new session
3. Add questions manually or select from your question bank
4. Share the session code with your audience
5. Start the quiz and control the flow
6. View real-time results and leaderboards

### For Audience
1. Navigate to the application
2. Enter the session code provided by the presenter
3. Choose a nickname
4. Wait for the quiz to begin
5. Answer questions within the time limit
6. View your ranking on the leaderboard

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=quiz_app

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Optional: Redis Configuration (for production)
REDIS_URL=redis://localhost:6379
```

### Frontend Configuration
The frontend is configured to connect to the backend API. Update the API base URL in `src/config.ts` if needed:

```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

## 🚀 Deployment

### Backend Deployment
The backend can be deployed using various methods:

**Using Docker**:
```bash
# Build the image
docker build -t quiz-backend ./backend

# Run the container
docker run -p 8000:8000 quiz-backend
```

**Using Gunicorn (Production)**:
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment
Build the frontend for production:

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 🧪 Testing

### Backend Testing
```bash
cd backend
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Frontend Testing
```bash
cd frontend
# Run tests
npm test

# Run linting
npm run lint
```

## 📊 Analytics & History

The application automatically saves detailed analytics for completed quizzes:

- **Quiz Performance**: Success rates, average scores, completion times
- **Question Analytics**: Difficulty analysis, response distribution
- **Player Statistics**: Individual performance tracking
- **Session Data**: Start/end times, participant counts

Access analytics at `/history` in the backend or through the frontend interface.

## 🔌 API Documentation

Once the backend is running, visit:
- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the backend logs for error messages
3. Ensure all dependencies are properly installed
4. Verify MongoDB is running and accessible

## 🔮 Future Enhancements

- [ ] Redis integration for production storage
- [ ] User authentication and account management
- [ ] Advanced analytics dashboard
- [ ] Quiz templates and sharing
- [ ] Mobile app development
- [ ] Real-time chat functionality
- [ ] Quiz export/import features
- [ ] Advanced question types (multiple choice, true/false, etc.)

---

**Built with ❤️ using FastAPI, React, TypeScript, and MongoDB** 