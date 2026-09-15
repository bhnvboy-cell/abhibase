'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/* ──────────────── TYPES ──────────────── */
interface QuizQuestion {
  id: string;
  type: 'multiple' | 'boolean' | 'fill' | 'code';
  question: string;
  options: string[];
  correct: number | string;
  explanation: string;
  points: number;
}

interface QuizConfig {
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  timeLimit: number;
  showExplanations: boolean;
  randomize: boolean;
  passingScore: number;
  maxAttempts: number;
  certificateEnabled: boolean;
  primaryColor: string;
}

/* ──────────────── QUESTION BANKS ──────────────── */
const QUIZ_BANKS: Record<string, { label: string; icon: string; questions: QuizQuestion[] }> = {
  javascript: {
    label: 'JavaScript', icon: '🟨',
    questions: [
      { id:'j1', type:'multiple', question:'What is the output of typeof null?', options:['"null"','"object"','"undefined"','"boolean"'], correct:1, explanation:'typeof null returns "object" - this is a well-known bug in JavaScript.', points:10 },
      { id:'j2', type:'multiple', question:'Which method adds an element to the end of an array?', options:['unshift()','push()','pop()','shift()'], correct:1, explanation:'push() adds elements to the end, unshift() adds to the beginning.', points:10 },
      { id:'j3', type:'boolean', question:'JavaScript is a statically-typed language.', options:['True','False'], correct:1, explanation:'JavaScript is dynamically typed - variable types are determined at runtime.', points:10 },
      { id:'j4', type:'multiple', question:'What does "===" check in JavaScript?', options:['Value only','Value and type','Reference only','None'], correct:1, explanation:'=== is the strict equality operator checking both value and type.', points:10 },
      { id:'j5', type:'multiple', question:'Which is NOT a JavaScript data type?', options:['Symbol','undefined','Float','BigInt'], correct:2, explanation:'Float is not a JavaScript data type. JS has Number, which handles both integers and floats.', points:10 },
    ]
  },
  python: {
    label: 'Python', icon: '🐍',
    questions: [
      { id:'p1', type:'multiple', question:'What is the output of print(2 ** 3)?', options:['6','8','5','9'], correct:1, explanation:'** is the exponentiation operator. 2 ** 3 = 8.', points:10 },
      { id:'p2', type:'multiple', question:'Which keyword defines a function in Python?', options:['function','func','def','define'], correct:2, explanation:'def is used to define functions in Python.', points:10 },
      { id:'p3', type:'boolean', question:'Python lists are immutable.', options:['True','False'], correct:1, explanation:'Lists are mutable. Tuples are immutable.', points:10 },
      { id:'p4', type:'multiple', question:'What is a lambda function?', options:['A named function','An anonymous function','A class method','A generator'], correct:1, explanation:'Lambda functions are anonymous, single-expression functions.', points:10 },
      { id:'p5', type:'multiple', question:'Which module provides regex support in Python?', options:['regex','re','pattern','match'], correct:1, explanation:'The "re" module provides regular expression support.', points:10 },
    ]
  },
  react: {
    label: 'React', icon: '⚛️',
    questions: [
      { id:'r1', type:'multiple', question:'What hook is used for side effects?', options:['useState','useEffect','useContext','useReducer'], correct:1, explanation:'useEffect handles side effects like API calls and subscriptions.', points:10 },
      { id:'r2', type:'boolean', question:'React components must return a single root element.', options:['True','False'], correct:0, explanation:'React components must return a single root element (or use Fragment).', points:10 },
      { id:'r3', type:'multiple', question:'What is JSX?', options:['A template language','JavaScript XML syntax','A CSS framework','A testing library'], correct:1, explanation:'JSX is a syntax extension that allows writing HTML-like code in JavaScript.', points:10 },
      { id:'r4', type:'multiple', question:'Which method is used to update state in a class component?', options:['this.state = {}','this.setState()','this.update()','this.modify()'], correct:1, explanation:'setState() is used to update state and trigger re-renders.', points:10 },
      { id:'r5', type:'multiple', question:'What is the virtual DOM?', options:['A copy of the browser DOM','A server-side DOM','A testing framework','A CSS-in-JS solution'], correct:0, explanation:'The virtual DOM is a lightweight copy of the real DOM used for efficient updates.', points:10 },
    ]
  },
  general: {
    label: 'General Knowledge', icon: '🌍',
    questions: [
      { id:'g1', type:'multiple', question:'What does HTML stand for?', options:['Hyper Text Markup Language','High Tech Modern Language','Home Tool Markup Language','Hyper Transfer Markup Language'], correct:0, explanation:'HTML stands for HyperText Markup Language.', points:10 },
      { id:'g2', type:'multiple', question:'What year was the first iPhone released?', options:['2005','2006','2007','2008'], correct:2, explanation:'The first iPhone was released on June 29, 2007.', points:10 },
      { id:'g3', type:'boolean', question:'The human body has 206 bones.', options:['True','False'], correct:0, explanation:'An adult human body has 206 bones.', points:10 },
      { id:'g4', type:'multiple', question:'What is the speed of light?', options:['300,000 km/s','150,000 km/s','500,000 km/s','100,000 km/s'], correct:0, explanation:'Light travels at approximately 300,000 km/s.', points:10 },
      { id:'g5', type:'multiple', question:'Which planet has the most moons?', options:['Jupiter','Saturn','Uranus','Neptune'], correct:1, explanation:'Saturn has the most known moons with 146 confirmed.', points:10 },
    ]
  },
  science: {
    label: 'Science', icon: '🔬',
    questions: [
      { id:'s1', type:'multiple', question:'What is the chemical symbol for gold?', options:['Go','Gd','Au','Ag'], correct:2, explanation:'Au comes from the Latin word "aurum" meaning gold.', points:10 },
      { id:'s2', type:'multiple', question:'What is the powerhouse of the cell?', options:['Nucleus','Ribosome','Mitochondria','Golgi body'], correct:2, explanation:'Mitochondria produce ATP through cellular respiration.', points:10 },
      { id:'s3', type:'boolean', question:'Water boils at 100°C at sea level.', options:['True','False'], correct:0, explanation:'Pure water boils at 100°C (212°F) at standard atmospheric pressure.', points:10 },
      { id:'s4', type:'multiple', question:'What gas do plants absorb?', options:['Oxygen','Carbon Dioxide','Nitrogen','Hydrogen'], correct:1, explanation:'Plants absorb CO2 during photosynthesis.', points:10 },
      { id:'s5', type:'multiple', question:'What is the SI unit of force?', options:['Joule','Watt','Newton','Pascal'], correct:2, explanation:'The Newton (N) is the SI unit of force.', points:10 },
    ]
  },
};

