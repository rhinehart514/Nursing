
import React, { useState, useEffect, useRef } from 'react';
import { GameStatus, GameTurnResponse, ChatMessage, VitalSigns, VitalsCondition, VisualState, BowtieOptions } from './types';
import { startGame, submitAction } from './services/geminiService';
import VitalsMonitor from './components/VitalsMonitor';
import PatientVisual from './components/PatientVisual';
import ChatInterface from './components/ChatInterface';
import { INITIAL_VITALS } from './constants';
import { Stethoscope, Siren, Lock, Play, RefreshCw, ShieldCheck, BookOpen, ClipboardList, Award, AlertTriangle, Dna, Puzzle, Box, ArrowRight, FileUp, FileText, Upload, HeartPulse, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [vitals, setVitals] = useState<VitalSigns>(INITIAL_VITALS);
  const [visualState, setVisualState] = useState<VisualState>(VisualState.NORMAL);
  const [health, setHealth] = useState(100);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBowtie, setCurrentBowtie] = useState<BowtieOptions | undefined>(undefined);
  const [learningReport, setLearningReport] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  
  // Error Message state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to add messages
  const addMessage = (text: string, sender: 'user' | 'system' | 'ai') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(),
      sender,
      text,
      timestamp: Date.now()
    }]);
  };

  const handleStartGame = async (mode: 'random' | 'class' | 'upload', payload?: string) => {
    setGameStatus(GameStatus.LOADING);
    setMessages([]);
    setErrorMsg(null);
    setLearningReport([]);
    try {
      const turnData = await startGame(mode, payload);
      processTurn(turnData);
      setGameStatus(GameStatus.PLAYING);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to initialize simulation. Check your connection or API key.");
      setGameStatus(GameStatus.ERROR);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
        setErrorMsg("Please upload a valid PDF file.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        handleStartGame('upload', base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleUserAction = async (action: string) => {
    addMessage(action, 'user');
    setIsLoading(true);
    setCurrentBowtie(undefined); // Clear bowtie while processing

    try {
      const turnData = await submitAction(action);
      processTurn(turnData);
    } catch (err) {
      console.error(err);
      addMessage("System Error: Connection lost with the simulation server. Please try again.", 'system');
      setIsLoading(false);
    }
  };

  const processTurn = (data: GameTurnResponse) => {
    setVitals(data.vitalSigns);
    setHealth(data.patientHealth);
    if(data.visualState) setVisualState(data.visualState);

    // Add AI Narrative
    addMessage(data.narrative, 'ai');

    // Add Feedback if any (as system note)
    if (data.feedback) {
        setTimeout(() => {
           addMessage(data.feedback, 'system');
        }, 500);
    }
    
    setCurrentBowtie(data.bowtie);

    // Capture learning report if available
    if (data.learningReport) {
        setLearningReport(data.learningReport);
    }

    // Check win/loss state
    if (data.isGameOver) {
      setGameStatus(GameStatus.GAME_OVER);
    } else if (data.isVictory) {
      setGameStatus(GameStatus.VICTORY);
    }

    setIsLoading(false);
  };

  // Reset helper
  const resetGame = () => {
      setGameStatus(GameStatus.IDLE);
      setVitals(INITIAL_VITALS);
      setVisualState(VisualState.NORMAL);
      setHealth(100);
      setMessages([]);
      setCurrentBowtie(undefined);
      setLearningReport([]);
      setCustomTopic("");
  };

  // --- SCREEN: START ---
  if (gameStatus === GameStatus.IDLE) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl w-full text-center relative z-10">
           
           <div className="mb-8 flex justify-center">
             <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="p-5 bg-slate-800 rounded-full ring-1 ring-slate-700 relative shadow-2xl">
                    <Siren size={48} className="text-red-500" />
                </div>
             </div>
           </div>

           <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 font-mono tracking-tighter drop-shadow-lg">NIGHT SHIFT</h1>
           <p className="text-emerald-500 font-mono text-sm tracking-[0.2em] uppercase mb-12">Clinical Escape Room v2.2</p>
           
           {/* Error Banner */}
           {errorMsg && (
               <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded max-w-lg mx-auto">
                  {errorMsg}
               </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             
             {/* CARD 1: RANDOM MODE */}
             <div 
                onClick={() => handleStartGame('random', customTopic)}
                className="group bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-emerald-500 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:-translate-y-1 text-left relative overflow-hidden flex flex-col min-h-[280px]"
             >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Dna size={100} />
               </div>
               
               <div className="flex items-center mb-3">
                  <div className="p-3 bg-slate-800 rounded-lg mr-4 group-hover:bg-emerald-900/30 transition-colors">
                    <RefreshCw className="text-emerald-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Random Shift</h2>
               </div>
               
               <p className="text-slate-400 mb-4 text-xs leading-relaxed">
                 Procedural NGN Bowtie Challenges. Sepsis, MI, Stroke, or Trauma.
               </p>

               {/* Custom Topic Input */}
               <div className="mt-auto z-20 relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 ml-1">
                    Custom Topic (Optional)
                  </label>
                  <div className="relative group/input">
                    <input 
                        type="text" 
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Heart Failure, Peds..."
                        className="w-full bg-slate-950/50 border border-slate-700 text-emerald-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                    />
                    <button 
                        onClick={() => handleStartGame('random', customTopic)}
                        className="absolute right-1 top-1 bottom-1 px-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 text-[10px] font-bold transition-colors flex items-center"
                    >
                       GO
                    </button>
                  </div>
               </div>

               <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span> High Stress
               </div>
             </div>

             {/* CARD 2: INSTRUCTOR MODE (PDF) */}
             <div 
                onClick={() => fileInputRef.current?.click()}
                className="group bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-blue-500 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:-translate-y-1 text-left relative overflow-hidden flex flex-col min-h-[280px]"
             >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <FileText size={100} />
               </div>
               <div className="flex items-center mb-3">
                  <div className="p-3 bg-slate-800 rounded-lg mr-4 group-hover:bg-blue-900/30 transition-colors">
                    <FileUp className="text-blue-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Instructor Mode</h2>
               </div>
               <p className="text-slate-400 mb-6 text-xs leading-relaxed">
                 Upload a lesson plan (PDF) to generate a custom simulation. The AI will extract learning objectives and create a matching case.
               </p>
               
               <div className="mt-auto">
                  <div className="w-full py-2 border border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-500 text-xs group-hover:border-blue-500/50 group-hover:text-blue-400 transition-colors bg-slate-950/30">
                      <Upload size={14} className="mr-2" /> Upload PDF
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="application/pdf"
                    className="hidden"
                  />
               </div>

               <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span> Custom Case
               </div>
             </div>

             {/* CARD 3: ESCAPE ROOM */}
             <div 
                onClick={() => handleStartGame('class')}
                className="group bg-slate-900/80 backdrop-blur-sm border border-slate-800 hover:border-purple-500 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-1 text-left relative overflow-hidden flex flex-col min-h-[280px]"
             >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Box size={100} />
               </div>
               <div className="flex items-center mb-3">
                  <div className="p-3 bg-slate-800 rounded-lg mr-4 group-hover:bg-purple-900/30 transition-colors">
                    <Puzzle className="text-purple-400" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">The Missing Bell</h2>
               </div>
               <p className="text-slate-400 mb-6 text-xs leading-relaxed">
                 <span className="text-purple-400 font-semibold">3D Escape Room:</span> Search the virtual room for the bell while managing Callie's hypoxia.
               </p>
               <div className="mt-auto flex items-center text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-ping"></span> 3D Enabled
               </div>
             </div>

           </div>

           <div className="mt-12 text-slate-500 text-xs font-mono">
             Powered by Gemini 2.5 Flash | NGN Bowtie Simulator
           </div>
        </div>
      </div>
    );
  }

  // --- SCREEN: DEBRIEF (WIN OR LOSS) ---
  if (gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) {
    const isWin = gameStatus === GameStatus.VICTORY;
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative">
            {/* Ambient Background */}
            <div className={`absolute inset-0 opacity-10 ${isWin ? 'bg-emerald-900' : 'bg-red-900'}`}></div>
            
            <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative z-10">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center">
                        <BrainCircuit className="text-slate-400 mr-3" size={24} />
                        <div>
                            <h1 className="text-2xl font-mono font-bold text-white tracking-tight">SIMULATION DEBRIEF</h1>
                            <p className="text-slate-500 text-xs uppercase tracking-widest">Post-Conference Evaluation</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg border ${isWin ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                        <div className="flex items-center space-x-2">
                            {isWin ? <Award size={18} /> : <HeartPulse size={18} />}
                            <span className="font-bold text-sm uppercase">
                                {isWin ? 'Outcome: Stable' : 'Outcome: Critical'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row">
                    {/* Status Panel */}
                    <div className="p-8 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/30">
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Scenario Result</h3>
                            <p className={`text-sm leading-relaxed ${isWin ? 'text-emerald-200/80' : 'text-red-200/80'}`}>
                                {isWin 
                                    ? "Excellent work. The patient has been stabilized and transferred successfully. Your clinical judgment prevented deterioration." 
                                    : "Resuscitation efforts have ceased. While the outcome was not ideal, this is a valuable opportunity to review the pathophysiology and decision points."
                                }
                            </p>
                        </div>
                        
                        <div className="mb-6">
                             <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">System Integrity</h3>
                             <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                    style={{ width: `${health}%` }}
                                ></div>
                             </div>
                             <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-mono">
                                <span>Critical</span>
                                <span>Stable</span>
                             </div>
                        </div>

                        <button onClick={resetGame} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-700 flex items-center justify-center transition-colors group">
                            <RefreshCw className="mr-2 group-hover:rotate-180 transition-transform duration-500" size={16}/> 
                            Return to Station
                        </button>
                    </div>

                    {/* Learning Report */}
                    <div className="p-8 md:w-2/3 bg-slate-900">
                        <div className="flex items-center mb-6">
                            <ClipboardList className="text-blue-400 mr-3" />
                            <h2 className="text-lg font-bold text-white">Key Learning Points</h2>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {learningReport.length > 0 ? (
                                learningReport.map((point, idx) => (
                                    <div key={idx} className="flex items-start p-4 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                        <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-slate-400 text-xs font-bold mr-3 shrink-0 border border-slate-700">
                                            {idx + 1}
                                        </span>
                                        <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                    <BrainCircuit size={32} className="mb-3 opacity-50 animate-pulse"/>
                                    <p className="italic text-sm">Generating debrief report...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (gameStatus === GameStatus.ERROR) {
     return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="text-center text-red-400">
            <h2 className="text-xl font-bold mb-2">Simulation Error</h2>
            <p>{errorMsg}</p>
            <button onClick={resetGame} className="mt-4 underline">Return to Menu</button>
          </div>
        </div>
     );
  }

  // --- SCREEN: MAIN GAME ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      
      {/* Left Panel: Patient Data & Visuals */}
      <div className="w-full md:w-[320px] lg:w-[380px] bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-auto md:h-screen overflow-y-auto custom-scrollbar">
         <div className="p-4 space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center">
                    <div className="bg-blue-600 px-2 py-1 rounded mr-3">
                        <h2 className="font-bold text-xs">ICU-4</h2>
                    </div>
                    <span className="font-mono font-bold text-lg tracking-wider">SIMULATION</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>

            {/* Visual Patient Avatar */}
            <PatientVisual visualState={visualState} respRate={vitals.respRate} />

            {/* Vitals Monitor */}
            <VitalsMonitor vitals={vitals} health={health} />

            {/* Clinical Notes */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
                <h3 className="text-[10px] uppercase text-slate-500 font-bold mb-3 tracking-widest">Patient Chart</h3>
                <div className="space-y-2">
                    <div className="p-2 bg-slate-900 rounded border-l-2 border-yellow-500 text-xs text-slate-300">
                        <span className="font-bold block text-yellow-500 mb-1">PRECAUTIONS</span>
                        Check Orders & Safety Signs
                    </div>
                    <div className="p-2 bg-slate-900 rounded border-l-2 border-blue-500 text-xs text-slate-300">
                        <span className="font-bold block text-blue-500 mb-1">ADMISSION DX</span>
                        See Assessment Data
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Right Panel: Interaction */}
      <div className="flex-1 flex flex-col h-[calc(100vh-320px)] md:h-screen relative">
         {/* Loading Indicator Overlay */}
         <div className="absolute top-4 right-4 z-20 pointer-events-none">
             {isLoading && (
                 <div className="flex items-center space-x-2 bg-emerald-900/80 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur shadow-lg">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold tracking-wide">ANALYZING...</span>
                 </div>
             )}
         </div>

         <div className="flex-1 h-full p-4 md:p-6">
             <ChatInterface 
                messages={messages} 
                onSendMessage={handleUserAction} 
                isLoading={isLoading} 
                bowtie={currentBowtie}
             />
         </div>
      </div>
    </div>
  );
};

export default App;
