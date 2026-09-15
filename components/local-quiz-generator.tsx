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
  imageUrl?: string;
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
  const [customQuestions, setCustomQuestions] = useState<QuizQuestion[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTab, setUploadTab] = useState<'json' | 'csv' | 'manual'>('json');
  const [manualQuestion, setManualQuestion] = useState<Partial<QuizQuestion>>({ type: 'multiple', question: '', options: ['', '', '', ''], correct: 0, explanation: '', points: 10 });
  const [notification, setNotification] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  const startQuiz = () => {
    let bank = config.category === 'custom' && customQuestions.length > 0
      ? [...customQuestions]
      : [...QUIZ_BANKS[config.category]?.questions || []];
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

  // ──── Upload Handlers ────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const questions = Array.isArray(data) ? data : data.questions || [];
          const validated = questions.map((q: any, i: number) => ({
            id: q.id || `upload_${Date.now()}_${i}`,
            type: q.type || 'multiple',
            question: q.question || q.text || '',
            options: q.options || q.choices || ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            correct: q.correct !== undefined ? q.correct : q.answer || 0,
            explanation: q.explanation || q.reason || '',
            points: q.points || 10,
            imageUrl: q.imageUrl || q.image || '',
          }));
          setCustomQuestions(validated);
          setConfig(p => ({...p, category: 'custom'}));
          notify(`✅ Uploaded ${validated.length} questions from JSON`);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const questions = lines.slice(1).map((line, i) => {
            const cols = line.split(',');
            const q: any = { id: `csv_${Date.now()}_${i}`, type: 'multiple', points: 10, options: ['', '', '', ''], correct: 0 };
            headers.forEach((h, hi) => {
              const val = cols[hi]?.trim() || '';
              if (h === 'question' || h === 'text') q.question = val;
              else if (h === 'option1' || h === 'a') q.options[0] = val;
              else if (h === 'option2' || h === 'b') q.options[1] = val;
              else if (h === 'option3' || h === 'c') q.options[2] = val;
              else if (h === 'option4' || h === 'd') q.options[3] = val;
              else if (h === 'correct' || h === 'answer') q.correct = parseInt(val) || 0;
              else if (h === 'explanation' || h === 'reason') q.explanation = val;
              else if (h === 'points') q.points = parseInt(val) || 10;
              else if (h === 'image' || h === 'imageurl') q.imageUrl = val;
            });
            return q;
          });
          setCustomQuestions(questions);
          setConfig(p => ({...p, category: 'custom'}));
          notify(`✅ Uploaded ${questions.length} questions from CSV`);
        }
      } catch (err) {
        notify('❌ Error parsing file. Check format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImageUpload = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCustomQuestions(prev => prev.map(q => q.id === questionId ? {...q, imageUrl: url} : q));
      notify('✅ Image uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addManualQuestion = () => {
    if (!manualQuestion.question?.trim()) { notify('❌ Enter a question'); return; }
    const newQ: QuizQuestion = {
      id: `manual_${Date.now()}`,
      type: manualQuestion.type || 'multiple',
      question: manualQuestion.question || '',
      options: (manualQuestion.options || []).filter(o => o.trim()),
      correct: manualQuestion.correct || 0,
      explanation: manualQuestion.explanation || '',
      points: manualQuestion.points || 10,
      imageUrl: manualQuestion.imageUrl || '',
    };
    setCustomQuestions(prev => [...prev, newQ]);
    setManualQuestion({ type: 'multiple', question: '', options: ['', '', '', ''], correct: 0, explanation: '', points: 10 });
    notify('✅ Question added');
  };

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
    notify('🗑️ Question removed');
  };

  const exportQuiz = () => {
    const data = { title: config.title, description: config.description, category: config.category, questions: customQuestions.length > 0 ? customQuestions : QUIZ_BANKS[config.category]?.questions || [] };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-quiz.json`; a.click();
    notify('📥 Quiz exported');
  };

  const downloadSampleJSON = () => {
    const sample = [{ type: 'multiple', question: 'What is 2+2?', options: ['3', '4', '5', '6'], correct: 1, explanation: '2+2 equals 4', points: 10 }, { type: 'boolean', question: 'The sky is blue', options: ['True', 'False'], correct: 0, explanation: 'The sky appears blue', points: 10 }, { type: 'fill', question: 'What planet do we live on?', options: [], correct: 'earth', explanation: 'We live on Earth', points: 10 }];
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sample-quiz.json'; a.click();
    notify('📥 Sample downloaded');
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Choose Category</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium">📤 Upload Quiz</button>
                  <button onClick={exportQuiz} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium">📥 Export Quiz</button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setConfig(p => ({...p, category: cat}))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${config.category===cat?'bg-amber-600/20 border-amber-500':'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                    <span className="text-3xl">{QUIZ_BANKS[cat].icon}</span>
                    <span className="text-sm font-medium">{QUIZ_BANKS[cat].label}</span>
                    <span className="text-xs text-zinc-500">{QUIZ_BANKS[cat].questions.length} questions</span>
                  </button>
                ))}
                {customQuestions.length > 0 && (
                  <button onClick={() => setConfig(p => ({...p, category: 'custom'}))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${config.category==='custom'?'bg-amber-600/20 border-amber-500':'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                    <span className="text-3xl">📤</span>
                    <span className="text-sm font-medium">My Upload</span>
                    <span className="text-xs text-zinc-500">{customQuestions.length} questions</span>
                  </button>
                )}
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
                    <div>📚 {config.category === 'custom' ? customQuestions.length : QUIZ_BANKS[config.category]?.questions.length || 0} questions</div>
                    <div>⏱️ {Math.floor(config.timeLimit/60)} min {config.timeLimit%60} sec</div>
                    <div>✅ Pass: {config.passingScore}%</div>
                    <div>🎯 {config.difficulty} difficulty</div>
                    {customQuestions.length > 0 && <div>📤 {customQuestions.length} custom questions uploaded</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Questions List */}
            {customQuestions.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">📤 Uploaded Questions ({customQuestions.length})</h3>
                  <button onClick={() => { setCustomQuestions([]); setConfig(p=>({...p, category:'javascript'})); }} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customQuestions.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-xs text-zinc-500 w-8">{i+1}</span>
                      {q.imageUrl && <img src={q.imageUrl} className="w-8 h-8 rounded object-cover" alt="" />}
                      <span className="flex-1 text-sm truncate">{q.question}</span>
                      <span className="text-xs text-zinc-500 capitalize">{q.type}</span>
                      <span className="text-xs text-amber-400">{q.points}pts</span>
                      <button onClick={() => removeCustomQuestion(q.id)} className="text-red-400 text-xs hover:text-red-300">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* ──── UPLOAD MODAL ──── */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowUpload(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-[700px] max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">📤 Upload Quiz Questions</h3>
              <button onClick={() => setShowUpload(false)} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Upload Tabs */}
            <div className="flex gap-2 mb-4">
              {(['json', 'csv', 'manual'] as const).map(tab => (
                <button key={tab} onClick={() => setUploadTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize ${uploadTab === tab ? 'bg-amber-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  {tab === 'json' ? '📄 JSON File' : tab === 'csv' ? '📊 CSV File' : '✍️ Manual Entry'}
                </button>
              ))}
            </div>

            {/* JSON Upload */}
            {uploadTab === 'json' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-xl border-2 border-dashed border-zinc-600 hover:border-amber-500 transition-colors text-center">
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  <div className="text-4xl mb-3">📄</div>
                  <div className="font-medium mb-1">Drop JSON file here or click to browse</div>
                  <div className="text-xs text-zinc-500 mb-3">Supports .json files with quiz questions</div>
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium">Choose File</button>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-sm font-medium mb-2">Expected JSON Format:</div>
                  <pre className="text-xs text-zinc-400 overflow-auto max-h-40">{`[
  {
    "question": "What is 2+2?",
    "type": "multiple",
    "options": ["3", "4", "5", "6"],
    "correct": 1,
    "explanation": "2+2 equals 4",
    "points": 10,
    "imageUrl": "optional-image-url"
  }
]`}</pre>
                  <button onClick={downloadSampleJSON} className="mt-2 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs">📥 Download Sample</button>
                </div>
              </div>
            )}

            {/* CSV Upload */}
            {uploadTab === 'csv' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-xl border-2 border-dashed border-zinc-600 hover:border-amber-500 transition-colors text-center">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                  <div className="text-4xl mb-3">📊</div>
                  <div className="font-medium mb-1">Drop CSV file here or click to browse</div>
                  <div className="text-xs text-zinc-500 mb-3">Headers: question, option1/a, option2/b, option3/c, option4/d, correct/answer, explanation, points, image</div>
                  <label htmlFor="csv-upload" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium cursor-pointer">Choose File</label>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-xl">
                  <div className="text-sm font-medium mb-2">Expected CSV Format:</div>
                  <pre className="text-xs text-zinc-400 overflow-auto max-h-40">{`question,option1,option2,option3,option4,correct,explanation,points
What is 2+2?,3,4,5,6,1,2+2 equals 4,10
Is sky blue?,Yes,No,,,0,The sky is blue,10`}</pre>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {uploadTab === 'manual' && (
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Add Question Manually</span>
                    <select value={manualQuestion.type} onChange={e => setManualQuestion(p => ({...p, type: e.target.value as any}))}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm">
                      <option value="multiple">Multiple Choice</option>
                      <option value="boolean">True/False</option>
                      <option value="fill">Fill in Blank</option>
                    </select>
                  </div>
                  <textarea value={manualQuestion.question} onChange={e => setManualQuestion(p => ({...p, question: e.target.value}))}
                    placeholder="Enter your question..." rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y" />
                  <input type="text" value={manualQuestion.imageUrl || ''} onChange={e => setManualQuestion(p => ({...p, imageUrl: e.target.value}))}
                    placeholder="Image URL (optional)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
                  {manualQuestion.type === 'multiple' && (
                    <div className="space-y-2">
                      {(manualQuestion.options || []).map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input type="radio" name="correct" checked={manualQuestion.correct === i} onChange={() => setManualQuestion(p => ({...p, correct: i}))} className="accent-amber-500" />
                          <input type="text" value={opt} onChange={e => { const opts = [...(manualQuestion.options || [])]; opts[i] = e.target.value; setManualQuestion(p => ({...p, options: opts})); }}
                            placeholder={`Option ${i+1}`} className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm" />
                        </div>
                      ))}
                    </div>
                  )}
                  {manualQuestion.type === 'boolean' && (
                    <div className="flex gap-2">
                      {[0, 1].map(i => (
                        <button key={i} onClick={() => setManualQuestion(p => ({...p, correct: i}))}
                          className={`flex-1 py-2 rounded-lg text-sm ${manualQuestion.correct === i ? 'bg-amber-600' : 'bg-zinc-800'}`}>
                          {i === 0 ? '✅ True' : '❌ False'}
                        </button>
                      ))}
                    </div>
                  )}
                  {manualQuestion.type === 'fill' && (
                    <input type="text" value={String(manualQuestion.correct || '')} onChange={e => setManualQuestion(p => ({...p, correct: e.target.value}))}
                      placeholder="Correct answer" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm" />
                  )}
                  <textarea value={manualQuestion.explanation} onChange={e => setManualQuestion(p => ({...p, explanation: e.target.value}))}
                    placeholder="Explanation (optional)" rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-y" />
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-zinc-400">Points:</label>
                    <input type="number" value={manualQuestion.points} onChange={e => setManualQuestion(p => ({...p, points: Number(e.target.value)}))}
                      className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm" min={1} />
                    <button onClick={addManualQuestion} className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-medium">➕ Add Question</button>
                  </div>
                </div>

                {/* Added questions preview */}
                {customQuestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Added Questions ({customQuestions.length})</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {customQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded text-xs">
                          <span className="text-zinc-500">{i+1}.</span>
                          {q.imageUrl && <img src={q.imageUrl} className="w-6 h-6 rounded object-cover" alt="" />}
                          <span className="flex-1 truncate">{q.question}</span>
                          <button onClick={() => removeCustomQuestion(q.id)} className="text-red-400">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUpload(false)} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ──── NOTIFICATION ──── */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm z-50 animate-pulse">{notification}</div>
      )}

      {/* Hidden file input for images */}
      <input type="file" accept="image/*" className="hidden" id="image-upload" />
    </div>
  );
}
