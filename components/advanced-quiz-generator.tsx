'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizData {
  topic: string;
  type: string;
  difficulty: string;
  purpose: string;
  numQuestions: number;
  timeLimit: number;
  color: string;
  questions: QuizQuestion[];
}

export default function AdvancedQuizGenerator() {
  const [quiz, setQuiz] = useState<QuizData>({
    topic: '',
    type: 'Multiple Choice',
    difficulty: 'Medium',
    purpose: 'Education',
    numQuestions: 5,
    timeLimit: 300,
    color: '#6366f1',
    questions: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'code'>('config');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !quizComplete) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && quizStarted && !quizComplete) {
      setQuizComplete(true);
    }
  }, [timeLeft, quizStarted, quizComplete]);

  const generateQuiz = async () => {
    if (!quiz.topic) {
      alert('Please enter a quiz topic');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a ${quiz.difficulty} ${quiz.type} quiz about "${quiz.topic}".

Generate ${quiz.numQuestions} questions. Return JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Because..."
    }
  ]
}`;

      const response = await api.ai.chat({
        messages: [{ role: 'user', content: prompt }],
        system: 'You are an educational content creator. Create accurate, engaging quiz questions with clear explanations.'
      });

      const parsed = JSON.parse(response.response);
      setQuiz(prev => ({
        ...prev,
        questions: (parsed.questions || []).map((q: any, i: number) => ({
          id: (i + 1).toString(),
          ...q,
        })),
      }));
      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setTimeLeft(quiz.timeLimit);
  };

  const handleAnswer = (index: number) => {
    if (showAnswer) return;
    setSelectedAnswer(index);
    setShowAnswer(true);
    if (index === quiz.questions[currentQuestion]?.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizComplete(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateEmbedCode = (): string => {
    return `<!-- Interactive Quiz: ${quiz.topic} -->
<div id="quiz-container" style="max-width:600px;margin:0 auto;font-family:sans-serif;">
  <div style="background:${quiz.color};color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
    <h2 style="margin:0">${quiz.topic} Quiz</h2>
    <p style="margin:5px 0 0;opacity:0.8">${quiz.questions.length} Questions • ${quiz.difficulty}</p>
  </div>
  <div id="quiz-content" style="background:white;padding:20px;border:1px solid #eee;border-radius:0 0 12px 12px;">
    <p>Loading quiz...</p>
  </div>
