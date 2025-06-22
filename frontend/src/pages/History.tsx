import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Search, Clock, Users, Trophy, Calendar, BarChart3, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import API_BASE_URL from '@/config';

interface QuizHistoryItem {
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

const History = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<QuizHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizHistoryItem | null>(null);
  const [newQuizName, setNewQuizName] = useState('');

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.quiz_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.session_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReplayQuiz = (e: React.MouseEvent, quiz: QuizHistoryItem) => {
    e.stopPropagation(); // Prevent card click
    setSelectedQuiz(quiz);
    setNewQuizName(`${quiz.quiz_name} (Replay)`);
    setReplayDialogOpen(true);
  };

  const handleConfirmReplay = () => {
    if (!selectedQuiz || !newQuizName.trim()) {
      toast({ title: "Error", description: "Please enter a quiz name", variant: "destructive" });
      return;
    }

    // Convert history questions to create quiz format
    const questions = selectedQuiz.questions.map(q => ({
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
    setSelectedQuiz(null);
    setNewQuizName('');
    
    // Navigate to create quiz page
    navigate('/create');
    
    toast({ 
      title: "Success!", 
      description: `Quiz "${newQuizName}" questions loaded. You can now customize and create the quiz.` 
    });
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch quiz history", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: "Error", description: "Network error while fetching history", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getTopPlayers = (leaderboard: Record<string, number>) => {
    return Object.entries(leaderboard)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Quiz History</h1>
          <p className="text-slate-600">View and analyze your past quiz sessions</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by quiz name or session code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading quiz history...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchTerm ? 'No quizzes found' : 'No quiz history yet'}
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Your completed quizzes will appear here'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/create')} className="bg-blue-600 hover:bg-blue-700">
                  Create Your First Quiz
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredQuizzes.map((quiz) => {
              const topPlayers = getTopPlayers(quiz.final_leaderboard);
              return (
                <Card 
                  key={quiz._id} 
                  className="bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/history/${quiz._id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-slate-900 text-xl mb-1">
                          {quiz.quiz_name}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(quiz.start_time)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(quiz.start_time, quiz.end_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {quiz.session_code}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleReplayQuiz(e, quiz)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Replay
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Users className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Participants</p>
                          <p className="font-semibold text-slate-900">{quiz.total_players}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Questions</p>
                          <p className="font-semibold text-slate-900">{quiz.questions.length}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Trophy className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Winner</p>
                          <p className="font-semibold text-slate-900">
                            {topPlayers[0] ? topPlayers[0][0] : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {topPlayers.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-500 mb-2">Top Performers</p>
                        <div className="flex space-x-4">
                          {topPlayers.map(([name, score], index) => (
                            <div key={name} className="flex items-center space-x-1">
                              <span className="text-lg">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                              <span className="text-sm font-medium text-slate-700">{name}</span>
                              <span className="text-sm text-slate-500">({score})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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
            {selectedQuiz && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                <p><strong>Original Quiz:</strong> {selectedQuiz.quiz_name}</p>
                <p><strong>Questions:</strong> {selectedQuiz.questions.length}</p>
                <p><strong>Previous Session:</strong> {selectedQuiz.session_code}</p>
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

export default History;
