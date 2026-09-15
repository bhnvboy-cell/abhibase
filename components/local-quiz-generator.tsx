'use client';

import { useState, useEffect } from 'react';
import { QUIZ_BANKS } from '@/lib/local-templates';

export default function LocalQuizGenerator() {
  const [quizConfig, setQuizConfig] = useState({
    topic: 'JavaScript',
    numQuestions: 5,
    difficulty: 'all',
    timeEnabled: true,
    timePerQuestion: 30,
    showExplanations: true,
    shuffleQuestions: true
  });

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !quizComplete) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && quizStarted && !quizComplete && quizConfig.timeEnabled) {
      handleNextQuestion();
    }
  }, [timeLeft, quizStarted, quizComplete]);

  const startQuiz = () => {
    const bank = QUIZ_BANKS[quizConfig.topic] || QUIZ_BANKS['General Knowledge'];
    let selected = bank.slice(0, quizConfig.numQuestions);
    if (quizConfig.shuffleQuestions) {
      selected = [...selected].sort(() => Math.random() - 0.5);
    }
    setQuestions(selected);
    setCurrentQuestion(0);
    setScore(0);
    setQuizComplete(false);
    setQuizStarted(true);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setTimeLeft(quizConfig.timePerQuestion);
  };

  const handleAnswer = (index: number) => {
    if (showAnswer) return;
    setSelectedAnswer(index);
    setShowAnswer(true);
    if (index === questions[currentQuestion].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setTimeLeft(quizConfig.timePerQuestion);
    } else {
      setQuizComplete(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const q = questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quiz Generator</h2>
        <p className="text-zinc-400">Create interactive quizzes instantly - no AI needed</p>
      </div>

      {!quizStarted ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Quiz Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Topic</label>
                <select value={quizConfig.topic} onChange={(e) => setQuizConfig(prev => ({ ...prev, topic: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                  {Object.keys(QUIZ_BANKS).map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Number of Questions</label>
                  <select value={quizConfig.numQuestions} onChange={(e) => setQuizConfig(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    {[3, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n} questions</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Time per Question</label>
                  <select value={quizConfig.timePerQuestion} onChange={(e) => setQuizConfig(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                    {[15, 30, 45, 60].map(t => (
                      <option key={t} value={t}>{t} seconds</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={quizConfig.timeEnabled} onChange={(e) => setQuizConfig(prev => ({ ...prev, timeEnabled: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Enable Timer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={quizConfig.showExplanations} onChange={(e) => setQuizConfig(prev => ({ ...prev, showExplanations: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Show Explanations</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={quizConfig.shuffleQuestions} onChange={(e) => setQuizConfig(prev => ({ ...prev, shuffleQuestions: e.target.checked }))} className="rounded" />
                  <span className="text-sm">Shuffle</span>
                </label>
              </div>
              <button onClick={startQuiz} className="w-full bg-violet-600 hover:bg-violet-700 py-3 rounded-lg font-medium">
                🎮 Start Quiz
              </button>
            </div>
          </div>
        </div>
      ) : quizComplete ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center bg-gradient-to-r from-violet-500 to-purple-500">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
            </div>
            <div className="p-8 text-center">
              <div className="text-6xl font-bold text-violet-600 mb-4">
                {score}/{questions.length}
              </div>
              <p className="text-xl text-gray-600 mb-2">
                {Math.round((score / questions.length) * 100)}% Correct
              </p>
              <p className="text-gray-500 mb-6">
                {score === questions.length ? 'Perfect Score! 🏆' :
                 score >= questions.length * 0.7 ? 'Great Job! 👏' :
                 score >= questions.length * 0.5 ? 'Good Effort! 💪' : 'Keep Learning! 📚'}
              </p>
              <button onClick={startQuiz} className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium">
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      ) : q ? (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 text-white flex justify-between items-center bg-gradient-to-r from-violet-500 to-purple-500">
              <div>
                <div className="font-bold">{quizConfig.topic}</div>
                <div className="text-sm opacity-80">Question {currentQuestion + 1} of {questions.length}</div>
              </div>
              <div className="text-right">
                {quizConfig.timeEnabled && (
                  <div className="font-bold text-xl">{formatTime(timeLeft)}</div>
                )}
                <div className="text-sm opacity-80">Score: {score}</div>
              </div>
            </div>

            <div className="h-2 bg-gray-200">
              <div className="h-full bg-violet-500 transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="p-8">
              <h3 className="text-xl font-semibold mb-6">{q.question}</h3>
              <div className="space-y-3">
                {q.options.map((opt: string, i: number) => (
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
                        : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                ))}
              </div>

              {showAnswer && quizConfig.showExplanations && (
                <div className={`mt-4 p-4 rounded-lg ${selectedAnswer === q.correctIndex ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="font-semibold">{selectedAnswer === q.correctIndex ? '✅ Correct!' : '❌ Incorrect'}</p>
                  <p className="text-sm mt-1">{q.explanation}</p>
                </div>
              )}

              {showAnswer && (
                <button onClick={handleNextQuestion} className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-lg font-medium">
                  {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
