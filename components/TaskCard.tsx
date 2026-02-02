
import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, OrderStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onUpdateOrderStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onBreakdown: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onToggleFavorite: (id: string) => void;
  onPromote: (id: string) => void;
  isBreakingDown: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onUpdateStatus, 
  onUpdateOrderStatus,
  onDelete, 
  onEdit,
  onBreakdown, 
  onToggleSubtask,
  onToggleFavorite,
  onPromote,
  isBreakingDown 
}) => {
  const [showSubtasks, setShowSubtasks] = useState(true);

  const priorityColors = {
    [TaskPriority.LOW]: 'bg-blue-100 text-blue-600 border-blue-200',
    [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    [TaskPriority.HIGH]: 'bg-red-100 text-red-600 border-red-200',
  };

  const statusColors = {
    [TaskStatus.TODO]: 'border-slate-100',
    [TaskStatus.IN_PROGRESS]: 'border-indigo-200 bg-indigo-50/20',
    [TaskStatus.DONE]: 'opacity-60 bg-slate-50 border-slate-100',
  };

  const orderStatusConfig = {
    [OrderStatus.PENDING]: { icon: 'fa-clock', color: 'text-amber-500', bg: 'bg-amber-50' },
    [OrderStatus.SHIPPED]: { icon: 'fa-truck-fast', color: 'text-blue-500', bg: 'bg-blue-50' },
    [OrderStatus.DELIVERED]: { icon: 'fa-box-open', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  };

  const toggleMainStatus = () => {
    const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    onUpdateStatus(task.id, newStatus);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${statusColors[task.status]} group hover:shadow-md mb-4 relative overflow-hidden`}>
      {task.isFavorite && (
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
          <div className="bg-rose-400 text-white text-[8px] font-bold uppercase py-1 px-4 transform rotate-45 translate-x-2 -translate-y-1 shadow-sm text-center">
            Fav
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2 gap-3">
        {/* Completion Toggle */}
        <button 
          onClick={toggleMainStatus}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === TaskStatus.DONE 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-200 hover:border-indigo-400 text-transparent'
          }`}
        >
          <i className="fa-solid fa-check text-[10px]"></i>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
            {task.dueDate && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i className="fa-regular fa-calendar text-[8px]"></i> {formatDate(task.dueDate)}
              </span>
            )}
            {task.isWishlist && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i className="fa-solid fa-wand-sparkles text-[8px]"></i> Wishlist
              </span>
            )}
            {task.isOrder && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i className="fa-solid fa-cart-shopping text-[8px]"></i> Order
              </span>
            )}
          </div>
          <h3 className={`font-semibold text-slate-600 transition-all truncate ${task.status === TaskStatus.DONE ? 'line-through opacity-50' : ''}`}>
            {task.title}
          </h3>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button 
            onClick={() => onToggleFavorite(task.id)}
            className={`transition-colors p-1.5 rounded-lg hover:bg-rose-50 ${task.isFavorite ? 'text-rose-500' : 'text-slate-300'}`}
            title="Favorite"
          >
            <i className={`fa-${task.isFavorite ? 'solid' : 'regular'} fa-heart`}></i>
          </button>
          <button 
            onClick={() => onEdit(task)}
            className="text-slate-300 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-50"
            title="Edit"
          >
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50"
            title="Delete"
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      <p className={`text-sm text-slate-400 mb-4 line-clamp-2 transition-all ${task.status === TaskStatus.DONE ? 'opacity-40' : ''}`}>
        {task.description}
      </p>

      {/* Order Status Tracker */}
      {task.isOrder && task.orderStatus && (
        <div className="mb-6 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Order Progress</span>
            <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${orderStatusConfig[task.orderStatus].color}`}>
              <i className={`fa-solid ${orderStatusConfig[task.orderStatus].icon}`}></i>
              {task.orderStatus}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Object.values(OrderStatus).map((os) => {
              const isActive = task.orderStatus === os;
              return (
                <button
                  key={os}
                  onClick={() => onUpdateOrderStatus(task.id, os)}
                  className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${
                    isActive 
                      ? `${orderStatusConfig[os].bg} ${orderStatusConfig[os].color} border-current` 
                      : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                  }`}
                >
                  {os}
                </button>
              );
            })}
          </div>
          {/* Visual Bar */}
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div className={`h-full transition-all duration-500 ${task.orderStatus === OrderStatus.PENDING ? 'w-1/3 bg-amber-400' : task.orderStatus === OrderStatus.SHIPPED ? 'w-2/3 bg-blue-400' : 'w-full bg-emerald-400'}`}></div>
          </div>
        </div>
      )}

      {task.subtasks.length > 0 && (
        <div className="mb-4">
          <button 
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="text-xs font-semibold text-slate-400 hover:text-indigo-500 flex items-center gap-1 mb-2"
          >
            <i className={`fa-solid fa-chevron-${showSubtasks ? 'down' : 'right'}`}></i>
            Sub-tasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})
          </button>
          
          {showSubtasks && (
            <div className="space-y-1.5 ml-1">
              {task.subtasks.map(sub => (
                <div 
                  key={sub.id} 
                  className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:bg-white p-1 rounded transition-colors"
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                >
                  <i className={`fa-regular ${sub.completed ? 'fa-square-check text-indigo-400' : 'fa-square text-slate-200'}`}></i>
                  <span className={sub.completed ? 'line-through text-slate-300' : ''}>{sub.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex gap-2">
          {task.isWishlist ? (
            <button
              onClick={() => onPromote(task.id)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-indigo-100"
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              Start Task
            </button>
          ) : (
            task.status !== TaskStatus.DONE && (
              <button
                onClick={() => onBreakdown(task.id)}
                disabled={isBreakingDown}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-100 text-indigo-500 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 ${isBreakingDown ? 'animate-pulse opacity-50' : ''}`}
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                {isBreakingDown ? 'Thinking...' : 'AI Breakdown'}
              </button>
            )
          )}
        </div>

        {!task.isWishlist && (
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
            {Object.values(TaskStatus).map((s) => (
              <button
                key={s}
                onClick={() => onUpdateStatus(task.id, s)}
                className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded-md transition-all ${
                  task.status === s 
                  ? 'bg-white text-indigo-500 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
