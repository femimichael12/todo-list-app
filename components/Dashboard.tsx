
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Task, TaskStatus, ProductivityInsight } from '../types';

interface DashboardProps {
  tasks: Task[];
  insight: ProductivityInsight | null;
  loadingInsight: boolean;
  onRefreshInsight: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, insight, loadingInsight, onRefreshInsight }) => {
  const stats = {
    total: tasks.filter(t => !t.isWishlist).length,
    todo: tasks.filter(t => !t.isWishlist && t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => !t.isWishlist && t.status === TaskStatus.IN_PROGRESS).length,
    done: tasks.filter(t => !t.isWishlist && t.status === TaskStatus.DONE).length,
    wishlist: tasks.filter(t => t.isWishlist).length,
    favorites: tasks.filter(t => t.isFavorite).length,
  };

  const chartData = [
    { name: 'To Do', value: stats.todo, color: '#cbd5e1' },
    { name: 'In Progress', value: stats.inProgress, color: '#818cf8' },
    { name: 'Done', value: stats.done, color: '#34d399' },
  ];

  const priorityData = [
    { name: 'Low', count: tasks.filter(t => t.priority === 'low').length },
    { name: 'Med', count: tasks.filter(t => t.priority === 'medium').length },
    { name: 'High', count: tasks.filter(t => t.priority === 'high').length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 flex justify-between items-center">
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase mb-1">Active Tasks</div>
            <div className="text-2xl font-bold text-slate-600">{stats.total}</div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Wishlist</div>
              <div className="text-lg font-bold text-amber-500">{stats.wishlist}</div>
            </div>
            <div className="text-center border-l border-slate-50 pl-4">
              <div className="text-[10px] font-bold text-rose-400 uppercase">Favs</div>
              <div className="text-lg font-bold text-rose-500">{stats.favorites}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-indigo-300 uppercase mb-1">Doing</div>
          <div className="text-2xl font-bold text-indigo-500">{stats.inProgress}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-semibold text-emerald-300 uppercase mb-1">Done</div>
          <div className="text-2xl font-bold text-emerald-500">{stats.done}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-600 mb-6 flex items-center justify-between">
          Analytics
          <span className="text-xs font-normal text-slate-300">Task distribution</span>
        </h3>
        <div className="h-64 flex">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="50%" height="100%">
            <BarChart data={priorityData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#cbd5e1" fontSize={12} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/30 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2 text-indigo-50">
              <i className="fa-solid fa-sparkles text-white"></i>
              AI Productivity Coach
            </h3>
            <button 
              onClick={onRefreshInsight}
              disabled={loadingInsight}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loadingInsight ? 'Consulting...' : 'Refresh'}
            </button>
          </div>

          {insight ? (
            <div className="space-y-4">
              <p className="text-sm font-medium opacity-80">{insight.summary}</p>
              <ul className="space-y-2">
                {insight.suggestions.map((s, i) => (
                  <li key={i} className="text-xs flex gap-2">
                    <span className="opacity-40">•</span>
                    {s}
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-white/10 italic text-sm text-indigo-100">
                "{insight.encouragement}"
              </div>
            </div>
          ) : (
            <div className="text-center py-8 opacity-50">
              <i className="fa-solid fa-brain text-2xl mb-2"></i>
              <p className="text-sm">Click refresh to get personalized coaching</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
