

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, BowtieOptions } from '../types';
import { Activity, CheckCircle2, FileText, ArrowRight, BrainCircuit, ChevronDown, ChevronUp, Clock, Send, MessageSquare, Search } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  bowtie?: BowtieOptions;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, bowtie }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  
  // Bowtie State
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedMonitoring, setSelectedMonitoring] = useState<string[]>([]);
  
  // Ref to track the JSON string of the previous bowtie to prevent unnecessary resets
  const prevBowtieJsonRef = useRef<string>("");

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Helper to parse **bold** text
  const formatText = (text: string) => {
    if (!text) return null;
    // Split by **...** pattern
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove asterisks and apply bold styling
        return <strong key={index} className="font-bold text-emerald-300">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Auto-expand the latest AI message, auto-collapse others
  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender === 'ai') {
            setExpandedMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.add(lastMsg.id);
                return newSet;
            });
        }
        scrollToBottom();
    }
  }, [messages.length, isLoading]);

  // Reset selections ONLY when a NEW (different) bowtie arrives
  useEffect(() => {
    if (bowtie) {
        const currentJson = JSON.stringify(bowtie);
        // Only reset if the content of the bowtie has actually changed
        if (currentJson !== prevBowtieJsonRef.current) {
            setSelectedCondition(null);
            setSelectedActions([]);
            setSelectedMonitoring([]);
            prevBowtieJsonRef.current = currentJson;
        }
    }
  }, [bowtie]);

  const toggleMessage = (id: string) => {
    setExpandedMessageIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const handleConditionSelect = (item: string) => {
    if (isLoading) return;
    setSelectedCondition(item === selectedCondition ? null : item);
  };

  const handleActionSelect = (item: string) => {
    if (isLoading) return;
    if (selectedActions.includes(item)) {
      setSelectedActions(prev => prev.filter(i => i !== item));
    } else if (selectedActions.length < 2) {
      setSelectedActions(prev => [...prev, item]);
    }
  };

  const handleMonitoringSelect = (item: string) => {
    if (isLoading) return;
    if (selectedMonitoring.includes(item)) {
      setSelectedMonitoring(prev => prev.filter(i => i !== item));
    } else if (selectedMonitoring.length < 2) {
      setSelectedMonitoring(prev => [...prev, item]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  const isSubmitReady = selectedCondition && selectedActions.length === 2 && selectedMonitoring.length === 2;

  const handleSubmitBowtie = () => {
    if (isSubmitReady && !isLoading) {
      const formattedResponse = `
        CLINICAL JUDGMENT SUBMITTED:
        - Diagnosis/Condition: ${selectedCondition}
        - Actions Taken: ${selectedActions.join(', ')}
        - Parameters Monitored: ${selectedMonitoring.join(', ')}
      `;
      onSendMessage(formattedResponse);
    }
  };

  // Helper to render narrative in a structured way
  const renderMessageContent = (msg: ChatMessage) => {
    const isExpanded = expandedMessageIds.has(msg.id);
    
    if (msg.sender === 'ai') {
      // Collapsed View
      if (!isExpanded) {
        return (
            <div onClick={() => toggleMessage(msg.id)} className="cursor-pointer flex items-center justify-between p-1 group">
                <div className="flex items-center space-x-3">
                    <div className="p-1 bg-slate-700/50 rounded-md">
                        <FileText size={12} className="text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">Clinical Update</span>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
                <ChevronDown size={12} className="text-slate-600 group-hover:text-slate-400" />
            </div>
        );
      }

      // Expanded View
      return (
        <div className="font-sans text-slate-300 leading-relaxed relative text-sm">
           <div 
             onClick={() => toggleMessage(msg.id)}
             className="absolute top-[-6px] right-[-6px] p-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
           >
             <ChevronUp size={14} />
           </div>

          <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-700/50">
             <div className="p-1 bg-emerald-900/30 rounded text-emerald-400">
                <Activity size={14} />
             </div>
             <div>
                 <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">EHR System</span>
                 <span className="block text-xs font-bold text-slate-200">Nursing Note</span>
             </div>
             <div className="ml-auto flex items-center text-[9px] text-slate-600 font-mono bg-slate-900/50 px-2 py-1 rounded">
                 <Clock size={10} className="mr-1" />
                 {new Date(msg.timestamp).toLocaleTimeString()}
             </div>
          </div>
          <div className="whitespace-pre-wrap">{formatText(msg.text)}</div>
          
          <div 
             onClick={() => toggleMessage(msg.id)}
             className="mt-2 pt-2 border-t border-slate-800/50 text-center cursor-pointer hover:bg-slate-800/30 rounded transition-colors"
           >
             <span className="text-[9px] text-slate-500 uppercase tracking-widest flex items-center justify-center">
                Collapse <ChevronUp size={10} className="ml-1"/>
             </span>
          </div>
        </div>
      );
    }
    
    // User or System messages
    return <div className="whitespace-pre-wrap font-medium">{formatText(msg.text)}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative ring-1 ring-white/5">
      
      {/* SCANNNER OVERLAY when loading */}
      {isLoading && (
         <div className="absolute inset-0 z-50 pointer-events-none bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent animate-scanline"></div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50 custom-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <BrainCircuit size={48} className="mb-4 opacity-20 animate-pulse" />
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Initializing Shift...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`relative max-w-[95%] md:max-w-[90%] rounded-xl shadow-lg backdrop-blur-md border transition-all duration-300 ${
                msg.sender === 'user'
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-50 rounded-br-none p-3 text-sm'
                  : msg.sender === 'ai'
                  ? `bg-slate-800/40 border-slate-700/50 text-slate-200 rounded-bl-none ${expandedMessageIds.has(msg.id) ? 'p-4' : 'p-2 hover:bg-slate-800/60'}`
                  : 'bg-emerald-900/20 border-emerald-500/20 text-emerald-100 rounded-bl-none p-3 text-sm'
              }`}
            >
              {msg.sender === 'system' && (
                <div className="text-[9px] font-bold text-emerald-400 mb-1 uppercase tracking-wider flex items-center border-b border-emerald-500/20 pb-1">
                  <CheckCircle2 size={10} className="mr-1.5" /> Clinical Feedback
                </div>
              )}
              {renderMessageContent(msg)}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-slate-900/80 border border-emerald-500/20 px-3 py-2 rounded-xl rounded-bl-none flex items-center space-x-2 shadow-lg">
               <div className="flex space-x-1">
                 <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                 <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                 <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
               </div>
               <span className="text-[10px] text-emerald-400 font-mono animate-pulse tracking-wide">EVALUATING...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* BOWTIE INTERACTION AREA (COMPACT) */}
      <div className={`bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${bowtie && !isLoading ? 'flex-none opacity-100 translate-y-0' : 'h-0 overflow-hidden border-none opacity-0 translate-y-10'}`}>
        {bowtie && !isLoading && (
          <div className="p-3 lg:p-4">
            
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    <Activity className="text-emerald-500 mr-2" size={14} />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Clinical Judgment Board
                    </h3>
                </div>
                <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-500 uppercase">
                   <span className="text-blue-400">Actions: {selectedActions.length}/2</span>
                   <span className="text-slate-600">|</span>
                   <span className="text-yellow-400">DX: {selectedCondition ? 1 : 0}/1</span>
                   <span className="text-slate-600">|</span>
                   <span className="text-emerald-400">Monitor: {selectedMonitoring.length}/2</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 relative">
              
              {/* Connector Lines (Desktop) */}
              <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700/20 to-transparent -z-10"></div>

              {/* LEFT: ACTIONS (Step 2) */}
              <div className="flex flex-col bg-slate-950/30 rounded-lg border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex justify-between items-center px-2 py-1.5 bg-slate-900/30 border-b border-slate-800/50">
                     <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Actions Taken</span>
                </div>
                <div className="space-y-0.5 p-1">
                    {bowtie.potentialActions.map((action, idx) => {
                        const isSelected = selectedActions.includes(action);
                        const isDisabled = !isSelected && selectedActions.length >= 2;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleActionSelect(action)}
                                disabled={isDisabled}
                                className={`w-full text-left px-2 py-1.5 text-[11px] rounded border transition-all duration-150 flex items-start group relative leading-tight
                                    ${isSelected 
                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-100' 
                                        : isDisabled
                                            ? 'opacity-30 cursor-not-allowed border-transparent text-slate-600'
                                            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }
                                `}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full border mr-2 shrink-0 flex items-center justify-center mt-0.5 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-700'}`}>
                                    {isSelected && <CheckCircle2 size={6} className="text-white" />}
                                </div>
                                <span>{action}</span>
                            </button>
                        )
                    })}
                </div>
              </div>

              {/* CENTER: CONDITION (Step 1) */}
              <div className="flex flex-col lg:-mt-2 lg:mb-2 order-first lg:order-none z-10">
                 <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 shadow-xl">
                    <div className="bg-slate-950/50 px-2 py-1.5 rounded-lg border border-slate-800 text-center mb-1">
                        <div className="text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
                             Potential Diagnosis
                        </div>
                    </div>
                    <div className="space-y-1 p-1">
                        {bowtie.potentialConditions.map((cond, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleConditionSelect(cond)}
                                className={`w-full py-2 px-1 text-[11px] font-bold rounded-lg border transition-all duration-200 relative text-center
                                    ${selectedCondition === cond 
                                        ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200 shadow-sm' 
                                        : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                            >
                                {cond}
                            </button>
                        ))}
                    </div>
                 </div>
              </div>

              {/* RIGHT: MONITORING (Step 3) */}
              <div className="flex flex-col bg-slate-950/30 rounded-lg border border-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="flex justify-between items-center px-2 py-1.5 bg-slate-900/30 border-b border-slate-800/50">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider ml-auto">Parameters to Monitor</span>
                </div>
                <div className="space-y-0.5 p-1">
                    {bowtie.potentialMonitoring.map((mon, idx) => {
                         const isSelected = selectedMonitoring.includes(mon);
                         const isDisabled = !isSelected && selectedMonitoring.length >= 2;
                         return (
                            <button
                                key={idx}
                                onClick={() => handleMonitoringSelect(mon)}
                                disabled={isDisabled}
                                className={`w-full text-right px-2 py-1.5 text-[11px] rounded border transition-all duration-150 flex items-center justify-end group relative leading-tight
                                    ${isSelected 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' 
                                        : isDisabled
                                            ? 'opacity-30 cursor-not-allowed border-transparent text-slate-600'
                                            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }
                                `}
                            >
                                <span>{mon}</span>
                                <div className={`w-2.5 h-2.5 rounded-full border ml-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-700'}`}>
                                    {isSelected && <CheckCircle2 size={6} className="text-white" />}
                                </div>
                            </button>
                        )
                    })}
                </div>
              </div>

            </div>

            {/* SUBMIT ACTION BAR (COMPACT) */}
            <div className="mt-3 flex items-center justify-end">
                <button
                    onClick={handleSubmitBowtie}
                    disabled={!isSubmitReady}
                    className="px-4 py-2 bg-slate-800 text-slate-500 font-bold uppercase tracking-widest text-[9px] rounded border border-slate-700 transition-all duration-300 
                               disabled:opacity-50 disabled:cursor-not-allowed
                               data-[ready=true]:bg-emerald-600 data-[ready=true]:text-white data-[ready=true]:border-emerald-500 data-[ready=true]:hover:bg-emerald-500"
                    data-ready={isSubmitReady}
                >
                    <div className="flex items-center">
                        {isSubmitReady ? 'Submit Assessment' : `Select Remaining: ${(selectedCondition ? 0 : 1) + (2 - selectedActions.length) + (2 - selectedMonitoring.length)}`}
                        {isSubmitReady && <ArrowRight size={12} className="ml-2" />}
                    </div>
                </button>
            </div>
          </div>
        )}
      </div>
      
      {/* CHAT INPUT AREA */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/50 backdrop-blur">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                    <MessageSquare size={14} />
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask patient, check chart, or request labs..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                    disabled={isLoading}
                />
                {/* Helper hint */}
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                   <Search size={12} className="text-slate-600" />
                </div>
            </div>
            <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-700/50"
            >
                <Send size={16} />
            </button>
        </form>
      </div>

      <style>{`
        @keyframes scanline {
            0% { top: -10%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 110%; opacity: 0; }
        }
        .animate-scanline {
            animation: scanline 3s linear infinite;
            background: linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.2), transparent);
            height: 20px;
            width: 100%;
            position: absolute;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;