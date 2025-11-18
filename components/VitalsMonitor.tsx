import React, { useEffect, useState } from 'react';
import { VitalSigns, VitalsCondition } from '../types';
import { Activity, Heart, Wind, Droplets, Thermometer, Timer } from 'lucide-react';

interface VitalsMonitorProps {
  vitals: VitalSigns;
  health: number;
}

const VitalsMonitor: React.FC<VitalsMonitorProps> = ({ vitals, health }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(prev => !prev);
    }, vitals.heartRate > 120 || vitals.heartRate < 50 ? 500 : 1000);
    return () => clearInterval(interval);
  }, [vitals.heartRate]);

  const getConditionColor = (condition: VitalsCondition) => {
    switch (condition) {
      case VitalsCondition.STABLE: return 'text-emerald-400';
      case VitalsCondition.DETERIORATING: return 'text-yellow-400';
      case VitalsCondition.CRITICAL: return 'text-red-500';
      case VitalsCondition.FLATLINE: return 'text-gray-500';
      default: return 'text-emerald-400';
    }
  };

  const colorClass = getConditionColor(vitals.condition);

  return (
    <div className="bg-black/80 border border-slate-700 rounded-lg p-4 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center">
           <Activity size={12} className="mr-2" /> Monitor
        </h3>
        <div className={`w-2 h-2 rounded-full ${blink ? 'bg-red-500' : 'bg-slate-800'} transition-colors duration-200`} />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-2 gap-y-4 gap-x-2">
        {/* HR */}
        <div className="flex items-center space-x-2">
          <Heart className={`w-4 h-4 ${colorClass} ${blink ? 'scale-110' : 'scale-100'} transition-transform`} />
          <div>
            <div className={`text-xl font-mono font-bold ${colorClass}`}>{vitals.heartRate}</div>
            <div className="text-[9px] text-slate-500 uppercase">HR (BPM)</div>
          </div>
        </div>

        {/* BP */}
        <div className="flex items-center space-x-2">
          <Activity className={`w-4 h-4 ${colorClass}`} />
          <div>
            <div className={`text-xl font-mono font-bold ${colorClass}`}>
              {vitals.bpSystolic}/{vitals.bpDiastolic}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">NIBP</div>
          </div>
        </div>

        {/* SpO2 */}
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-xl font-mono font-bold text-sky-400">{vitals.spo2}%</div>
            <div className="text-[9px] text-slate-500 uppercase">SpO2</div>
          </div>
        </div>

        {/* RR */}
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 text-yellow-400" />
          <div>
            <div className="text-xl font-mono font-bold text-yellow-400">{vitals.respRate}</div>
            <div className="text-[9px] text-slate-500 uppercase">RR (min)</div>
          </div>
        </div>

        {/* Temp */}
        <div className="flex items-center space-x-2">
          <Thermometer className={`w-4 h-4 ${vitals.temperature > 38 ? 'text-red-400' : 'text-emerald-400'}`} />
          <div>
            <div className={`text-xl font-mono font-bold ${vitals.temperature > 38 ? 'text-red-400' : 'text-emerald-400'}`}>
                {vitals.temperature.toFixed(1)}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">Temp (°C)</div>
          </div>
        </div>
      </div>
      
      {/* Health Integrity Bar */}
      <div className="mt-4 pt-2 border-t border-slate-800">
        <div className="flex justify-between text-[10px] uppercase text-slate-500 mb-1">
            <span>System Stability</span>
            <span>{health}%</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
                className={`h-full transition-all duration-500 ${health < 30 ? 'bg-red-600' : health < 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                style={{ width: `${health}%` }}
            />
        </div>
      </div>

      {/* EKG Visual */}
      <div className="mt-3 h-12 bg-slate-900/50 rounded border border-slate-800 relative overflow-hidden">
        <svg className="absolute bottom-0 w-full h-full stroke-emerald-500/50" preserveAspectRatio="none">
           <polyline 
             points="0,25 20,25 25,5 30,45 35,25 50,25 60,25 65,5 70,45 75,25 90,25 100,25 105,5 110,45 115,25 130,25 140,25 145,5 150,45 155,25 170,25 180,25 185,5 190,45 195,25 210,25 220,25 225,5 230,45 235,25 250,25" 
             fill="none" 
             strokeWidth="1.5"
             vectorEffect="non-scaling-stroke"
           />
        </svg>
        <div className="ekg-line w-full h-full absolute top-0 left-0" />
      </div>
    </div>
  );
};

export default VitalsMonitor;