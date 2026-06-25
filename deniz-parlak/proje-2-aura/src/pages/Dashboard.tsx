import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, MapPin, Activity, Bell, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const chartData = [
  { time: '00:00', ping: 120 }, { time: '04:00', ping: 85 },
  { time: '08:00', ping: 150 }, { time: '12:00', ping: 45 },
  { time: '16:00', ping: 60 }, { time: '20:00', ping: 90 },
];

export const Dashboard = () => {
  const { 
    user, tasks, addTask, toggleTask, deleteTask, notifications, markNotificationsAsRead, settings 
  } = useApp();
  
  const [taskInput, setTaskInput] = useState('');
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [activeModalCard, setActiveModalCard] = useState<{ title: string; detail: string } | null>(null);

  const anim = settings.animationsEnabled;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    addTask(taskInput.trim());
    setTaskInput('');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <header className="flex justify-between items-end mb-8 relative">
        <div>
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Tekrar hoş geldin, {user?.name || 'Komutan'}</h1>
          <div className="flex items-center text-slate-500 dark:text-white/50 text-sm">
            <MapPin size={14} className="mr-1 text-primary" /> Sektör 4, Mars Kolonisi
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifPanel(!showNotifPanel);
              if (!showNotifPanel) markNotificationsAsRead();
            }}
            className="p-3 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-300/50 dark:hover:bg-white/10 transition-colors relative"
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2,5 h-2,5 w-2.5 h-2.5 bg-secondary rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <motion.div 
                initial={anim ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl z-50 text-sm max-h-96 overflow-y-auto backdrop-blur-xl"
              >
                <h4 className="font-bold mb-3 flex justify-between items-center">
                  <span>Bildirim Merkez Paneli</span>
                  {unreadNotificationsCount > 0 && <span className="text-xs font-normal text-secondary">Okundu Yapıldı</span>}
                </h4>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-2.5 rounded-lg border text-xs transition-colors ${n.unread ? 'bg-primary/5 border-primary/20 font-medium' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
                      <p className="text-slate-700 dark:text-white/80">{n.text}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 relative overflow-hidden" delay={0.1} hover={false}>
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none text-slate-900 dark:text-white">
            <Activity size={100} />
          </div>
          <h2 className="text-xl font-semibold mb-2">AuraMind Durumu</h2>
          <p className="text-sm text-slate-600 dark:text-white/70 mb-4 max-w-md">
            YSA Modülü aktif. Gezegenler arası gecikme %99.8 oranında telafi ediliyor. Öngörücü modeller uzak oturumlarınızı kesintisiz tutuyor.
          </p>
          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="currentColor" className="text-slate-400 opacity-40" fontSize={11} />
                <YAxis stroke="currentColor" className="text-slate-400 opacity-40" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#070B18', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="ping" stroke="#00F0FF" fillOpacity={1} fill="url(#colorPing)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={0.2} hover={false} className="flex flex-col">
          <h2 className="text-xl font-semibold mb-1">Günlük Görevler</h2>
          <div className="mb-3 flex justify-between items-center text-xs text-slate-500 dark:text-white/50">
            <span>İlerleme Oranı: %{progressPercent}</span>
            <span>{completedTasksCount}/{tasks.length} Başarı</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          <form onSubmit={handleAddTaskSubmit} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Yeni kuantum görevi yaz..."
              className="flex-1 text-sm bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
            <button type="submit" className="p-2 bg-primary hover:bg-primary/80 text-white rounded-xl transition-colors shrink-0">
              <Plus size={18} />
            </button>
          </form>

          <div className="flex-1 space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {tasks.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-6">Kuyrukta aktif operasyonel görev bulunmuyor.</p>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    task.completed 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-black/5 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => toggleTask(task.id)}>
                    <CheckCircle2 size={18} className={`shrink-0 transition-colors ${task.completed ? "text-primary" : "text-slate-400 dark:text-white/30"}`} />
                    <span className={`text-xs truncate transition-all ${task.completed ? "text-slate-400 dark:text-white/40 line-through" : "text-slate-800 dark:text-white/90"}`}>
                      {task.text}
                    </span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Dünya İletişim', stat: 'Senkronize', color: 'from-blue-500 to-cyan-400', detail: 'Kuantum dolaşıklık röleleri aktiftir. Veri akış bant genişliği saniyede 40 Terabit seviyesindedir. Kesinti saptanmamıştır.' },
          { title: 'Mars Yerel', stat: '1.2ms', color: 'from-red-500 to-orange-500', detail: 'Kubbe içi fiber optik ve milimetrik dalga kablosuz ağ gecikme endeksidir. Optimum verimlilik sınırları içerisindedir.' },
          { title: 'Titan Rölesi', stat: '14ms', color: 'from-purple-500 to-pink-500', detail: 'Satürn yörünge aktarıcı istasyonlarının geri bildirim tamponlama gecikmesidir. Atmosferik metan yoğunluğu dalgalanma yaratmamaktadır.' },
          { title: 'Europa Merkezi', stat: 'Çevrimdışı', color: 'from-gray-600 to-slate-400', detail: 'Jüpiter kaynaklı yoğun manyetik radyasyon kalkanı kırılması sebebiyle derin buzaltı sunucu kümesi otonom emniyet moduna geçmiştir.' },
        ].map((item, i) => (
          <div key={i} onClick={() => setActiveModalCard({ title: item.title, detail: item.detail })}>
            <GlassCard delay={0.3 + (i * 0.1)} className="cursor-pointer hover:border-primary/40 transition-all">
              <h3 className="text-slate-500 dark:text-white/50 text-sm font-medium mb-1">{item.title}</h3>
              <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${item.color}`}>
                {item.stat}
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeModalCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full relative text-slate-900 dark:text-white shadow-2xl"
            >
              <button onClick={() => setActiveModalCard(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={18} />
              </button>
              <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{activeModalCard.title} Analiz Raporu</h3>
              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">{activeModalCard.detail}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};