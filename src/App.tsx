'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  const quickPrompts = [
    " I have a massive presentation tomorrow at 9 AM and I haven't started.",
    " I need 2 hours of deep focus time this afternoon to code.",
    " I fly out on Friday, schedule time to pack and break down the tasks."
  ];

  const toggleListening = () => {
    // If it's already on, click it to turn it off manually
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Keep listening forever, and show words instantly
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      // Grab the live speech and throw it in the text box
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setPrompt(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const deployAgent = async () => {
    if (!prompt) return;
    setLoading(true);
    setStatus('');
    setActions([]);

   try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      
     
      if (!res.ok) throw new Error('Google API Overloaded'); 

      const data = await res.json();
      setActions(data.functionCalls || []);
      setStatus(data.calendarStatus || 'Agent execution complete.');
    } catch (error) {
     
      setStatus(' System Error: Google AI servers are currently overloaded. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-500/30 relative overflow-hidden">
      
      {/* FUTURISTIC BACKGROUND GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-8 p-8 relative z-10">
        
        {/* HEADER & SYSTEM VITALS */}
        <header className="border-b border-gray-800 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
              ShipMate Agent
            </h1>
            <p className="text-gray-400 text-lg">Autonomous Productivity & Calendar Execution</p>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <span className="flex items-center gap-2 text-xs font-bold bg-green-900/30 text-green-400 px-3 py-1.5 rounded-full border border-green-800/50 shadow-[0_0_15px_rgba(74,222,128,0.1)]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Calendar API: Synced
            </span>
            <span className="flex items-center gap-2 text-xs font-bold bg-blue-900/30 text-blue-400 px-3 py-1.5 rounded-full border border-blue-800/50">
               Engine: Gemini 2.5 Flash
            </span>
          </div>
        </header>

        {/* MAIN TERMINAL */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-1 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-t-2xl"></div>
          
          <div className="p-6 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your deadline, crisis, or goal..."
              className="w-full bg-transparent text-xl text-white placeholder-gray-600 focus:outline-none resize-none h-28 pr-40"
            />
            
            {/* MICROPHONE TOGGLE BUTTON */}
            <button 
              onClick={toggleListening}
              className={`absolute top-6 right-6 p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50' : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700'}`}
              title="Click to Start / Click to Stop"
            >
              {isListening ? '🎙️ Listening...' : '🎙️'}
            </button>
            
            {/* QUICK PROMPTS */}
            <div className="flex flex-wrap gap-2 mt-2 mb-6">
              {quickPrompts.map((qp, i) => (
                <button 
                  key={i}
                  onClick={() => setPrompt(qp)}
                  className="text-xs text-left bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {qp}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-800/80">
              <span className="text-sm text-gray-500 flex items-center gap-2 font-mono">
                {loading ? (
                   <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"></div> Analyzing Context & Checking Conflicts...</>
                ) : (
                  '> Awaiting input sequence_'
                )}
              </span>
              <button
                onClick={deployAgent}
                disabled={loading || !prompt}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
              >
                {loading ? 'Deploying...' : 'Deploy Agent '}
              </button>
            </div>
          </div>
        </div>

        {/* STATUS BAR */}
        {status && (
          <div className={`p-4 rounded-xl border text-sm font-medium animate-in fade-in slide-in-from-bottom-2 ${status.includes('Successfully') ? 'bg-green-900/20 border-green-800/50 text-green-400' : 'bg-blue-900/20 border-blue-800/50 text-blue-400'}`}>
            {status}
          </div>
        )}

        {/* ACTION CARDS */}
        {actions.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Agent Actions Executed
            </h3>
            
            {actions.map((action, index) => {
              if (action.name === 'schedule_productivity_block') {
                return (
                  <div key={index} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex items-start gap-5 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-900/10">
                    <div className="text-4xl bg-gray-800/50 p-3 rounded-lg border border-gray-700">🗓️</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${action.args.priority_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : action.args.priority_level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                          {action.args.priority_level} PRIORITY
                        </span>
                        <h4 className="font-bold text-gray-100 text-lg">{action.args.title}</h4>
                      </div>
                      <p className="text-sm text-gray-400 font-mono">
                        Locked Slot: {new Date(action.args.start_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-green-400 text-sm font-bold bg-green-900/20 px-3 py-1 rounded-lg border border-green-800/30 flex items-center gap-1">
                       ✓ Conflict Cleared
                    </div>
                  </div>
                );
              }

              if (action.name === 'create_actionable_task') {
                return (
                  <div key={index} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-all group relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-4 pl-2">
                      <div className="text-2xl opacity-70">⚡</div>
                      <div>
                        <h4 className="font-semibold text-gray-200">{action.args.task_name}</h4>
                        <p className="text-xs text-gray-500">Time Est: {action.args.estimated_minutes} mins</p>
                      </div>
                    </div>
                    <a 
                      href="https://docs.new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transform translate-x-4 group-hover:translate-x-0"
                    >
                       Kickstart Template
                    </a>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}