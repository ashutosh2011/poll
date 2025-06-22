import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit3 } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  tags: string;
}

interface ManualQuestionsProps {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
}

const ManualQuestions = ({ questions, setQuestions }: ManualQuestionsProps) => {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      tags: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) }
        : q
    ));
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-slate-900 flex items-center">
          <Edit3 className="w-5 h-5 mr-2" />
          Manual Questions
        </CardTitle>
        <Button
          type="button"
          onClick={addQuestion}
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No manual questions yet</p>
            <p className="text-sm">Add custom questions for this quiz</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {questions.map((question, questionIndex) => (
              <Card key={question.id} className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <h4 className="text-slate-900 font-medium">Question {questionIndex + 1}</h4>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                    placeholder="Enter your question"
                    className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500"
                  />
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">Options (select correct answer)</Label>
                    <RadioGroup
                      value={question.correctAnswer.toString()}
                      onValueChange={(value) => updateQuestion(question.id, 'correctAnswer', Number(value))}
                    >
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`q${question.id}-opt${optionIndex}`}
                            className="border-slate-400 text-green-600"
                          />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-500 flex-1"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700">Tags (comma-separated)</Label>
                    <Input
                      value={question.tags}
                      onChange={(e) => updateQuestion(question.id, 'tags', e.target.value)}
                      placeholder="e.g., math, algebra, equations"
                      className="border-slate-200"
                    />
                    <p className="text-xs text-slate-500">Add tags to categorize your question</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualQuestions;
