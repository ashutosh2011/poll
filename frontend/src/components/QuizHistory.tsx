import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { History, Search, Users, Clock, Trophy, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import API_BASE_URL from '@/config';

interface QuizRecord {
  _id: string;
  quiz_name: string;
  session_code: string;
  start_time: string;
  end_time: string;
  questions: any[];
  final_leaderboard: Record<string, number>;
  total_players: number;
}

const QuizHistory = () => {
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);
  const [newQuizName, setNewQuizName] = useState('');
  const navigate = useNavigate();

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.quiz_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.session_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReplayQuiz = (quiz: QuizRecord) => {
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

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.slice(0, 5)); // Show only 5 most recent for the tab
      } else {
        console.error('Failed to fetch quiz history');
      }
    } catch (error) {
      console.error('Error fetching quiz history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
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

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-900 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Recent Quiz History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/history')}
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by quiz name or session code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading history...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? 'No quizzes found' : 'No quiz history yet'}</p>
            <p className="text-sm">Your previous quizzes will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {filteredQuizzes.map((quiz) => {
              const topPlayer = Object.entries(quiz.final_leaderboard)
                .sort(([,a], [,b]) => b - a)[0];
              
              return (
                <div
                  key={quiz._id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-slate-900 font-medium">{quiz.quiz_name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {quiz.session_code}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDate(quiz.start_time)}
                        </div>
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          {quiz.questions.length} questions
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {quiz.total_players} participants
                        </div>
                      </div>
                      
                      {topPlayer && (
                        <div className="mt-2 text-sm text-slate-600">
                          Winner: <span className="font-medium">{topPlayer[0]}</span> ({topPlayer[1]} points)
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/history/${quiz._id}`)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReplayQuiz(quiz)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Replay
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Replay Quiz</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Quiz Name
              </Label>
              <Input
                id="name"
                value={newQuizName}
                onChange={(e) => setNewQuizName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" onClick={handleConfirmReplay}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QuizHistory;
