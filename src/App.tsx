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

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      
      if (!res.ok) throw new Error('API Error'); 

      const data = await res.json();
      setActions(data.functionCalls || []);
      setStatus(data.calendarStatus || 'Agent execution complete.');
    } catch (error) {
      console.error(error);
      setStatus('System Error: Agent failed to respond. Check console logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="border-b border-gray-800 pb-8">
          <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2 min-w-fit leading-tight py-2">
            ShipMate Agent
          </h1>
          <p className="text-gray-400 text-lg">Autonomous Productivity & Calendar Execution</p>
        </header>

        {/* TERMINAL INPUT */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your deadline, crisis, or goal..."
            className="w-full bg-transparent text-xl text-white placeholder-gray-600 focus:outline-none resize-none h-28"
          />
          
          <div className="flex flex-wrap gap-2 mt-2 mb-6">
            {quickPrompts.map((qp, i) => (
              <button key={i} onClick={() => setPrompt(qp)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg px-3 py-1.5 transition">
                {qp}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <button onClick={toggleListening} className={`text-sm px-4 py-2 rounded-lg ${isListening ? 'bg-red-900 text-red-200' : 'bg-gray-800'}`}>
              {isListening ? '🎙️ Stop Listening' : '🎙️ Start Voice Input'}
            </button>
            <button
              onClick={deployAgent}
              disabled={loading || !prompt}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition"
            >
              {loading ? 'Processing...' : 'Deploy Agent'}
            </button>
          </div>
        </div>

        {/* ACTION PIPELINE */}
        {actions.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] flex-1 bg-gray-800"></div>
              <h3 className="text-[10px] font-bold text-gray-500 tracking-[0.2em] uppercase">Executed Pipeline</h3>
              <div className="h-[1px] flex-1 bg-gray-800"></div>
            </div>
            
            {actions.map((action, index) => (
              <div key={index} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex items-start gap-4 hover:border-indigo-500/30 transition">
                <div className="text-2xl bg-gray-950 p-3 rounded-xl border border-gray-800">🗓️</div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">{action.args.title}</h4>
                  <p className="text-xs font-mono text-gray-400">
                    Slot: {new Date(action.args.start_time).toLocaleString()}
                  </p>
                </div>
                <div className="text-green-400 bg-green-900/20 px-3 py-1 rounded-full text-[10px] border border-green-500/20 font-bold">
                  ✓ Confirmed
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
