import React, { useState, useEffect } from 'react';
import { GameStatus, DialogueState } from '../types';

interface ControlsProps {
  gameStatus: GameStatus;
  cash: number;
  currentHoldingsValue: number;
  onNextTurn: (action: 'buy' | 'sell' | 'hold', amount: number) => void;
  salary: number;
  dialogue: DialogueState;
  showEarlyExitPrompt: boolean;
  onEarlyExitDecision: (decision: 'continue' | 'exit') => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  gameStatus, 
  cash, 
  currentHoldingsValue, 
  onNextTurn,
  salary,
  dialogue,
  showEarlyExitPrompt,
  onEarlyExitDecision
}) => {
  const [selectedAction, setSelectedAction] = useState<'buy' | 'sell' | 'hold' | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(0);

  const maxBuy = cash + salary;
  const maxSell = currentHoldingsValue;

  useEffect(() => {
    // Reset defaults when action changes
    if (selectedAction === 'buy') setSliderValue(maxBuy); // Default to All In for excitement
    if (selectedAction === 'sell') setSliderValue(maxSell / 2);
    if (selectedAction === 'hold') setSliderValue(0);
  }, [selectedAction, maxBuy, maxSell]);

  const handleExecute = () => {
    if (selectedAction) {
      onNextTurn(selectedAction, sliderValue);
      setSelectedAction(null); // Reset for next turn
    }
  };

  const handleHold = () => {
    onNextTurn('hold', 0);
    setSelectedAction(null);
  }

  if (gameStatus !== GameStatus.PLAYING) return null;

  return (
    <div className="w-full mt-4 bg-slate-900 border-4 border-double border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="flex flex-col md:flex-row min-h-[200px]">
        
        {/* LEFT: System Message Area */}
        <div className="flex-1 p-6 relative bg-slate-900">
           <div className="absolute top-2 left-4 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold border border-slate-700 px-2 rounded">
             SYSTEM LOG
           </div>
           <div className="mt-6 font-mono text-base md:text-lg leading-relaxed whitespace-pre-line text-slate-200">
            {dialogue.textParts.map((part, index) => (
              <span key={index} className={part.className || ""}>
                {part.text}
              </span>
            ))}
            <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle"></span>
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="h-px w-full md:w-1 md:h-auto bg-slate-700"></div>

        {/* RIGHT: Action Command Center */}
        <div className="w-full md:w-[340px] bg-slate-800/50 p-4 flex flex-col justify-center border-l-0 md:border-l border-slate-700">
          
          {/* STATE: EARLY EXIT PROMPT (Performance Review) */}
          {showEarlyExitPrompt && (
            <div className="flex flex-col gap-3 h-full justify-center animate-in zoom-in-95 duration-300">
              <div className="text-center mb-2">
                <div className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">⚠️ 做出决策</div>
                <div className="text-xs text-slate-400">Decision Required</div>
              </div>

              <button
                onClick={() => onEarlyExitDecision('continue')}
                className="group flex items-center justify-between px-4 py-4 bg-slate-800 hover:bg-blue-900/40 border border-slate-600 hover:border-blue-500/50 rounded transition-all text-left"
              >
                <div>
                  <div className="text-blue-400 font-bold font-mono tracking-wider group-hover:translate-x-1 transition-transform">🛡️ 坚持策略</div>
                  <div className="text-[10px] text-slate-500">CONTINUE STRATEGY</div>
                </div>
              </button>

              <button
                onClick={() => onEarlyExitDecision('exit')}
                className="group flex items-center justify-between px-4 py-4 bg-slate-800 hover:bg-red-900/40 border border-slate-600 hover:border-red-500/50 rounded transition-all text-left"
              >
                 <div>
                  <div className="text-red-400 font-bold font-mono tracking-wider group-hover:translate-x-1 transition-transform">🏳️ 承认失败并退出</div>
                  <div className="text-[10px] text-slate-500">SURRENDER & EXIT</div>
                </div>
              </button>
            </div>
          )}

          {/* STATE: MAIN MENU (Standard Turn) */}
          {!showEarlyExitPrompt && !selectedAction && (
            <div className="flex flex-col gap-3 h-full justify-center">
              <button
                onClick={() => setSelectedAction('buy')}
                className="group flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-emerald-900/40 border border-slate-600 hover:border-emerald-500/50 rounded transition-all text-left"
              >
                <div>
                  <div className="text-emerald-400 font-bold font-mono tracking-wider group-hover:translate-x-1 transition-transform">⚔️ 加仓进攻</div>
                  <div className="text-[10px] text-slate-500">BUY / LONG</div>
                </div>
                <div className="text-xs text-slate-400 font-mono">${maxBuy.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
              </button>

              <button
                onClick={() => setSelectedAction('sell')}
                className="group flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-rose-900/40 border border-slate-600 hover:border-rose-500/50 rounded transition-all text-left"
              >
                <div>
                  <div className="text-rose-400 font-bold font-mono tracking-wider group-hover:translate-x-1 transition-transform">🛡️ 止盈回防</div>
                  <div className="text-[10px] text-slate-500">SELL / SHORT</div>
                </div>
                <div className="text-xs text-slate-400 font-mono">${maxSell.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
              </button>

              <button
                onClick={handleHold}
                className="group flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-blue-900/40 border border-slate-600 hover:border-blue-500/50 rounded transition-all text-left"
              >
                 <div>
                  <div className="text-blue-400 font-bold font-mono tracking-wider group-hover:translate-x-1 transition-transform">💤 休整待机</div>
                  <div className="text-[10px] text-slate-500">WAIT / HOLD</div>
                </div>
                <div className="text-xs text-slate-400 font-mono">SKIP</div>
              </button>
            </div>
          )}

          {/* STATE: DETAIL SLIDER */}
          {!showEarlyExitPrompt && selectedAction && (
            <div className="flex flex-col h-full justify-between animate-in slide-in-from-right-4 duration-200">
              
              <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h3 className={`font-bold font-mono flex items-center gap-2 ${selectedAction === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedAction === 'buy' ? '⚔️ 加仓' : '🛡️ 止盈'}
                </h3>
                <button 
                  onClick={() => setSelectedAction(null)}
                  className="text-xs text-slate-400 hover:text-white underline decoration-slate-600"
                >
                  返回 (BACK)
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-right">
                  <div className="text-2xl font-mono text-white">
                    ${sliderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={selectedAction === 'buy' ? maxBuy : maxSell}
                  step={100}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    selectedAction === 'buy' ? 'accent-emerald-500 bg-emerald-900/30' : 'accent-rose-500 bg-rose-900/30'
                  }`}
                />

                <div className="flex justify-between gap-1">
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setSliderValue((selectedAction === 'buy' ? maxBuy : maxSell) * pct)}
                      className="flex-1 py-1 text-[10px] rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-mono transition-colors"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExecute}
                className={`w-full mt-4 py-3 rounded font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 ${
                  selectedAction === 'buy' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30' 
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                }`}
              >
                确认 (CONFIRM)
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Controls;