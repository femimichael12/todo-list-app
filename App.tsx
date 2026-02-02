
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority, OrderStatus, ProductivityInsight } from './types';
import TaskCard from './components/TaskCard';
import Dashboard from './components/Dashboard';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insight, setInsight] = useState<ProductivityInsight | null>(null);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'wishlist' | 'favorites'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');

  // Form State (shared between Add and Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newCategory, setNewCategory] = useState('Personal');
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [asWishlist, setAsWishlist] = useState(false);
  const [asOrder, setAsOrder] = useState(false);

  // Constants
  const categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance'];

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('omnitask_data');
    if (saved) {
      try {
        const loadedTasks = JSON.parse(saved);
        setTasks(loadedTasks.map((t: any) => ({
          ...t,
          isFavorite: t.isFavorite || false,
          isWishlist: t.isWishlist || false,
          isOrder: t.isOrder || false,
          orderStatus: t.orderStatus || (t.isOrder ? OrderStatus.PENDING : undefined)
        })));
      } catch (e) {
        console.error("Error loading tasks", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('omnitask_data', JSON.stringify(tasks));
  }, [tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? {
        ...t,
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        category: newCategory,
        dueDate: newDueDate,
        isWishlist: asWishlist,
        isOrder: asOrder,
        orderStatus: asOrder && !t.orderStatus ? OrderStatus.PENDING : t.orderStatus
      } : t));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTitle,
        description: newDesc,
        status: TaskStatus.TODO,
        priority: newPriority,
        category: newCategory,
        dueDate: newDueDate,
        createdAt: new Date().toISOString(),
        subtasks: [],
        isFavorite: false,
        isWishlist: asWishlist,
        isOrder: asOrder,
        orderStatus: asOrder ? OrderStatus.PENDING : undefined
      };
      setTasks([newTask, ...tasks]);
    }
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewPriority(TaskPriority.MEDIUM);
    setNewCategory('Personal');
    setNewDueDate(new Date().toISOString().split('T')[0]);
    setAsWishlist(false);
    setAsOrder(false);
    setEditingId(null);
    setShowTaskForm(false);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setNewTitle(task.title);
    setNewDesc(task.description);
    setNewPriority(task.priority);
    setNewCategory(task.category);
    setNewDueDate(task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setAsWishlist(task.isWishlist);
    setAsOrder(task.isOrder);
    setShowTaskForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const updateOrderStatus = useCallback((id: string, orderStatus: OrderStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, orderStatus } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
        };
      }
      return t;
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t));
  }, []);

  const promoteFromWishlist = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isWishlist: false } : t));
    setActiveTab('all');
  }, []);

  const handleAIInsight = async () => {
    if (tasks.length === 0) return;
    setLoadingInsight(true);
    try {
      const result = await geminiService.getProductivityInsights(tasks);
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleBreakdown = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setBreakingDownId(taskId);
    try {
      const subtaskTitles = await geminiService.breakDownTask(task.title, task.description);
      const subtasks = subtaskTitles.map(title => ({
        id: crypto.randomUUID(),
        title,
        completed: false
      }));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, subtasks: [...t.subtasks, ...subtasks] } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setBreakingDownId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPriority('all');
    setFilterCategory('all');
  };

  const { pendingTasks, completedTasks, isFiltered } = useMemo(() => {
    const filtered = tasks.filter(t => {
      // Tab filter
      const matchesTab = 
        activeTab === 'wishlist' ? t.isWishlist :
        activeTab === 'favorites' ? t.isFavorite :
        !t.isWishlist;
      
      if (!matchesTab) return false;

      // Search term filter
      const matchesSearch = 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Priority filter
      const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
      if (!matchesPriority) return false;

      // Category filter
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      if (!matchesCategory) return false;

      return true;
    });

    const isAnyFilterActive = searchTerm !== '' || filterPriority !== 'all' || filterCategory !== 'all';

    return {
      pendingTasks: filtered.filter(t => t.status !== TaskStatus.DONE),
      completedTasks: filtered.filter(t => t.status === TaskStatus.DONE),
      isFiltered: isAnyFilterActive
    };
  }, [tasks, activeTab, searchTerm, filterPriority, filterCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 pb-20">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-check-double text-xl"></i>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-slate-500 leading-none">OmniTask</h1>
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest">Powered by AI</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => {
              if(showTaskForm) resetForm();
              else setShowTaskForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
          >
            <i className={`fa-solid ${showTaskForm ? 'fa-xmark' : 'fa-plus'}`}></i>
            <span className="hidden sm:inline">{showTaskForm ? 'Cancel' : 'New Task'}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-7 space-y-6">
          
          {showTaskForm && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">
                {editingId ? 'Edit Task' : 'Create New Task'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                   <input
                    type="text"
                    placeholder="What needs to be done?"
                    className="flex-1 text-lg font-bold border-none focus:ring-0 placeholder:text-slate-200 text-slate-500 bg-white min-w-[200px]"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-1.5 w-full sm:w-auto">
                    <button 
                      type="button" 
                      onClick={() => setAsWishlist(!asWishlist)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold px-2.5 py-2 rounded-lg border transition-all ${asWishlist ? 'border-amber-100 bg-amber-50 text-amber-500' : 'border-slate-100 bg-white text-slate-300'}`}
                    >
                      <i className="fa-solid fa-wand-sparkles"></i>
                      Wishlist
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAsOrder(!asOrder)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold px-2.5 py-2 rounded-lg border transition-all ${asOrder ? 'border-indigo-100 bg-indigo-50 text-indigo-500' : 'border-slate-100 bg-white text-slate-300'}`}
                    >
                      <i className="fa-solid fa-cart-shopping"></i>
                      Order
                    </button>
                  </div>
                </div>
                <textarea
                  placeholder="Add details (optional)"
                  className="w-full border-none focus:ring-0 text-sm text-slate-400 min-h-[80px] resize-none bg-white"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
                
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                  <div className="space-y-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Priority</label>
                    <div className="flex gap-1 bg-white border border-slate-100 p-1 rounded-lg w-full">
                      {Object.values(TaskPriority).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            newPriority === p ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="block w-full text-xs font-bold border border-slate-100 bg-white rounded-lg p-1.5 focus:ring-0 text-slate-500"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1 w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Due Date</label>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="block w-full text-xs font-bold border border-slate-100 bg-white rounded-lg p-1.5 focus:ring-0 text-slate-500"
                    />
                  </div>

                  <div className="w-full sm:flex-1 flex flex-col sm:flex-row justify-end items-stretch sm:items-end gap-2 mt-4 sm:mt-0">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-slate-400 font-bold text-sm px-4 py-2.5 order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-slate-700 text-white px-6 py-3 sm:py-2.5 rounded-xl font-bold text-sm hover:bg-slate-600 transition-all shadow-lg shadow-slate-200 order-1 sm:order-2 w-full sm:w-auto"
                    >
                      {editingId ? 'Save Changes' : `Create ${asWishlist ? 'Wish' : asOrder ? 'Order' : 'Task'}`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 py-2.5 px-3 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="all">All Priorities</option>
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-500 py-2.5 px-3 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            {(isFiltered || activeTab !== 'all') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Showing {pendingTasks.length + completedTasks.length} results
                </div>
                <button
                  onClick={clearFilters}
                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  <i className="fa-solid fa-filter-circle-xmark"></i>
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-500 flex items-center gap-2">
                {activeTab === 'all' && 'Tasks'}
                {activeTab === 'wishlist' && 'Wish List'}
                {activeTab === 'favorites' && 'Favorites'}
                <span className="text-xs font-medium text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full">
                  {pendingTasks.length + completedTasks.length}
                </span>
              </h2>
              
              <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}>Tasks</button>
                <button onClick={() => setActiveTab('wishlist')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'wishlist' ? 'bg-amber-50 text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}>Wishlist</button>
                <button onClick={() => setActiveTab('favorites')} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-rose-50 text-rose-500' : 'text-slate-300 hover:text-slate-400'}`}>Favorites</button>
              </div>
            </div>

            <div className="space-y-8">
              {/* Pending Section */}
              <div className="space-y-4">
                {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <i className={`fa-solid ${isFiltered ? 'fa-magnifying-glass' : activeTab === 'wishlist' ? 'fa-wand-sparkles' : activeTab === 'favorites' ? 'fa-heart' : 'fa-list-check'} text-2xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-500">{isFiltered ? 'No matches found' : 'Nothing here yet'}</h3>
                      <p className="text-sm text-slate-300">
                        {isFiltered ? 'Try adjusting your search or filters' : 'Start organizing your day by adding some items!'}
                      </p>
                    </div>
                  </div>
                ) : (
                  pendingTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdateStatus={updateTaskStatus}
                      onUpdateOrderStatus={updateOrderStatus}
                      onDelete={deleteTask}
                      onEdit={startEdit}
                      onBreakdown={handleBreakdown}
                      onToggleSubtask={toggleSubtask}
                      onToggleFavorite={toggleFavorite}
                      onPromote={promoteFromWishlist}
                      isBreakingDown={breakingDownId === task.id}
                    />
                  ))
                )}
              </div>

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors bg-white/50 px-4 py-2 rounded-xl border border-slate-100"
                  >
                    <i className={`fa-solid fa-chevron-${showCompleted ? 'down' : 'right'}`}></i>
                    Completed ({completedTasks.length})
                  </button>
                  
                  {showCompleted && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {completedTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdateStatus={updateTaskStatus}
                          onUpdateOrderStatus={updateOrderStatus}
                          onDelete={deleteTask}
                          onEdit={startEdit}
                          onBreakdown={handleBreakdown}
                          onToggleSubtask={toggleSubtask}
                          onToggleFavorite={toggleFavorite}
                          onPromote={promoteFromWishlist}
                          isBreakingDown={breakingDownId === task.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-28">
             <Dashboard tasks={tasks} insight={insight} loadingInsight={loadingInsight} onRefreshInsight={handleAIInsight} />
          </div>
        </div>

      </main>

      {!showTaskForm && (
        <button onClick={() => setShowTaskForm(true)} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl">
          <i className="fa-solid fa-plus"></i>
        </button>
      )}
    </div>
  );
};

export default App;
