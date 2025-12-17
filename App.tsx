import React, { useState } from 'react';
import { 
  MarketIndex, 
  GameStatus, 
  TurnHistory,
  DialogueState,
  GameEndReason
} from './types';
import { DATA_MAP, SALARY } from './constants';
import GameChart from './components/GameChart';
import Controls from './components/Controls';

const App: React.FC = () => {
  // --- State ---
  const [selectedIndex, setSelectedIndex] = useState<MarketIndex>(MarketIndex.SPY);
  const [startYear, setStartYear] = useState<number>(1985);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [gameEndReason, setGameEndReason] = useState<GameEndReason>('completed');
  
  // Game Logic State
  const [currentStep, setCurrentStep] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const [userCash, setUserCash] = useState(0);
  const [userShares, setUserShares] = useState(0);
  const [botShares, setBotShares] = useState(0);
  const [winningTurns, setWinningTurns] = useState(0); // Track how many turns user led
  const [history, setHistory] = useState<TurnHistory[]>([]);
  
  // Early Exit / Performance Check State
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  
  // RPG Narrative State
  const [dialogue, setDialogue] = useState<DialogueState>({ textParts: [] });

  // Derived Data
  const currentDataArray = DATA_MAP[selectedIndex];
  const validYears = (Array.from(new Set(currentDataArray.map(d => parseInt(d.Date_Str.split('-')[0])))) as number[])
                     .filter(y => y <= 2020);

  // --- Actions ---

  const startGame = () => {
    const startDateStr = `${startYear}-06-01`;
    const foundIndex = currentDataArray.findIndex(d => d.Date_Str >= startDateStr);
    const actualStartIndex = foundIndex >= 0 ? foundIndex : 0;

    setStartOffset(actualStartIndex);
    setCurrentStep(0);
    setUserCash(0);
    setUserShares(0);
    setBotShares(0);
    setWinningTurns(0);
    setShowExitPrompt(false);
    setGameEndReason('completed');
    
    // Initialize History with the first data point immediately so chart isn't empty
    const firstData = currentDataArray[actualStartIndex];
    const initialHistory: TurnHistory = {
        step: 0,
        gameYear: 0.5,
        realDate: firstData.Date_Str,
        userTotal: 0, // Starts at 0
        benchTotal: 0,
        price: firstData.Price,
        userCash: 0
    };
    
    setHistory([initialHistory]);
    setDialogue({
      textParts: [
        { text: "指挥官，连接已建立。市场数据正在实时传输...\n" },
        { text: "当前为初始基准点，请观察形势，选择您的第一个行动：\n加仓进攻、止盈回防，还是休整待机？" }
      ]
    });
    setStatus(GameStatus.PLAYING);
  };

  const handleNextTurn = (action: 'buy' | 'sell' | 'hold', amount: number) => {
    const currentIndex = startOffset + currentStep;
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= currentDataArray.length) {
      setGameEndReason('completed');
      setStatus(GameStatus.FINISHED);
      return;
    }

    const currentPrice = currentDataArray[currentIndex].Price;
    const nextPrice = currentDataArray[nextIndex].Price;

    // 1. Process Income
    let currentCash = userCash + SALARY;
    let currentShares = userShares;
    
    // 2. Process Bot Strategy
    const botSharesBought = SALARY / currentPrice;
    const newBotShares = botShares + botSharesBought;

    // 3. Process User Action
    if (action === 'buy') {
      const actualBuyAmount = Math.min(amount, currentCash);
      if (actualBuyAmount > 0) {
        const sharesBought = actualBuyAmount / currentPrice;
        currentShares += sharesBought;
        currentCash -= actualBuyAmount;
      }
    } else if (action === 'sell') {
      const currentHoldingsVal = currentShares * currentPrice;
      const actualSellAmount = Math.min(amount, currentHoldingsVal);
      if (actualSellAmount > 0) {
        const sharesSold = actualSellAmount / currentPrice;
        currentShares -= sharesSold;
        currentCash += actualSellAmount;
      }
    }

    // 4. Advance Time
    const newUserTotal = currentCash + (currentShares * nextPrice);
    const newBenchTotal = newBotShares * nextPrice;
    
    const nextStepNum = currentStep + 1;
    const nextGameYear = (currentStep / 2) + 1.0;

    const newHistoryEntry: TurnHistory = {
      step: nextStepNum,
      gameYear: nextGameYear,
      realDate: currentDataArray[nextIndex].Date_Str,
      userTotal: newUserTotal,
      benchTotal: newBenchTotal,
      price: nextPrice,
      userCash: currentCash
    };

    // 5. Statistics Calculation
    const isLosing = newUserTotal < newBenchTotal;
    const isWinningNow = newUserTotal > newBenchTotal; // Strict inequality: Equal does not count as win
    
    // Update Win Stats
    const newWinningCount = winningTurns + (isWinningNow ? 1 : 0);
    const winRate = ((newWinningCount / nextStepNum) * 100).toFixed(0);

    const assetDiff = newUserTotal - newBenchTotal;
    const assetDiffFormatted = Math.abs(assetDiff).toLocaleString(undefined, {maximumFractionDigits: 0});

    // 5-Year Performance Check Logic
    const isPerformanceCheckTurn = nextStepNum > 0 && nextStepNum % 10 === 0;

    // Color definitions
    const priceDiff = nextPrice - currentPrice;
    const pctChange = (priceDiff / currentPrice) * 100;
    const isBull = priceDiff >= 0;
    const absPct = Math.abs(pctChange).toFixed(2);
    const trendColorClass = isBull ? "text-emerald-400 font-bold" : "text-rose-400 font-bold";
    const trendIcon = isBull ? "📈" : "📉"; 

    // Generate Standard Narrative
    let narrativeParts: { text: string; className?: string }[] = [];
    
    // Part 1: Specific Year
    narrativeParts.push({ 
        text: `⏳ 投资第 ${nextGameYear.toFixed(1)} 年，周期结算完成。\n`, 
        className: "text-slate-500 font-bold" 
    });
    
    // Part 2: Market Performance (Relative to previous)
    narrativeParts.push({ text: "较半年前，", className: "text-slate-400" });
    if (isBull) {
        narrativeParts.push(
           { text: `${trendIcon} 市场${pctChange > 5 ? '大涨' : '微涨'} `, className: trendColorClass },
           { text: `+${absPct}%`, className: trendColorClass },
           { text: `。\n` }
        );
    } else {
        narrativeParts.push(
           { text: `${trendIcon} 市场${pctChange < -5 ? '暴跌' : '回调'} `, className: trendColorClass },
           { text: `-${absPct}%`, className: trendColorClass },
           { text: `。\n` }
        );
    }

    // Part 3: Battle Status & Win Rate
    narrativeParts.push({ text: "🆚 战况：您当前", className: "text-slate-300" });
    if (assetDiff > 0) {
         narrativeParts.push(
             { text: " 领先 ", className: "text-blue-400 font-bold" },
             { text: `定投大师 $${assetDiffFormatted}`, className: "text-blue-400 font-mono" }
         );
    } else if (assetDiff < 0) {
         narrativeParts.push(
             { text: " 落后 ", className: "text-yellow-500 font-bold" },
             { text: `定投大师 $${assetDiffFormatted}`, className: "text-yellow-500 font-mono" }
         );
    } else {
         narrativeParts.push(
             { text: " 与定投大师 ", className: "text-slate-300" },
             { text: "战平", className: "text-slate-300 font-bold" }
         );
    }
    
    // Add Win Rate Stat
    narrativeParts.push(
        { text: "。\n📊 您在 ", className: "text-slate-400" },
        { text: `${winRate}%`, className: "font-mono font-bold text-white" },
        { text: " 的时间内保持了领先。\n", className: "text-slate-400" }
    );

    // UPDATE STATE with new history immediately
    setHistory(prev => [...prev, newHistoryEntry]);
    setUserCash(currentCash);
    setUserShares(currentShares);
    setBotShares(newBotShares);
    setWinningTurns(newWinningCount);

    // LOGIC: Should we show the exit prompt?
    if (isPerformanceCheckTurn && isLosing) {
      // Trigger Exit Prompt
      narrativeParts.push(
        { text: "\n⚠️ 绩效评估警报 (5年周期)\n", className: "text-yellow-500 font-bold" },
        { text: "过去5年您的主动操作未能跑赢死板的定投策略。\n" },
        { text: "数据表明，继续频繁择时可能会进一步扩大劣势。\n" },
        { text: "您是选择相信自己能翻盘，还是承认定投更优并退出？" }
      );
      setShowExitPrompt(true);
    } else {
      // Normal Continue
      narrativeParts.push({ text: "请下达指令：继续加仓、止盈回防还是静观其变？" });
    }

    setDialogue({ textParts: narrativeParts });

    // 6. Check End Game (Data Exhausted)
    if (nextIndex + 1 >= currentDataArray.length) {
      setGameEndReason('completed');
      setStatus(GameStatus.FINISHED);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleEarlyExitDecision = (decision: 'continue' | 'exit') => {
    if (decision === 'continue') {
      setShowExitPrompt(false);
      setDialogue({
        textParts: [
          { text: "🫡 指令确认：坚持策略。\n", className: "text-blue-400 font-bold" },
          { text: "虽然暂时落后，但只有留在牌桌上才有翻盘的机会。\n请继续下达本回合操作指令。" }
        ]
      });
    } else {
      // Surrender
      setGameEndReason('surrendered');
      setStatus(GameStatus.FINISHED);
    }
  };

  const resetGame = () => {
    setStatus(GameStatus.IDLE);
    setHistory([]);
    setDialogue({ textParts: [] });
    setShowExitPrompt(false);
    setWinningTurns(0);
  }

  // --- Render Helpers ---

  const lastHistory = history.length > 0 ? history[history.length - 1] : null;
  const displayPrice = lastHistory ? lastHistory.price : 0;
  const displayCash = userCash; 
  const displayYear = (currentStep / 2) + 0.5;

  // New Game Menu (Main Menu)
  if (status === GameStatus.IDLE) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
              LazyInvestor
            </h1>
            <p className="text-slate-400 text-lg tracking-widest font-mono">击败定投大师</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">选择战场 (Market Index)</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSelectedIndex(MarketIndex.SPY)}
                  className={`py-3 px-4 rounded-lg font-bold transition-all border ${selectedIndex === MarketIndex.SPY ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  标普 500
                </button>
                <button 
                  onClick={() => setSelectedIndex(MarketIndex.NASDAQ)}
                  className={`py-3 px-4 rounded-lg font-bold transition-all border ${selectedIndex === MarketIndex.NASDAQ ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                  纳斯达克
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">时间线入口 (Start Year)</label>
              <select 
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="w-full bg-slate-800 text-white border border-slate-600 rounded-lg p-3 outline-none focus:border-blue-500 font-mono"
              >
                {validYears.map(year => (
                  <option key={year} value={year}>{year} 年</option>
                ))}
              </select>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all transform hover:scale-[1.02] active:scale-95"
            >
              START GAME
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-4">
              任务目标：利用择时策略，在资产总值上击败无脑定投的机器人。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- HUD Component ---
  const renderHUD = () => (
    <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg sticky top-0 z-20">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Player Stats */}
        <div className="flex flex-col items-start w-1/3">
          <div className="text-xs text-blue-400 font-bold tracking-wider mb-1">PLAYER (YOU)</div>
          <div className="text-2xl font-mono font-bold text-white">
            ${lastHistory ? lastHistory.userTotal.toLocaleString(undefined, {maximumFractionDigits:0}) : '0'}
          </div>
          <div className="flex gap-2 text-xs mt-1">
            <span className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-emerald-900/50">
              现金: ${(displayCash + SALARY).toLocaleString(undefined, {maximumFractionDigits:0})}
            </span>
          </div>
        </div>

        {/* Center Round Counter */}
        <div className="flex flex-col items-center w-1/3">
           <div className="bg-slate-900 px-6 py-2 rounded-full border border-slate-600 shadow-inner text-center min-w-[120px]">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">YEAR</div>
              <div className="text-xl font-black text-white">{displayYear.toFixed(1)} 年</div>
           </div>
           <div className="mt-2 text-xs text-slate-500 font-mono text-yellow-500">
             Index: ${displayPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}
           </div>
        </div>

        {/* Boss Stats */}
        <div className="flex flex-col items-end w-1/3">
          <div className="text-xs text-red-400 font-bold tracking-wider mb-1">定投大师 (BOSS)</div>
          <div className="text-2xl font-mono font-bold text-white">
            ${lastHistory ? lastHistory.benchTotal.toLocaleString(undefined, {maximumFractionDigits:0}) : '0'}
          </div>
          <div className="flex gap-2 text-xs mt-1">
             <span className="text-slate-500">
               状态: 自动定投中...
             </span>
          </div>
        </div>

      </div>
    </div>
  );

  // --- Game Over Screen ---
  const renderResults = () => {
    if (history.length === 0) return null;
    const finalHistory = history[history.length - 1];
    const diff = finalHistory.userTotal - finalHistory.benchTotal;
    const diffPercent = (diff / finalHistory.benchTotal) * 100;
    const won = diff > 0;
    
    // Determine title and color based on exit reason
    const isSurrender = gameEndReason === 'surrendered';

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className={`absolute top-0 left-0 w-full h-2 ${won ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
          
          <div className="text-center mb-8">
            <div className={`text-6xl mb-4 ${won ? 'animate-bounce' : ''}`}>
              {won ? "🏆" : (isSurrender ? "🏳️" : "💀")}
            </div>
            <h2 className={`text-4xl font-black mb-2 ${won ? 'text-emerald-400' : 'text-red-400'}`}>
              {won ? "VICTORY" : (isSurrender ? "WISE EXIT" : "DEFEAT")}
            </h2>
            <p className="text-slate-400 uppercase tracking-widest">
              {won ? "你击败了定投大师！" : (isSurrender ? "及时止损，也是一种智慧" : "你被定投策略碾压了...")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">最终资产 (Player)</div>
                <div className="text-2xl font-mono text-blue-400">${finalHistory.userTotal.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
             </div>
             <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">最终资产 (Boss)</div>
                <div className="text-2xl font-mono text-red-400">${finalHistory.benchTotal.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
             </div>
          </div>

          <div className="text-center">
             <div className={`inline-block px-4 py-2 rounded mb-6 font-bold text-xl ${won ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                收益差距: {diff > 0 ? '+' : ''}{diffPercent.toFixed(2)}%
             </div>
             
             <div className="text-sm text-slate-400 mb-8 px-6 leading-relaxed">
               {/* Contextual Feedback Message */}
               {won ? (
                  <p>战术分析：你精准的择时操作成功捕捉了市场波段。但请记住，在漫长的历史长河中，这可能是一次幸存者偏差。你能连续两次击败它吗？</p>
               ) : isSurrender ? (
                  <p className="text-yellow-100">
                    <span className="font-bold text-yellow-500 block mb-2">💡 投资启示</span>
                    您在第 <span className="font-mono text-white">{displayYear.toFixed(1)}</span> 年选择承认定投策略的优越性。
                    <br/>
                    这是一个明智的决定。数据显示，90%的主动投资者长期跑输指数。
                    对于普通人而言，承认这一点并拥抱长期定投（Dollar Cost Averaging），往往是通往财务自由最稳健、最轻松的道路。
                  </p>
               ) : (
                  <p>战术分析：频繁操作导致了‘摩擦成本’和‘现金拖累’。定投大师没有任何花哨的操作，仅仅凭借‘在场’（Time in market）就击败了你。</p>
               )}
               
               <div className="mt-6 pt-6 border-t border-slate-700">
                真实历史时间: <span className="text-white font-mono">{history[0].realDate}</span> 至 <span className="text-white font-mono">{finalHistory.realDate}</span>
               </div>
             </div>

             <button 
               onClick={resetGame}
               className="bg-white text-slate-900 hover:bg-slate-200 font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
             >
               再次挑战 (REPLAY)
             </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Game Loop Render ---
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200">
      {renderHUD()}
      
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Chart Area - Now showing Market Price */}
          <GameChart 
            history={history} 
            showRealDates={status === GameStatus.FINISHED} 
          />
          
          {/* Controls Area: Now Unified Dialogue & Action Panel */}
          <div className="pb-6">
             {status === GameStatus.PLAYING && (
                <Controls 
                  gameStatus={status}
                  cash={userCash}
                  currentHoldingsValue={userShares * displayPrice}
                  onNextTurn={handleNextTurn}
                  salary={SALARY}
                  dialogue={dialogue}
                  showEarlyExitPrompt={showExitPrompt}
                  onEarlyExitDecision={handleEarlyExitDecision}
                />
             )}
          </div>
        </div>
      </main>

      {status === GameStatus.FINISHED && renderResults()}
    </div>
  );
};

export default App;