const CATEGORIES = Object.keys(QUIZ_BANKS);

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function LocalQuizGenerator() {
  const [mode, setMode] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [config, setConfig] = useState<QuizConfig>({
    title: 'Knowledge Quiz', description: 'Test your knowledge', category: 'javascript',
    difficulty: 'Mixed', timeLimit: 300, showExplanations: true, randomize: true,
    passingScore: 70, maxAttempts: 3, certificateEnabled: true, primaryColor: '#6366f1',
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startQuiz = () => {
    let bank = [...QUIZ_BANKS[config.category]?.questions || []];
    if (config.randomize) bank = bank.sort(() => Math.random() - 0.5);
    if (config.difficulty !== 'Mixed') bank = bank.filter((_, i) => config.difficulty === 'Easy' ? i < 3 : config.difficulty === 'Medium' ? i < 4 : true);
    setQuestions(bank);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft(config.timeLimit);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setMode('quiz');
  };

  useEffect(() => {
    if (mode !== 'quiz' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, timeLeft]);

  useEffect(() => { if (timeLeft <= 0 && mode === 'quiz' && questions.length > 0) finishQuiz(); }, [timeLeft]);

  const currentQ = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const selectAnswer = (idx: number | string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const correct = currentQ.type === 'fill' ? String(idx).toLowerCase() === String(currentQ.correct).toLowerCase() : idx === currentQ.correct;
    setIsCorrect(correct);
    setAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
    if (correct) { setScore(s => s + currentQ.points); setStreak(s => { const n = s + 1; if (n > bestStreak) setBestStreak(n); return n; }); }
    else { setStreak(0); }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMode('results');
  };

  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = percentage >= config.passingScore;
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  // ──── SETUP MODE ────
  if (mode === 'setup') {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Quiz Builder</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Category Selection */}
            <div>
              <h3 className="text-lg font-bold mb-3">Choose Category</h3>
              <div className="grid grid-cols-5 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setConfig(p => ({...p, category: cat}))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${config.category===cat?'bg-amber-600/20 border-amber-500':'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                    <span className="text-3xl">{QUIZ_BANKS[cat].icon}</span>
                    <span className="text-sm font-medium">{QUIZ_BANKS[cat].label}</span>
                    <span className="text-xs text-zinc-500">{QUIZ_BANKS[cat].questions.length} questions</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold">Quiz Settings</h3>
                <div><label className="block text-xs text-zinc-400 mb-1">Title</label><input type="text" value={config.title} onChange={e => setConfig(p=>({...p,title:e.target.value}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Description</label><textarea value={config.description} onChange={e => setConfig(p=>({...p,description:e.target.value}))} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Difficulty</label>
                  <div className="flex gap-2">{(['Easy','Medium','Hard','Mixed'] as const).map(d => (
                    <button key={d} onClick={() => setConfig(p=>({...p,difficulty:d}))} className={`flex-1 py-2 rounded-lg text-xs ${config.difficulty===d?'bg-amber-600':'bg-zinc-800 hover:bg-zinc-700'}`}>{d}</button>
                  ))}</div>
                </div>
                <div><label className="block text-xs text-zinc-400 mb-1">Time Limit (seconds)</label><input type="number" value={config.timeLimit} onChange={e => setConfig(p=>({...p,timeLimit:Number(e.target.value)}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-zinc-400 mb-1">Passing Score (%)</label><input type="number" value={config.passingScore} onChange={e => setConfig(p=>({...p,passingScore:Number(e.target.value)}))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="font-bold">Advanced Options</h3>
                {[
                  { label: 'Show Explanations', key: 'showExplanations' },
                  { label: 'Randomize Questions', key: 'randomize' },
                  { label: 'Enable Certificate', key: 'certificateEnabled' },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{opt.label}</span>
                    <button onClick={() => setConfig(p=>({...p,[opt.key]:!p[opt.key as keyof QuizConfig]}))}
                      className={`w-10 h-5 rounded-full transition-colors ${(config as any)[opt.key]?'bg-amber-600':'bg-zinc-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${(config as any)[opt.key]?'translate-x-5':'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-sm font-medium mb-1">Quiz Preview</div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div>📚 {QUIZ_BANKS[config.category]?.questions.length || 0} questions</div>
                    <div>⏱️ {Math.floor(config.timeLimit/60)} min {config.timeLimit%60} sec</div>
                    <div>✅ Pass: {config.passingScore}%</div>
                    <div>🎯 {config.difficulty} difficulty</div>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={startQuiz} className="w-full py-4 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold text-lg transition-colors">🚀 Start Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  // ──── QUIZ MODE ────
  if (mode === 'quiz' && currentQ) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <span className="text-lg font-bold">{config.title}</span>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-mono ${timeLeft < 60 ? 'text-red-400' : 'text-zinc-400'}`}>⏱️ {formatTime(timeLeft)}</span>
            <span className="text-sm text-zinc-400">Score: <span className="text-amber-400 font-bold">{score}</span></span>
            <span className="text-sm text-zinc-400">🔥 {streak}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-800 shrink-0">
          <div className="h-full bg-amber-500 transition-all" style={{width:`${progress}%`}} />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs text-zinc-500 mb-2">Question {currentIdx + 1} of {questions.length} • {currentQ.points} points</div>
            <h2 className="text-2xl font-bold mb-6">{currentQ.question}</h2>

            <div className="space-y-3">
              {currentQ.type === 'multiple' && currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectOpt = i === currentQ.correct;
                let bg = 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700';
                if (selectedAnswer !== null) {
                  if (isCorrectOpt) bg = 'bg-emerald-600/20 border-emerald-500';
                  else if (isSelected && !isCorrect) bg = 'bg-red-600/20 border-red-500';
                  else bg = 'bg-zinc-800/30 border-zinc-700/50';
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={selectedAnswer !== null}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${bg}`}>
                    <span className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {selectedAnswer !== null ? (isCorrectOpt ? '✓' : isSelected ? '✕' : String.fromCharCode(65+i)) : String.fromCharCode(65+i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}

              {currentQ.type === 'boolean' && ['True','False'].map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectOpt = i === currentQ.correct;
                let bg = 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700';
                if (selectedAnswer !== null) {
                  if (isCorrectOpt) bg = 'bg-emerald-600/20 border-emerald-500';
                  else if (isSelected && !isCorrect) bg = 'bg-red-600/20 border-red-500';
                }
                return (
                  <button key={i} onClick={() => selectAnswer(i)} disabled={selectedAnswer !== null}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${bg} ${i===0?'border-emerald-500/30':'border-red-500/30'}`}>
                    <span className="text-lg">{i===0 ? '✅' : '❌'} {opt}</span>
                  </button>
                );
              })}

              {currentQ.type === 'fill' && (
                <div className="flex gap-2">
                  <input type="text" value={selectedAnswer !== null ? String(selectedAnswer) : ''} onChange={e => setSelectedAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && selectedAnswer !== null) selectAnswer(selectedAnswer); }}
                    disabled={selectedAnswer !== null} placeholder="Type your answer..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg focus:border-amber-500 focus:outline-none" />
                  {selectedAnswer === null && <button onClick={() => selectAnswer(String(selectedAnswer || ''))} className="px-6 bg-amber-600 rounded-xl">Submit</button>}
                </div>
              )}
            </div>

            {/* Explanation */}
            {showExplanation && config.showExplanations && (
              <div className={`mt-6 p-4 rounded-xl border ${isCorrect ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-red-600/10 border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{isCorrect ? '🎉' : '💡'}</span>
                  <span className="font-bold">{isCorrect ? 'Correct!' : 'Not quite!'}</span>
                  {isCorrect && <span className="text-amber-400 text-sm">+{currentQ.points} points</span>}
                </div>
                <p className="text-sm text-zinc-300">{currentQ.explanation}</p>
              </div>
            )}

            {/* Next Button */}
            {selectedAnswer !== null && (
              <button onClick={nextQuestion}
                className="w-full mt-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-xl font-bold transition-colors">
                {currentIdx < questions.length - 1 ? 'Next Question →' : 'Finish Quiz →'}
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 shrink-0">
          <div className="flex gap-1 flex-wrap justify-center">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isAnswered = ans !== undefined;
              const isCorrectQ = isAnswered && (q.type === 'fill' ? String(ans).toLowerCase() === String(q.correct).toLowerCase() : ans === q.correct);
              return (
                <button key={q.id} onClick={() => { setCurrentIdx(i); setSelectedAnswer(answers[q.id] ?? null); setIsCorrect(isAnswered ? isCorrectQ : null); setShowExplanation(isAnswered); }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${i === currentIdx ? 'bg-amber-600 text-white' : isAnswered ? (isCorrectQ ? 'bg-emerald-600/30 text-emerald-400' : 'bg-red-600/30 text-red-400') : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ──── RESULTS MODE ────
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-zinc-950 text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className={`text-center p-8 rounded-2xl ${passed ? 'bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30' : 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30'}`}>
            <div className="text-6xl mb-4">{passed ? '🎉' : '📚'}</div>
            <h2 className="text-3xl font-bold mb-2">{passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
            <p className="text-zinc-400 mb-6">{passed ? 'You passed the quiz!' : 'You didn\'t pass this time, but every attempt is progress!'}</p>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-zinc-900/50 rounded-xl"><div className="text-3xl font-bold text-amber-400">{percentage}%</div><div className="text-xs text-zinc-500">Score</div></div>
              <div className="p-4 bg-zinc-900/50 rounded-xl"><div className="text-3xl font-bold text-emerald-400">{score}/{totalPoints}</div><div className="text-xs text-zinc-500">Points</div></div>
              <div className="p-4 bg-zinc-900/50 rounded-xl"><div className="text-3xl font-bold text-blue-400">{bestStreak}</div><div className="text-xs text-zinc-500">Best Streak</div></div>
              <div className="p-4 bg-zinc-900/50 rounded-xl"><div className="text-3xl font-bold text-zinc-300">{formatTime(config.timeLimit - timeLeft)}</div><div className="text-xs text-zinc-500">Time Used</div></div>
            </div>

            {config.certificateEnabled && passed && (
              <div className="p-6 bg-zinc-900/50 rounded-xl border border-amber-500/30 mb-6">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-lg font-bold text-amber-400">Certificate of Achievement</div>
                <div className="text-sm text-zinc-400 mt-2">Awarded for passing "{config.title}" with {percentage}%</div>
                <button onClick={() => { navigator.clipboard.writeText(`🏆 Certificate: ${config.title} - Score: ${percentage}% - Date: ${new Date().toLocaleDateString()}`); }} className="mt-3 px-4 py-2 bg-amber-600 rounded-lg text-sm">📋 Copy Certificate</button>
              </div>
            )}
          </div>

          {/* Question Review */}
          {config.showExplanations && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold mb-4">Question Review</h3>
              <div className="space-y-4">
                {questions.map((q, i) => {
                  const ans = answers[q.id];
                  const correct = q.type === 'fill' ? String(ans).toLowerCase() === String(q.correct).toLowerCase() : ans === q.correct;
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${correct ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-red-600/10 border-red-500/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{correct ? '✅' : '❌'}</span>
                        <span className="font-medium text-sm">Q{i+1}: {q.question}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setMode('setup')} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium">← Back to Setup</button>
            <button onClick={startQuiz} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 rounded-xl font-medium">🔄 Try Again</button>
          </div>
        </div>
      </div>
    </div>
  );
}
