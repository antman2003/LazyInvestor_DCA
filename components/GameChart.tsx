import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TurnHistory } from '../types';

interface GameChartProps {
  history: TurnHistory[];
  showRealDates: boolean;
}

const GameChart: React.FC<GameChartProps> = ({ history, showRealDates }) => {
  const formatYAxis = (value: number) => {
    return value.toLocaleString();
  };

  const formatXAxis = (tickItem: any) => {
    if (showRealDates) {
      return tickItem.split('-')[0]; 
    }
    // tickItem is gameYear (0.5, 1.0, 1.5 etc)
    return `${Number(tickItem).toFixed(1)} 年`; 
  };

  // Prepare data for Recharts
  const data = history.map(h => ({
    ...h,
    xAxisKey: showRealDates ? h.realDate : h.gameYear, // Use gameYear instead of step
  }));

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg border border-slate-700 text-slate-500 animate-pulse font-mono">
        <p className="text-lg">waiting_for_signal...</p>
        <p className="text-sm">Battlefield Initializing</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 p-4 relative overflow-hidden">
      {/* Decorative scanline effect */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-50 pointer-events-none"></div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
          <XAxis 
            dataKey="xAxisKey" 
            tickFormatter={formatXAxis} 
            stroke="#94a3b8"
            fontSize={12}
            minTickGap={30}
            tick={{ fill: '#94a3b8', fontFamily: 'monospace' }}
            type={showRealDates ? "category" : "number"}
            domain={['auto', 'auto']}
            allowDecimals={true}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            stroke="#94a3b8"
            fontSize={12}
            width={60}
            tick={{ fill: '#94a3b8', fontFamily: 'monospace' }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, ""]}
            labelFormatter={(label) => showRealDates ? `日期: ${label}` : `第 ${Number(label).toFixed(1)} 年`}
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.95)', 
              borderRadius: '4px', 
              border: '2px solid #eab308', 
              color: '#f8fafc',
              fontFamily: 'monospace',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' 
            }}
            itemStyle={{ color: '#eab308' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px', fontFamily: 'monospace' }} />
          
          <Line
            type="monotone"
            dataKey="price"
            name="市场指数价格 (Market Index)"
            stroke="#eab308" // Gold color for Market Price
            strokeWidth={3}
            dot={showRealDates ? false : { r: 3, fill: '#eab308', stroke: '#1e293b', strokeWidth: 1 }}
            activeDot={{ r: 6, fill: '#facc15' }}
            animationDuration={500}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GameChart;