</div>
<script>
const quizData = ${JSON.stringify({ questions: quiz.questions.map(q => ({ q: q.question, o: q.options, a: q.correctIndex, e: q.explanation })) })};
let current=0,score=0,answered=false;
function renderQuiz(){
  const c=document.getElementById('quiz-content');
  if(current>=quizData.questions.length){
    c.innerHTML='<div style="text-align:center;padding:20px"><h3>Quiz Complete!</h3><p>Score: '+score+'/'+quizData.questions.length+'</p></div>';
    return;
  }
  const q=quizData.questions[current];
  c.innerHTML='<div style="margin-bottom:15px;color:#666">Question '+(current+1)+'/'+quizData.questions.length+'</div><p style="font-size:16px;font-weight:bold;margin-bottom:15px">'+q.q+'</p>'+
    q.o.map((o,i)=>'<button onclick="checkAnswer('+i+')" style="display:block;width:100%;padding:12px;margin:8px 0;border:2px solid #ddd;border-radius:8px;background:white;cursor:pointer;text-align:left;font-size:14px" id="opt'+i+'">'+o+'</button>').join('');
  answered=false;
}
function checkAnswer(i){
  if(answered)return;answered=true;
  const q=quizData.questions[current];
  document.getElementById('opt'+q.a).style.background='#d4edda';document.getElementById('opt'+q.a).style.borderColor='#28a745';
  if(i!==q.a){document.getElementById('opt'+i).style.background='#f8d7da';document.getElementById('opt'+i).style.borderColor='#dc3545';}
  else score++;
  setTimeout(()=>{current++;renderQuiz()},1500);
}
renderQuiz();
</script>`;
  };

  const q = quiz.questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Quiz Generator</h2>
          <p className="text-zinc-400">Create interactive quizzes with scoring and timer</p>
        </div>
        <div className="flex gap-2">
          {['config', 'preview', 'code'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-violet-600' : 'bg-zinc-700'}`}>
              {tab === 'config' ? '⚙️ Config' : tab === 'preview' ? '🎮 Play' : '📝 Embed'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">❓ Quiz Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Topic *</label>
                <input type="text" value={quiz.topic} onChange={(e) => setQuiz(prev => ({ ...prev, topic: e.target.value }))} placeholder="JavaScript, History, Science..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Quiz Type</label>
                  <select value={quiz.type} onChange={(e) => setQuiz(prev => ({ ...prev, type: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2">
                    {['Multiple Choice', 'True/False', 'Mixed'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Difficulty</label>
                  <select value={quiz.difficulty} onChange={(e) => setQuiz(prev => ({ ...prev, difficulty: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2">
                    {['Easy', 'Medium', 'Hard', 'Mixed'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Questions</label>
                  <input type="number" value={quiz.numQuestions} onChange={(e) => setQuiz(prev => ({ ...prev, numQuestions: parseInt(e.target.value) || 5 }))} min="3" max="20" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Time (seconds)</label>
                  <input type="number" value={quiz.timeLimit} onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 300 }))} min="60" step="30" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Color</label>
                  <input type="color" value={quiz.color} onChange={(e) => setQuiz(prev => ({ ...prev, color: e.target.value }))} className="w-full h-10 rounded-lg" />
                </div>
              </div>
              <button onClick={generateQuiz} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 py-3 rounded-lg font-medium">
                {isGenerating ? '⏳ Generating Quiz...' : '✨ Generate Quiz'}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'preview' ? (
        <div className="max-w-2xl mx-auto">
          {quiz.questions.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-4xl mb-4">❓</p>
              <p className="text-zinc-400">No questions generated yet. Go to Config to generate a quiz.</p>
            </div>
          ) : quizComplete ? (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center" style={{ backgroundColor: quiz.color }}>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
              </div>
              <div className="p-8 text-center">
                <div className="text-6xl font-bold mb-4" style={{ color: quiz.color }}>
                  {score}/{quiz.questions.length}
                </div>
                <p className="text-xl text-gray-600 mb-2">
                  {Math.round((score / quiz.questions.length) * 100)}% Correct
                </p>
                <p className="text-gray-500 mb-6">
                  {score === quiz.questions.length ? 'Perfect Score! 🏆' :
                   score >= quiz.questions.length * 0.7 ? 'Great Job! 👏' :
                   score >= quiz.questions.length * 0.5 ? 'Good Effort! 💪' : 'Keep Learning! 📚'}
                </p>
                <button onClick={startQuiz} className="px-6 py-3 text-white rounded-lg font-medium" style={{ backgroundColor: quiz.color }}>
                  🔄 Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: quiz.color }}>
                <div>
                  <div className="font-bold">{quiz.topic}</div>
                  <div className="text-sm opacity-80">Question {currentQuestion + 1} of {quiz.questions.length}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl">{formatTime(timeLeft)}</div>
                  <div className="text-sm opacity-80">Score: {score}</div>
                </div>
              </div>

              {/* Progress */}
              <div className="h-2 bg-gray-200">
                <div className="h-full transition-all" style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`, backgroundColor: quiz.color }} />
              </div>

              {/* Question */}
              {q && (
                <div className="p-8">
                  <h3 className="text-xl font-semibold mb-6">{q.question}</h3>
                  <div className="space-y-3">
                    {q.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          showAnswer
                            ? i === q.correctIndex
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : i === selectedAnswer
                              ? 'border-red-500 bg-red-50 text-red-800'
                              : 'border-gray-200 text-gray-400'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>

                  {showAnswer && (
                    <div className={`mt-4 p-4 rounded-lg ${selectedAnswer === q.correctIndex ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-semibold">{selectedAnswer === q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
                      <p className="text-sm mt-1">{q.explanation}</p>
                    </div>
                  )}

                  {showAnswer && (
                    <button onClick={nextQuestion} className="mt-6 px-6 py-3 text-white rounded-lg font-medium" style={{ backgroundColor: quiz.color }}>
                      {currentQuestion < quiz.questions.length - 1 ? 'Next Question →' : 'See Results'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Embed Code</h3>
            <button onClick={() => navigator.clipboard.writeText(generateEmbedCode())} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm">📋 Copy Code</button>
          </div>
          <pre className="bg-zinc-800 rounded-lg p-4 overflow-auto max-h-[400px] text-sm font-mono text-green-400">
            {generateEmbedCode()}
          </pre>
        </div>
      )}
    </div>
  );
}
