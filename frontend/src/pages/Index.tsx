
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Play } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [nickname, setNickname] = useState('');
  const navigate = useNavigate();

  const handleJoinQuiz = () => {
    if (sessionCode.trim() && nickname.trim()) {
      navigate(`/join/${sessionCode.toUpperCase()}?nickname=${encodeURIComponent(nickname)}`);
    }
  };

  const handleCreateQuiz = () => {
    toast.success('Currently not available');
    // navigate('/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Quiz<span className="text-yellow-400">Live</span>
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Create engaging real-time quizzes and compete with friends. Join a quiz or create your own!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Join Quiz Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Join a Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-100">Session Code</label>
                <Input
                  placeholder="Enter 4-letter code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="bg-white/20 border-white/30 text-white placeholder:text-purple-200 focus:bg-white/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-100">Your Nickname</label>
                <Input
                  placeholder="Enter your name"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-purple-200 focus:bg-white/30"
                />
              </div>
              <Button 
                onClick={handleJoinQuiz}
                disabled={!sessionCode.trim() || !nickname.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 mr-2" />
                Join Quiz
              </Button>
            </CardContent>
          </Card>

          {/* Create Quiz Card */}
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Create a Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-100 text-center mb-6">
                Set up your own quiz with custom questions and host a fun competition!
              </p>
              <Button 
                onClick={handleCreateQuiz}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Quiz
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-purple-200 text-sm">
            Real-time quiz platform • Perfect for classrooms, team building, and fun with friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
