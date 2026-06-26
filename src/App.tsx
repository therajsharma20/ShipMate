'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [processStep, setProcessStep] = useState(0); // Tracks the "Thinking" steps
  const [actions, setActions] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [activeModel, setActiveModel] = useState('Standby'); // Tracks the active model badge

  const quickPrompts = [
    "I have a massive presentation tomorrow at 9 AM and I haven't started.",
    "I need 2 hours of deep focus time this afternoon to code.",
    "I fly out on Friday, schedule time to pack and break down the tasks."
  ];

  const toggleListening = () => {
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
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
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
    setActiveModel('Initializing...');
    
    // UI Visual Animation: Faking the steps while fetch happens
    setProcessStep(1); 
    setTimeout(() => setProcessStep(2), 600);
    setTimeout(() => setProcessStep(3), 1500);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      
      if (!res.ok) throw new Error('API Error'); 

      const data = await res.json();
      
      // Step 4: The backend finished, now it's injecting into calendar
      setProcessStep(4);
      setActiveModel(data.modelUsed || 'gemini-3.5-flash'); // Set the actual model used

      setTimeout(() => {
        setLoading(false);
        setProcessStep(0);
        setActions(data.functionCalls || []);
        setStatus(data.calendarStatus || 'Agent execution complete.');
      }, 1200);

    } catch (error) {
      console.error(error);
      setLoading(false);
      setProcessStep(0);
      setStatus('System Error: Agent failed to respond. Check console logs.');
      setActiveModel('Error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER & GLOBAL BADGES */}
        <header className="border-b border-gray-800 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2 min-w-fit leading-tight py-2">
              ShipMate Agent
            </h1>
            <p className="text-gray-400 text-lg">Autonomous Productivity & Calendar Execution</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-800/50">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              System Online
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900/30 text-indigo-400 px-3 py-1 rounded-full border border-indigo-800/50">
              Engine: {activeModel}
            </span>
          </div>
        </header>

        {/* TERMINAL INPUT */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Describe your deadline, crisis, or goal..."
            className="w-full bg-transparent text-xl text-white placeholder-gray-600 focus:outline-none resize-none h-28 disabled:opacity-50"
          />
          
          <div className="flex flex-wrap gap-2 mt-2 mb-6">
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => setPrompt(qp)} disabled={loading} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 transition disabled:opacity-50 text-left">
                {qp}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800 relative z-10">
            <button onClick={toggleListening} disabled={loading} className={`text-sm px-4 py-2 rounded-lg font-bold transition-all ${isListening ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'}`}>
              {isListening ? '🎙️ Stop Listening' : '🎙️ Voice Input'}
            </button>
            <button
              onClick={deployAgent}
              disabled={loading || !prompt}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 transform hover:-translate-y-0.5"
            >
              Deploy Agent
            </button>
          </div>

          {/* PROGRESS PIPELINE OVERLAY */}
          {loading && (
            <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm z-20 flex flex-col justify-center px-10 animate-in fade-in duration-300">
              <h3 className="text-xs font-mono text-indigo-400 mb-6 tracking-widest">AGENT EXECUTION PIPELINE</h3>
              <div className="space-y-4 font-mono text-sm">
                <PipelineStep step={1} current={processStep} text="Authenticating Google Service Account..." />
                <PipelineStep step={2} current={processStep} text="Analyzing 24h Calendar Context..." />
                <PipelineStep step={3} current={processStep} text={`Running LLM Inference (${activeModel})...`} />
                <PipelineStep step={4} current={processStep} text="Executing Calendar API Injection..." />
              </div>
            </div>
          )}
        </div>

        {/* STATUS BAR */}
        {status && (
          <div className={`p-4 rounded-xl border text-sm font-bold font-mono animate-in fade-in slide-in-from-bottom-2 ${status.includes('Successfully') ? 'bg-green-900/20 border-green-800/50 text-green-400' : 'bg-red-900/20 border-red-800/50 text-red-400'}`}>
            {" > "} {status}
          </div>
        )}

        {/* ACTION PIPELINE */}
        {actions.length > 0 && !loading && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-gray-800"></div>
              <h3 className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">Executed Actions</h3>
              <div className="h-[1px] flex-1 bg-gray-800"></div>
            </div>
            
            {actions.map((action, index) => (
              <div key={index} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex items-start gap-5 hover:border-indigo-500/30 transition">
                <div className="text-3xl bg-gray-950 p-4 rounded-xl border border-gray-800 shadow-inner">🗓️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* PRIORITY BADGE */}
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${action.args.priority_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                      {action.args.priority_level || 'HIGH'} PRIORITY
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-100 text-xl mb-2">{action.args.title}</h4>
                  <div className="flex flex-wrap gap-2">
                     <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg font-mono">
                       {new Date(action.args.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(action.args.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                </div>
                <div className="text-green-400 bg-green-900/20 px-4 py-2 rounded-xl text-xs border border-green-500/20 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> Confirmed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Component for the Pipeline Animation
function PipelineStep({ step, current, text }: { step: number, current: number, text: string }) {
  const isPending = current < step;
  const isActive = current === step;
  const isDone = current > step;

  return (
    <div className={`flex items-center gap-3 transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
      <div className="w-6 h-6 flex items-center justify-center">
        {isDone ? <span className="text-green-500">✓</span> : isActive ? <span className="text-blue-500 animate-spin">⚙</span> : <span className="text-gray-600">-</span>}
      </div>
      <span className={`${isActive ? 'text-blue-400 animate-pulse' : isDone ? 'text-gray-300' : 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
}
