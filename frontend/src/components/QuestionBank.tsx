import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Trash2, BookOpen, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import API_BASE_URL from '@/config';

interface Question {
  hash: string;
  text: string;
  options: string[];
  correct_answer: string;
  tags: string[];
}

interface QuestionBankProps {
  selectedQuestions: string[];
  onQuestionsChange: (questionHashes: string[]) => void;
}

const QuestionBank = ({ selectedQuestions, onQuestionsChange }: QuestionBankProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    tags: ''
  });

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text && q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => q.tags && q.tags.includes(tag.toLowerCase()));
    return matchesSearch && matchesTags;
  });

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestion.text.trim() || newQuestion.options.some(opt => !opt.trim())) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('question_text', newQuestion.text);
      newQuestion.options.forEach((option, index) => {
        formData.append(`option${index + 1}`, option);
      });
      formData.append('correct_answer', newQuestion.options[newQuestion.correctAnswer]);
      formData.append('tags', newQuestion.tags);

      const response = await fetch(`${API_BASE_URL}/api/question-bank/add`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Success!", description: "Question added to bank" });
        setNewQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0, tags: '' });
        setIsAddDialogOpen(false);
        // Refresh questions list
        fetchQuestions();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.detail || "Failed to add question", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (hash: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-bank/delete/${hash}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        toast({ title: "Success!", description: "Question deleted" });
        setQuestions(questions.filter(q => q.hash !== hash));
        // Remove from selected if it was selected
        if (selectedQuestions.includes(hash)) {
          onQuestionsChange(selectedQuestions.filter(h => h !== hash));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({ title: "Error", description: errorData.detail || "Failed to delete question", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleQuestionSelect = (hash: string) => {
    if (selectedQuestions.includes(hash)) {
      onQuestionsChange(selectedQuestions.filter(h => h !== hash));
    } else {
      onQuestionsChange([...selectedQuestions, hash]);
    }
  };

  const fetchQuestions = async () => {
    // This would be implemented when backend is ready
    // For now, using mock data
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-bank`);
      if(response.ok) {
        const data = await response.json();
        console.log('Fetched questions:', data);
        setQuestions(data);
      }
    } catch(e) {
      // ignore
      console.error('Failed to fetch questions:', e);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/question-bank/tags`);
      if(response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch(e) {
      console.error('Failed to fetch tags:', e);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSelectAllByTag = (tag: string) => {
    const questionsWithTag = filteredQuestions.filter(q => 
      q.tags && q.tags.includes(tag.toLowerCase())
    );
    
    const questionHashesWithTag = questionsWithTag.map(q => q.hash);
    const newSelectedQuestions = [...selectedQuestions];
    
    // Add questions that aren't already selected
    questionHashesWithTag.forEach(hash => {
      if (!newSelectedQuestions.includes(hash)) {
        newSelectedQuestions.push(hash);
      }
    });
    
    onQuestionsChange(newSelectedQuestions);
    
    const newlyAdded = questionHashesWithTag.filter(hash => !selectedQuestions.includes(hash));
    if (newlyAdded.length > 0) {
      toast({ 
        title: "Questions Selected!", 
        description: `Added ${newlyAdded.length} question${newlyAdded.length !== 1 ? 's' : ''} with tag "${tag}"` 
      });
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, []);

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-900 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Question Bank
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Add New Question to Bank</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Question Text</Label>
                <Input
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Enter your question"
                  className="border-slate-200"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-700">Answer Options (select the correct one)</Label>
                <RadioGroup
                  value={newQuestion.correctAnswer.toString()}
                  onValueChange={(value) => setNewQuestion({ ...newQuestion, correctAnswer: Number(value) })}
                >
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`new-opt${index}`} />
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 border-slate-200"
                      />
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700">Tags (comma-separated)</Label>
                <Input
                  value={newQuestion.tags}
                  onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                  placeholder="e.g., math, algebra, equations"
                  className="border-slate-200"
                />
                <p className="text-xs text-slate-500">Add tags to categorize your question (e.g., subject, topic, difficulty)</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add to Bank</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-500 pl-10"
          />
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-slate-700 text-sm font-medium">Filter by Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const questionsWithTag = filteredQuestions.filter(q => 
                  q.tags && q.tags.includes(tag.toLowerCase())
                );
                const selectedQuestionsWithTag = questionsWithTag.filter(q => 
                  selectedQuestions.includes(q.hash)
                );
                
                return (
                  <div key={tag} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                    {questionsWithTag.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSelectAllByTag(tag)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                          selectedQuestionsWithTag.length === questionsWithTag.length
                            ? 'bg-green-100 border-green-300 text-green-700'
                            : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
                        }`}
                        title={`Select all ${questionsWithTag.length} question${questionsWithTag.length !== 1 ? 's' : ''} with tag "${tag}"`}
                      >
                        {selectedQuestionsWithTag.length === questionsWithTag.length ? 'All' : `+${questionsWithTag.length}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? 'No questions found' : 'No questions in bank yet'}</p>
            <p className="text-sm">Add questions to reuse them across multiple quizzes</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {filteredQuestions.map((question) => (
              <div
                key={question.hash}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedQuestions.includes(question.hash)
                    ? 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => handleQuestionSelect(question.hash)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-slate-900 font-medium mb-2">{question.text}</p>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      {question.options.map((option, index) => (
                        <span
                          key={index}
                          className={`text-slate-600 ${
                            option === question.correct_answer ? 'text-green-600 font-medium' : ''
                          }`}
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                    {question.tags && question.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {selectedQuestions.includes(question.hash) && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.hash);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedQuestions.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm font-medium">
              {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected from bank
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionBank;
