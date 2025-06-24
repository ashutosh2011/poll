import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Trophy, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

const AudienceView = () => {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const nickname = searchParams.get('nickname') || 'Anonymous';
  const { state, isConnected, error, joinError, vote } = useQuizSocket(sessionCode!, nickname);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Handle join errors - redirect to home
  useEffect(() => {
    if (joinError) {
      alert(joinError);
      navigate('/');
    }
  }, [joinError, navigate]);

  // Reset voting state when question changes
  useEffect(() => {
    setHasVoted(false);
    setSelectedOption(null);
  }, [state?.question_index]);

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

  const handleVote = (option: string) => {
    if (!hasVoted) {
      vote(option);
      setHasVoted(true);
      setSelectedOption(option);
    }
  };

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
        <p>Joining quiz session...</p>
      </div>
    </div>;
  }

  const myScore = state.players[nickname]?.score || 0;
  const myRank = Object.entries(state.players)
    .sort(([,a], [,b]) => b.score - a.score)
    .findIndex(([player]) => player === nickname) + 1;

  const renderLobby = () => (
    <div className="space-y-6">
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white mb-2">Welcome, {nickname}!</CardTitle>
          <div className="flex flex-col items-center space-y-2">
            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2">
              Session: {sessionCode}
            </Badge>
            <Badge variant="outline" className="border-white/50 text-white px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {state.audience_count} players connected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="pt-6">
          <div className="text-center text-white">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Waiting for the quiz to start...</h3>
            <p className="text-purple-200">The presenter will start the quiz shortly. Get ready!</p>
          </div>
        </CardContent>
      </Card>

      {Object.keys(state.players).length > 1 && (
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Other Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(state.players)
                .filter(player => player !== nickname)
                .map((player) => (
                  <div key={player} className="bg-white/20 rounded-lg p-2 text-center">
                    <p className="text-white text-sm font-medium">{player}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderQuestion = () => (
    <div className="space-y-6">
      {/* Header with progress and timer */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-white/50 text-white px-3 py-1">
          Question {(state.question_index || 0) + 1} of {state.total_questions}
        </Badge>
        {timeLeft !== null && (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-white" />
            <div className={`text-white font-mono text-lg ${timeLeft <= 5 ? 'text-red-300 animate-pulse' : ''}`}>
              {timeLeft}s
            </div>
          </div>
        )}
      </div>

      <Progress 
        value={((state.question_index || 0) + 1) / (state.total_questions || 1) * 100} 
        className="h-2 bg-white/20" 
      />

      {/* Question */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-xl text-white text-center">
            {state.question}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-4">
        {state.options?.map((option, index) => {
          const isSelected = selectedOption === option;
          const isDisabled = hasVoted;
          
          return (
            <Button
              key={index}
              onClick={() => handleVote(option)}
              disabled={isDisabled}
              className={`
                h-auto p-6 text-left text-wrap relative transition-all duration-300 transform
                ${isSelected 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-105 shadow-lg' 
                  : isDisabled
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-white/20 hover:bg-white/30 text-white hover:scale-105'
                }
                ${!isDisabled ? 'hover:shadow-lg' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{option}</span>
                {isSelected && (
                  <CheckCircle className="w-6 h-6 ml-2" />
                )}
              </div>
            </Button>
          );
        })}
      </div>

      {hasVoted && (
        <Card className="backdrop-blur-sm bg-green-500/20 border-green-400/50">
          <CardContent className="pt-4">
            <div className="text-center text-white">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
              <p className="font-medium">Vote submitted!</p>
              <p className="text-sm text-green-200">You selected: {selectedOption}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Stats */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="pt-4">
          <div className="flex items-center justify-center space-x-6 text-white">
            <div className="text-center">
              <div className="text-xl font-bold">{myScore}</div>
              <div className="text-xs text-purple-200">Your Score</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">#{myRank}</div>
              <div className="text-xs text-purple-200">Your Rank</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      {/* Question and Results */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-white text-center mb-4">
            {state.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.options?.map((option, index) => {
            const votes = state.results?.[option] || 0;
            const isCorrect = option === state.correct_answer;
            const isMyChoice = option === selectedOption;
            const maxVotes = Math.max(...Object.values(state.results || {}));
            const percentage = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`font-medium text-sm ${
                    isCorrect ? 'text-green-300' : 
                    isMyChoice ? 'text-yellow-300' : 'text-white'
                  }`}>
                    {option} 
                    {isCorrect && ' ✓'}
                    {isMyChoice && !isCorrect && ' (your choice)'}
                  </span>
                  <span className="text-white text-sm">{votes}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      isCorrect 
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : isMyChoice
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
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

      {/* My Performance */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardContent className="pt-4">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${
              selectedOption === state.correct_answer ? 'text-green-300' : 'text-orange-300'
            }`}>
              {selectedOption === state.correct_answer ? '🎉 Correct!' : '❌ Incorrect'}
            </div>
            <div className="flex items-center justify-center space-x-6 text-white">
              <div className="text-center">
                <div className="text-xl font-bold">{myScore}</div>
                <div className="text-sm text-purple-200">Your Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">#{myRank}</div>
                <div className="text-sm text-purple-200">Your Rank</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Leaderboard */}
      {state.scores && (
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center">
              <Trophy className="w-5 h-5 mr-2" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(state.scores)
                .sort(([,a], [,b]) => b.score - a.score)
                .slice(0, 3)
                .map(([player, { score }], index) => (
                  <div key={player} className={`flex items-center justify-between p-3 rounded-lg ${
                    player === nickname ? 'bg-yellow-500/30 border border-yellow-400' : 'bg-white/20'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        'bg-orange-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-medium ${player === nickname ? 'text-yellow-200' : 'text-white'}`}>
                        {player === nickname ? 'You' : player}
                      </span>
                    </div>
                    <span className={`font-bold ${player === nickname ? 'text-yellow-200' : 'text-white'}`}>
                      {score}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFinished = () => (
    <div className="space-y-6 text-center">
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white mb-4">🎉 Quiz Complete! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold mb-4 ${
            myRank === 1 ? 'text-yellow-300' :
            myRank <= 3 ? 'text-green-300' :
            'text-white'
          }`}>
            {myRank === 1 ? '🥇 You Won!' :
             myRank === 2 ? '🥈 2nd Place!' :
             myRank === 3 ? '🥉 3rd Place!' :
             `#${myRank} Place`}
          </div>
          <div className="text-white mb-6">
            <div className="text-3xl font-bold">{myScore} points</div>
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
                  player === nickname ? 'bg-yellow-500/30 border border-yellow-400' :
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
                    <span className={`font-medium ${player === nickname ? 'text-yellow-200' : 'text-white'}`}>
                      {player === nickname ? 'You' : player}
                    </span>
                    {index < 3 && (
                      <span className="text-xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                  <span className={`font-bold ${player === nickname ? 'text-yellow-200' : 'text-white'}`}>
                    {score}
                  </span>
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">QuizLive</h1>
          <p className="text-purple-100 text-sm">Hey {nickname}! Ready to play?</p>
        </div>

        {state.state === 'LOBBY' && renderLobby()}
        {state.state === 'QUESTION' && renderQuestion()}
        {state.state === 'RESULTS' && renderResults()}
        {state.state === 'FINISHED' && renderFinished()}
      </div>
    </div>
  );
};

export default AudienceView;
