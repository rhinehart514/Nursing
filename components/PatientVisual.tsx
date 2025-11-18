
import React, { useState, useRef, useEffect } from 'react';
import { VisualState } from '../types';

interface PatientVisualProps {
  visualState: VisualState;
  respRate: number;
}

const PatientVisual: React.FC<PatientVisualProps> = ({ visualState, respRate }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMonitorZoomed, setIsMonitorZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Mouse Move for Parallax & Flashlight
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Calculate rotation based on mouse position (Parallax)
  const containerWidth = containerRef.current?.offsetWidth || 1;
  const containerHeight = containerRef.current?.offsetHeight || 1;
  
  const rotateY = ((mousePos.x / containerWidth) - 0.5) * 15;
  const rotateX = -((mousePos.y / containerHeight) - 0.5) * 15;

  // Calculate animation duration based on RR
  const breathDuration = respRate > 0 ? 60 / respRate : 0;
  
  // Color & State Logic
  let skinColor = '#fca5a5'; 
  let overlayColor = 'transparent';
  let isEyesOpen = true;
  let isSweating = false;
  
  switch (visualState) {
    case VisualState.PALE: skinColor = '#e2e8f0'; break;
    case VisualState.CYANOTIC: skinColor = '#94a3b8'; overlayColor = 'rgba(8, 145, 178, 0.25)'; break;
    case VisualState.FLUSHED: skinColor = '#f87171'; break;
    case VisualState.UNCONSCIOUS: skinColor = '#cbd5e1'; isEyesOpen = false; break;
    case VisualState.SWEATING: skinColor = '#fda4af'; isSweating = true; break;
    default: skinColor = '#fda4af'; break;
  }

  return (
    <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full h-80 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair shadow-2xl group perspective-container"
    >
      {/* UI Overlay HUD */}
      <div className="absolute top-4 left-4 z-50 flex items-center space-x-2 opacity-70 pointer-events-none">
         <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
         <span className="text-[10px] font-mono text-red-500 tracking-widest uppercase">Live Cam</span>
      </div>

      <div className="absolute top-4 right-4 z-50 text-[10px] text-emerald-400 font-mono border border-emerald-500/30 bg-black/40 px-2 py-1 rounded backdrop-blur-md pointer-events-none">
         VISUAL: {visualState}
      </div>

      {/* FLASHLIGHT EFFECT LAYER */}
      <div 
        className="absolute inset-0 z-40 pointer-events-none transition-opacity duration-300 mix-blend-hard-light"
        style={{
            background: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15) 0%, rgba(2, 6, 23, 0.5) 50%, rgba(2, 6, 23, 0.95) 100%)`
        }}
      />
      <div className="absolute inset-0 z-40 pointer-events-none" style={{
          background: `radial-gradient(circle 120px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.4) 100%)`
      }}></div>

      {/* 3D WORLD */}
      <div 
        className="w-full h-full preserve-3d transition-transform duration-100 ease-out"
        style={{
            transform: `perspective(1000px) rotateX(${10 + rotateX}deg) rotateY(${rotateY}deg) scale(0.95)`
        }}
      >
        {/* --- ROOM GEOMETRY --- */}
        
        {/* Floor */}
        <div className="absolute bottom-0 left-[-50%] w-[200%] h-[400px] bg-[#0f172a] origin-bottom transform rotateX(90deg)">
            <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b),linear-gradient(45deg,#1e293b_25%,transparent_25%,transparent_75%,#1e293b_75%,#1e293b)] [background-size:40px_40px] [background-position:0_0,20px_20px]"></div>
        </div>
        
        {/* Back Wall */}
        <div className="absolute top-[-100px] left-[-50%] w-[200%] h-[600px] bg-slate-900 transform translateZ(-200px)">
             {/* Window with Night Sky */}
             <div className="absolute top-[150px] left-[60%] w-[120px] h-[140px] bg-slate-950 border-4 border-slate-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] overflow-hidden">
                 {/* Moon/Stars */}
                 <div className="absolute top-4 right-4 w-8 h-8 bg-slate-200 rounded-full blur-[2px] opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
                 <div className="absolute top-10 left-10 w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_4px_white] animate-pulse"></div>
                 <div className="absolute top-20 left-20 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
                 {/* Rain effect if stormy? (Optional, simplistic here) */}
                 <div className="w-full h-full bg-[linear-gradient(transparent_95%,rgba(255,255,255,0.05)_95%)] [background-size:100%_10px]"></div>
             </div>
        </div>

        {/* --- OBJECTS --- */}

        {/* BEDSIDE TABLE (Left) */}
        <div className="absolute top-[50%] left-[12%] w-[60px] h-[80px] preserve-3d transform translateZ(-50px)">
             <div className="absolute inset-0 bg-slate-700 border border-slate-600 shadow-lg transform rotateY(10deg)"></div>
             <div className="absolute top-0 w-full h-full bg-slate-600 origin-top transform rotateX(-90deg)"></div>
             {/* Cup with Straw */}
             <div className="absolute top-[-15px] left-[20px] w-[15px] h-[20px] bg-blue-900/50 border border-blue-500/30 transform rotateX(-10deg)">
                <div className="absolute top-[-10px] left-1/2 w-[2px] h-[15px] bg-white/50 -translate-x-1/2 rotate-12"></div>
             </div>
             {/* Phone */}
             <div className="absolute top-[5px] left-[30px] w-[20px] h-[35px] bg-black border border-slate-500 transform rotateY(10deg) rotateX(90deg)"></div>
        </div>

        {/* IV POLE (Right Back) */}
        <div className="absolute top-[30%] right-[22%] preserve-3d z-10">
             <div className="w-1.5 h-[220px] bg-slate-400 mx-auto shadow-sm rounded-full bg-gradient-to-r from-slate-500 to-slate-300"></div>
             <div className="absolute top-0 left-[-20px] w-[40px] h-1.5 bg-slate-400 rounded-full"></div>
             {/* IV Bag */}
             <div className="absolute top-[5px] right-[5px] w-[24px] h-[36px] bg-sky-200/20 border border-sky-400/30 rounded-b-lg rounded-t-sm shadow-[0_0_10px_rgba(56,189,248,0.2)] overflow-hidden">
                 <div className="absolute bottom-0 w-full h-[80%] bg-sky-400/10"></div>
                 {/* Drip Animation */}
                 <div className="absolute top-[36px] left-1/2 -translate-x-1/2 w-[2px] h-[2px] bg-sky-300 rounded-full animate-[drip_1s_linear_infinite]"></div>
             </div>
             {/* Tube */}
             <svg className="absolute top-[40px] right-[15px] w-[60px] h-[100px] pointer-events-none overflow-visible">
                <path d="M0,0 Q5,50 -40,100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
             </svg>
        </div>

        {/* CARDIAC MONITOR (Right Front) */}
        <div 
            onClick={() => setIsMonitorZoomed(!isMonitorZoomed)}
            className={`absolute top-[40%] right-[5%] w-[80px] h-[60px] preserve-3d transform transition-all duration-500 cursor-pointer hover:scale-105 ${isMonitorZoomed ? 'translate-Z(100px) scale(2) rotateY(0deg) z-50' : 'translateZ(30px) rotateY(-25deg)'}`}
        >
             <div className="w-full h-full bg-slate-800 border-2 border-slate-600 rounded shadow-xl relative overflow-hidden bg-gradient-to-b from-slate-700 to-slate-900">
                 {/* Screen Glow */}
                 <div className="absolute inset-0 bg-black opacity-60"></div>
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent)] [background-size:10px_10px]"></div>
                 
                 {/* Trace */}
                 <div className="absolute top-3 left-1 w-[90%] h-[1px] bg-green-500 shadow-[0_0_4px_#22c55e] animate-pulse"></div>
                 <div className="absolute top-6 left-1 w-[70%] h-[1px] bg-sky-500 shadow-[0_0_4px_#0ea5e9] animate-pulse" style={{animationDelay: '0.3s'}}></div>
                 
                 {/* Values */}
                 <div className="absolute bottom-1 right-1 text-[6px] font-mono text-green-400">HR 118</div>
             </div>
             <div className="w-2 h-[80px] bg-slate-700 mx-auto mt-[-2px]"></div>
        </div>

        {/* PATIENT BED (Center) */}
        <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 preserve-3d">
            
            {/* Bed Frame */}
            <div className="w-[200px] h-[260px] bg-slate-800 rounded-xl shadow-2xl transform rotateX(20deg) border-t border-slate-600 relative group-hover:translate-z-[5px] transition-transform">
                 {/* Mattress Side */}
                 <div className="absolute -left-3 top-0 w-3 h-full bg-slate-700 origin-right transform rotateY(-90deg)"></div>
                 
                 {/* CLIPBOARD / CHART (Foot of Bed) */}
                 <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-[120px] h-[40px] bg-slate-200 border border-slate-400 rounded-sm transform rotateX(-20deg) shadow-lg flex flex-col items-center justify-center z-40 px-2">
                    <div className="w-full h-[2px] bg-slate-400 mb-1"></div>
                    <div className="w-[80%] h-[2px] bg-slate-400 mb-1"></div>
                    <div className="w-[60%] h-[2px] bg-slate-400"></div>
                    <div className="absolute -top-2 w-[20px] h-[8px] bg-slate-500 rounded-t-sm"></div>
                 </div>

                 {/* Patient Group */}
                 <div className="absolute inset-0 flex items-center justify-center transform translateZ(20px)">
                    
                    {/* Pillow */}
                    <div className="absolute top-[15px] w-[120px] h-[60px] bg-slate-300 rounded shadow-sm border-b-4 border-slate-400/20"></div>

                    {/* HEAD */}
                    <div 
                        className={`absolute top-[30px] w-[80px] h-[90px] rounded-[35px] shadow-md z-20 transition-colors duration-700 border border-black/5`}
                        style={{ backgroundColor: skinColor }}
                    >
                         {/* Hair/Cap */}
                        <div className="absolute -top-1 -left-1 w-[84px] h-[30px] bg-slate-400 rounded-t-[40px] opacity-80"></div>

                        {/* Sweat Drops */}
                        {isSweating && (
                             <>
                             <div className="absolute top-8 left-2 w-1 h-1.5 bg-sky-200/60 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
                             <div className="absolute top-7 right-3 w-1 h-1.5 bg-sky-200/60 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                             </>
                        )}

                        {/* Face Features */}
                        <div className="relative w-full h-full">
                            {isEyesOpen ? (
                                <>
                                {/* Eyes Blinking Animation Wrapper */}
                                <div className="animate-[blink_4s_infinite]">
                                    <div className="absolute top-[35px] left-[18px] w-[14px] h-[8px] bg-white rounded-full overflow-hidden shadow-inner">
                                        <div className="w-[5px] h-[5px] bg-black rounded-full ml-[4px] mt-[1.5px]"></div>
                                    </div>
                                    <div className="absolute top-[35px] right-[18px] w-[14px] h-[8px] bg-white rounded-full overflow-hidden shadow-inner">
                                        <div className="w-[5px] h-[5px] bg-black rounded-full ml-[4px] mt-[1.5px]"></div>
                                    </div>
                                </div>
                                {/* Brows */}
                                <div className="absolute top-[28px] left-[16px] w-[16px] h-[2px] bg-slate-600/40 rotate-6"></div>
                                <div className="absolute top-[28px] right-[16px] w-[16px] h-[2px] bg-slate-600/40 -rotate-6"></div>
                                </>
                            ) : (
                                <>
                                <div className="absolute top-[38px] left-[18px] w-[14px] h-[2px] bg-slate-600/40"></div>
                                <div className="absolute top-[38px] right-[18px] w-[14px] h-[2px] bg-slate-600/40"></div>
                                </>
                            )}
                            {/* Nose */}
                            <div className="absolute top-[50px] left-1/2 -translate-x-1/2 w-[8px] h-[12px] bg-black/5 rounded-full"></div>
                            
                            {/* Mouth */}
                            <div className={`absolute bottom-[15px] left-1/2 -translate-x-1/2 bg-black/10 rounded-full transition-all duration-500 ${visualState === VisualState.UNCONSCIOUS ? 'w-[24px] h-[8px]' : 'w-[20px] h-[4px]'}`}></div>
                        </div>
                    </div>

                    {/* BODY / BLANKET */}
                    <div 
                        className="absolute top-[110px] w-[150px] h-[140px] bg-sky-100 rounded-t-[45px] shadow-lg z-10 border border-sky-200/50 overflow-hidden"
                        style={{
                            animation: respRate > 0 ? `breathe ${breathDuration}s ease-in-out infinite` : 'none',
                            backgroundColor: visualState === VisualState.FLUSHED ? '#dbeafe' : '#e0f2fe'
                        }}
                    >
                        {/* Gown Pattern */}
                        <div className="w-full h-full opacity-30 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:12px_12px]"></div>
                        {/* Stethoscope (Visual Detail) */}
                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[60px] h-[80px] border-2 border-slate-400 rounded-full opacity-30"></div>
                    </div>
                    
                    {/* Teal Blanket Overlay */}
                    <div className="absolute top-[170px] w-[170px] h-[100px] bg-teal-900 rounded-t-xl shadow-[0_-5px_15px_rgba(0,0,0,0.4)] z-30">
                         <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_25%,rgba(255,255,255,0.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.1)_75%,rgba(255,255,255,0.1)_100%)] [background-size:24px_24px]"></div>
                    </div>

                 </div>
            </div>
        </div>

        {/* Overlay Tint for States */}
        <div 
            className="absolute inset-0 pointer-events-none transition-colors duration-1000 mix-blend-overlay z-30"
            style={{ backgroundColor: overlayColor }}
        />
      </div>

      <style>{`
        .perspective-container {
            perspective: 1000px;
        }
        .preserve-3d {
            transform-style: preserve-3d;
        }
        @keyframes breathe {
          0%, 100% { transform: translateZ(0) scale(1); }
          50% { transform: translateZ(10px) scale(1.03); }
        }
        @keyframes blink {
            0%, 96%, 100% { opacity: 1; height: 8px; }
            98% { opacity: 0.5; height: 1px; }
        }
        @keyframes drip {
            0% { transform: translateY(0); opacity: 1; }
            100% { transform: translateY(15px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default PatientVisual;
