import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trophy, Clock, Target, TrendingUp, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API_BASE_URL from '@/config';

interface QuizHistoryDetail {
  _id: string;
  quiz_name: string;
  session_code: string;
  start_time: string;
  end_time: string;
  questions: Array<{
    question_text: string;
    options: string[];
    correct_answer: string;
    player_answers: Array<{
      nickname: string;
      answer: string;
      time_taken: number;
      correct: boolean;
      points_earned: number;
    }>;
    total_votes: Record<string, number>;
  }>;
  final_leaderboard: Record<string, number>;
  total_players: number;
}

const HistoryDetail = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizHistoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [newQuizName, setNewQuizName] = useState('');

  const handleReplayQuiz = () => {
    if (!quiz) return;
    setNewQuizName(`${quiz.quiz_name} (Replay)`);
    setReplayDialogOpen(true);
  };

  const handleConfirmReplay = () => {
    if (!quiz || !newQuizName.trim()) {
      toast({ title: "Error", description: "Please enter a quiz name", variant: "destructive" });
      return;
    }

    // Convert history questions to create quiz format
    const questions = quiz.questions.map(q => ({
      text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer
    }));

    // Store the replay data in localStorage
    localStorage.setItem('replayQuizData', JSON.stringify({
      quizName: newQuizName.trim(),
      questions: questions
    }));

    setReplayDialogOpen(false);
    setNewQuizName('');
    
    // Navigate to create quiz page
    navigate('/create');
    
    toast({ 
      title: "Success!", 
      description: `Quiz "${newQuizName}" questions loaded. You can now customize and create the quiz.` 
    });
  };

  const fetchQuizDetail = async () => {
    try {
      setIsLoading(true);
      // For now, we'll use the history endpoint and filter by ID
      // In a real implementation, there would be a dedicated endpoint
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        const foundQuiz = data.find((q: QuizHistoryDetail) => q._id === quizId);
        if (foundQuiz) {
          setQuiz(foundQuiz);
        } else {
          toast({ title: "Error", description: "Quiz not found", variant: "destructive" });
          navigate('/history');
        }
      } else {
        toast({ title: "Error", description: "Failed to fetch quiz details", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error fetching quiz detail:', error);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizDetail();
  }, [quizId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quiz details...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Not Found</h2>
          <Button onClick={() => navigate('/history')}>Back to History</Button>
        </div>
      </div>
    );
  }

  const leaderboardData = Object.entries(quiz.final_leaderboard)
    .sort(([,a], [,b]) => b - a)
    .map(([name, score], index) => ({ name, score, rank: index + 1 }));

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/history')}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">{quiz.quiz_name}</h1>
              <p className="text-slate-600">Session: {quiz.session_code} • {quiz.total_players} participants</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleReplayQuiz}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Replay Quiz
              </Button>
              <div className="text-right">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="font-semibold text-slate-900">
                  {new Date(quiz.end_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Questions</CardTitle>
              <Target className="h-4 w-4 ml-auto text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{quiz.questions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Participants</CardTitle>
              <TrendingUp className="h-4 w-4 ml-auto text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{quiz.total_players}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Duration</CardTitle>
              <Clock className="h-4 w-4 ml-auto text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Math.floor((new Date(quiz.end_time).getTime() - new Date(quiz.start_time).getTime()) / 60000)}m
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900">
                <Trophy className="w-5 h-5 mr-2" />
                Final Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardData.map((player, index) => (
                  <div key={player.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <span className="font-medium text-slate-900">{player.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{player.score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-900">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  score: {
                    label: "Score",
                    color: "#3b82f6",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leaderboardData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Question Analysis</h2>
          {quiz.questions.map((question, index) => {
            const voteData = Object.entries(question.total_votes).map(([option, votes]) => ({
              name: option,
              value: votes,
              isCorrect: option === question.correct_answer
            }));
            const totalVotes = Object.values(question.total_votes).reduce((a, b) => a + b, 0);
            const correctPercentage = question.total_votes[question.correct_answer] || 0;

            return (
              <Card key={index} className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    Question {index + 1}: {question.question_text}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Correct Answer: <strong>{question.correct_answer}</strong></span>
                    <span>Accuracy: <strong>{Math.round((correctPercentage / totalVotes) * 100)}%</strong></span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Vote Distribution</h4>
                      <ChartContainer
                        config={{
                          votes: {
                            label: "Votes",
                            color: "#3b82f6",
                          },
                        }}
                        className="h-[200px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={voteData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {voteData.map((entry, i) => (
                                <Cell 
                                  key={`cell-${i}`} 
                                  fill={entry.isCorrect ? '#10b981' : COLORS[i % COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Answer Breakdown</h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const votes = question.total_votes[option] || 0;
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                          const isCorrect = option === question.correct_answer;
                          
                          return (
                            <div key={optionIndex} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className={`${isCorrect ? 'font-semibold text-green-700' : 'text-slate-600'}`}>
                                  {option} {isCorrect && '✓'}
                                </span>
                                <span className="text-slate-500">{votes} ({Math.round(percentage)}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Replay Quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-name" className="text-slate-700">
                Quiz Name
              </Label>
              <Input
                id="quiz-name"
                value={newQuizName}
                onChange={(e) => setNewQuizName(e.target.value)}
                placeholder="Enter a name for the new quiz"
                className="bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>
            {quiz && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <p><strong>Original Quiz:</strong> {quiz.quiz_name}</p>
                <p><strong>Questions:</strong> {quiz.questions.length}</p>
                <p><strong>Previous Session:</strong> {quiz.session_code}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setReplayDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReplay}
                disabled={!newQuizName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Quiz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoryDetail;
