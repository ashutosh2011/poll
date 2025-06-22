import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Rocket, Settings, BookOpen, Edit3, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QuestionBank from '@/components/QuestionBank';
import ManualQuestions from '@/components/ManualQuestions';
import QuizHistory from '@/components/QuizHistory';
import API_BASE_URL from '@/config';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  tags: string;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [quizName, setQuizName] = useState('');
  const [timer, setTimer] = useState(30);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<string[]>([]);
  const [manualQuestions, setManualQuestions] = useState<Question[]>([
    { id: '1', text: '', options: ['', '', '', ''], correctAnswer: 0, tags: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  // Check for replay data on component mount
  useEffect(() => {
    const replayData = localStorage.getItem('replayQuizData');
    if (replayData) {
      try {
        const { quizName: replayQuizName, questions } = JSON.parse(replayData);
        
        // Set the quiz name
        setQuizName(replayQuizName);
        
        // Convert replay questions to manual questions format
        const convertedQuestions = questions.map((q: any, index: number) => ({
          id: (index + 1).toString(),
          text: q.text,
          options: q.options,
          correctAnswer: q.options.findIndex((opt: string) => opt === q.correct_answer),
          tags: q.tags
        }));
        
        // Set the manual questions
        setManualQuestions(convertedQuestions);
        
        // Switch to manual questions tab to show the loaded questions
        setActiveTab('manual');
        
        // Clear the replay data from localStorage
        localStorage.removeItem('replayQuizData');
        
        toast({ 
          title: "Replay Quiz Loaded!", 
          description: `"${replayQuizName}" questions have been loaded. You can now customize and create the quiz.` 
        });
      } catch (error) {
        console.error('Error parsing replay data:', error);
        localStorage.removeItem('replayQuizData');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!quizName.trim()) {
      toast({ title: "Error", description: "Please enter a quiz name", variant: "destructive" });
      return;
    }

    const validManualQuestions = manualQuestions.filter(q => 
      q.text.trim() && q.options.every(opt => opt.trim())
    );

    const totalQuestions = selectedBankQuestions.length + validManualQuestions.length;

    if (totalQuestions === 0) {
      toast({ title: "Error", description: "Please add at least one question from the bank or create a manual question", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('quiz_name', quizName);
      formData.append('timer', timer.toString());
      
      // Add question bank IDs
      selectedBankQuestions.forEach(hash => {
        formData.append('question_bank_ids', hash);
      });
      
      // Add manual questions and options
      validManualQuestions.forEach((q, index) => {
        formData.append('questions', q.text);
        q.options.forEach(option => {
          formData.append('options', option);
        });
        formData.append(`correct_answer_q${index + 1}`, q.options[q.correctAnswer]);
        formData.append('manual_tags', q.tags || '');
      });

      const response = await fetch(`${API_BASE_URL}/api/create_quiz`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const sessionCode = data.session_code;
        if (sessionCode) {
          toast({ title: "Success!", description: `Quiz created! Session code: ${sessionCode}` });
          navigate(`/presenter/${sessionCode}`);
          return;
        }
      }

      toast({ title: "Error", description: "Failed to create quiz. Please try again.", variant: "destructive" });
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalQuestions = () => {
    const validManualQuestions = manualQuestions.filter(q => 
      q.text.trim() && q.options.every(opt => opt.trim())
    );
    return selectedBankQuestions.length + validManualQuestions.length;
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Your Quiz</h1>
              <p className="text-slate-600">Build engaging quizzes with questions from your bank or create new ones</p>
            </div>
            {getTotalQuestions() > 0 && (
              <div className="text-right">
                <p className="text-slate-900 font-semibold text-lg">{getTotalQuestions()} Questions Ready</p>
                <p className="text-slate-500 text-sm">
                  {selectedBankQuestions.length} from bank, {manualQuestions.filter(q => q.text.trim() && q.options.every(opt => opt.trim())).length} manual
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger 
                value="bank" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Question Bank
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Manual Questions
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Quiz Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700">Quiz Name *</Label>
                      <Input
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        placeholder="Enter a catchy quiz name"
                        className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700">Time per Question (seconds)</Label>
                      <Input
                        type="number"
                        value={timer}
                        onChange={(e) => setTimer(Number(e.target.value))}
                        min="10"
                        max="300"
                        className="bg-slate-50 border-slate-200 text-slate-900"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-blue-800 font-medium mb-2">Quick Start Tips</h3>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Use the Question Bank to save time with reusable questions</li>
                      <li>• Add manual questions for quiz-specific content</li>
                      <li>• Browse your history to replay successful quizzes</li>
                      <li>• Recommended: 30-60 seconds per question</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bank">
              <QuestionBank 
                selectedQuestions={selectedBankQuestions}
                onQuestionsChange={setSelectedBankQuestions}
              />
            </TabsContent>

            <TabsContent value="manual">
              <ManualQuestions 
                questions={manualQuestions}
                setQuestions={setManualQuestions}
              />
            </TabsContent>

            <TabsContent value="history">
              <QuizHistory />
            </TabsContent>
          </Tabs>

          {/* Create Quiz Button - Always Visible */}
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              type="submit"
              disabled={isSubmitting || getTotalQuestions() === 0 || !quizName.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isSubmitting ? (
                "Creating Quiz..."
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Create Quiz ({getTotalQuestions()})
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
