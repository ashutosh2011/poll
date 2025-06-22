import { useParams } from 'react-router-dom';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Play, BarChart3, ArrowRight, Trophy, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

const PresenterView = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const { state, isConnected, error, startQuiz, showResults, nextQuestion } = useQuizSocket(sessionCode!, 'Presenter');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (state?.state === 'QUESTION' && state.timer) {
      setTimeLeft(state.timer);
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state?.state, state?.timer, state?.question_index]);

  if (!sessionCode) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50">
      <p className="text-red-600">Invalid session code</p>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <p className="text-red-600 text-center">{error}</p>
        </CardContent>
      </Card>
    </div>;
  }

  if (!isConnected || !state) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Connecting to quiz session...</p>
      </div>
    </div>;
  }

  const renderLobby = () => (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl text-white mb-2">Quiz Lobby</CardTitle>
          <div className="flex items-center justify-center space-x-4">
            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 text-lg">
              Session: {sessionCode}
            </Badge>
            <Badge variant="outline" className="border-white/50 text-white px-4 py-2 text-lg">
              <Users className="w-4 h-4 mr-2" />
              {state.audience_count} players
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {Object.keys(state.players).length > 0 && (
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Connected Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.keys(state.players).map((player) => (
                <div key={player} className="bg-white/20 rounded-lg p-3 text-center">
                  <p className="text-white font-medium">{player}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button 
          onClick={startQuiz}
          disabled={Object.keys(state.players).length === 0}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-xl text-xl"
        >
          <Play className="w-6 h-6 mr-2" />
          Start Quiz
        </Button>
        {Object.keys(state.players).length === 0 && (
          <p className="text-purple-200 mt-2">Waiting for players to join...</p>
        )}
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="space-y-6">
      {/* Progress and Timer */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-white/50 text-white px-4 py-2">
          Question {(state.question_index || 0) + 1} of {state.total_questions}
        </Badge>
        {timeLeft !== null && (
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-white" />
            <div className="text-white font-mono text-xl min-w-[3ch]">
              {timeLeft}s
            </div>
          </div>
        )}
      </div>

      <Progress 
        value={((state.question_index || 0) + 1) / (state.total_questions || 1) * 100} 
        className="h-2 bg-white/20" 
      />

      {/* Question Display */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white text-center">
            {state.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.options?.map((option, index) => (
              <div 
                key={index} 
                className="bg-white/20 rounded-lg p-4 text-center border border-white/30"
              >
                <p className="text-white font-medium text-lg">{option}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Stats */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-center space-x-6 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{state.audience_count}</div>
              <div className="text-sm text-purple-200">Connected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={showResults}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl"
        >
          <BarChart3 className="w-5 h-5 mr-2" />
          Show Results
        </Button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      {/* Question and Results */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-xl text-white text-center mb-4">
            {state.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.options?.map((option, index) => {
            const votes = state.results?.[option] || 0;
            const isCorrect = option === state.correct_answer;
            const maxVotes = Math.max(...Object.values(state.results || {}));
            const percentage = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isCorrect ? 'text-green-300' : 'text-white'}`}>
                    {option} {isCorrect && '✓'}
                  </span>
                  <span className="text-white">{votes} votes</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      isCorrect 
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {state.scores && Object.keys(state.scores).length > 0 && (
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(state.scores)
                .sort(([,a], [,b]) => b.score - a.score)
                .slice(0, 5)
                .map(([player, { score }], index) => (
                  <div key={player} className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-white/30 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-white font-medium">{player}</span>
                    </div>
                    <span className="text-white font-bold">{score}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Button 
          onClick={nextQuestion}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl"
        >
          {((state.question_index || 0) + 1) >= (state.total_questions || 0) ? (
            "Finish Quiz"
          ) : (
            <>
              <ArrowRight className="w-5 h-5 mr-2" />
              Next Question
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderFinished = () => (
    <div className="space-y-6 text-center">
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-3xl text-white mb-4">🎉 Quiz Complete! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white mb-6">
            <div className="text-2xl font-bold mb-4">Final Results</div>
            <div className="text-lg">Total Participants: {Object.keys(state.players).length}</div>
            <div className="text-lg">Questions Answered: {state.total_questions}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Final Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(state.players)
              .sort(([,a], [,b]) => b.score - a.score)
              .map(([player, { score }], index) => (
                <div key={player} className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400/30 to-yellow-600/30' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300/30 to-gray-500/30' :
                  index === 2 ? 'bg-gradient-to-r from-orange-400/30 to-orange-600/30' :
                  'bg-white/20'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-white/30 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{player}</span>
                    {index < 3 && (
                      <span className="text-xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                  <span className="text-white font-bold">{score}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl"
        >
          🏠 Go Home
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Presenter Dashboard</h1>
          <p className="text-purple-100">Control your quiz and engage with your audience</p>
        </div>

        {state.state === 'LOBBY' && renderLobby()}
        {state.state === 'QUESTION' && renderQuestion()}
        {state.state === 'RESULTS' && renderResults()}
        {state.state === 'FINISHED' && renderFinished()}
      </div>
    </div>
  );
};

export default PresenterView;
