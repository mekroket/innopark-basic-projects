import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { Award, ShieldCheck, Hexagon, Terminal, Edit3, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const availableAvatars = [
  'https://i.pravatar.cc/150?u=a1',
  'https://i.pravatar.cc/150?u=a2',
  'https://i.pravatar.cc/150?u=a3',
  'https://i.pravatar.cc/150?u=a4',
  'https://i.pravatar.cc/300?u=commander'
];

export const Profile = () => {
  const { user, tasks, communities, events, purchasedTickets, updateProfile, settings } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editTitle, setEditTitle] = useState(user?.title || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || availableAvatars[0]);

  const anim = settings.animationsEnabled;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const joinedCommunities = communities.filter(c => c.isJoined);
  const boughtEvents = events.filter(e => purchasedTickets.includes(e.id));

  // Dinamik Rozet Algoritması
  const badges = [
    { name: 'İlk Yerleşimci', unlocked: true },
    { name: 'Kod Dokuyucu', unlocked: joinedCommunities.length >= 1 },
    { name: 'Sıfır Yerçekimi', unlocked: boughtEvents.length >= 1 },
    { name: 'Yapay Zeka Fısıldayan', unlocked: completedTasksCount >= 2 }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editTitle.trim()) return;
    updateProfile(editName.trim(), editTitle.trim(), editAvatar);
    setIsEditModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <GlassCard className="p-8 relative overflow-hidden" hover={false}>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/30 to-secondary/30 opacity-40 blur-sm" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 mt-12">
          <div className="w-28 h-28 rounded-2xl bg-slate-100 dark:bg-[#070B18] p-1 border border-primary/40 relative shrink-0">
            <img src={user?.avatar || 'https://i.pravatar.cc/300?u=commander'} className="w-full h-full rounded-xl object-cover" alt="Profile" />
            <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-slate-900 p-0.5 rounded-full shadow-lg">
              <ShieldCheck size={16} className="text-white" />
            </div>
          </div>
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate tracking-tight">{user?.name || 'Deniz Komutan'}</h1>
            <p className="text-primary font-semibold text-sm truncate">{user?.title || 'Yapay Zeka Operasyon Mühendisi'}</p>
          </div>
          <button 
            onClick={() => { setEditName(user?.name || ''); setEditTitle(user?.title || ''); setEditAvatar(user?.avatar || ''); setIsEditModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-300/50 dark:hover:bg-white/10 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Edit3 size={14} /> Matrixi Düzenle
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <GlassCard delay={0.1} hover={false}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 text-primary rounded-xl"><Terminal size={22} /></div>
              <div>
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wide">Görev Senkronizasyonu</h3>
                <p className="text-2xl font-bold mt-0.5">{completedTasksCount} / {tasks.length}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard delay={0.15} hover={false}>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-3">Aktif Rezervasyonlar</h3>
            {boughtEvents.length === 0 ? (
              <p className="text-xs text-slate-400">Cüzdanda aktif etkinlik bileti bulunamadı.</p>
            ) : (
              <div className="space-y-2">
                {boughtEvents.map((e, index) => (
                  <div key={index} className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs font-medium truncate">
                    🎟️ {e.title}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <GlassCard delay={0.2} hover={false}>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
              <Award className="text-secondary" size={16}/> Kazanılan Kuantum Rozetleri
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${badge.unlocked ? 'bg-primary/5 border-primary/20 text-slate-800 dark:text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 border-transparent opacity-35'}`}
                >
                  <Hexagon size={16} className={badge.unlocked ? 'text-primary animate-pulse' : 'text-slate-400'} /> 
                  <span className="truncate">{badge.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard delay={0.25} hover={false}>
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-3">Bağlanılan Frekans Kanalları (Topluluklar)</h3>
            {joinedCommunities.length === 0 ? (
              <p className="text-xs text-slate-400">Henüz hiçbir lonca ağ fırtınasına katılım sağlanmadı.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {joinedCommunities.map((c, index) => (
                  <span key={index} className="px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold">
                    🛰️ {c.name}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={anim ? { scale: 0.9, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-sm w-full relative text-slate-900 dark:text-white shadow-2xl"
            >
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Kimlik Katmanını Güncelle</h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kolonist İsmi</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gezegen Sektör Görevi</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-300 dark:border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hologram Modeli Seçimi</label>
                  <div className="flex gap-2 justify-center">
                    {availableAvatars.map((av, idx) => (
                      <img
                        key={idx}
                        src={av}
                        alt="Edit Option"
                        onClick={() => setEditAvatar(av)}
                        className={`w-10 h-10 rounded-lg cursor-pointer border-2 transition-all object-cover ${editAvatar === av ? 'border-primary scale-105' : 'border-transparent opacity-50'}`}
                      />
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md mt-4"
                >
                  <Save size={14} /> Güncellemeleri Kilitle
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};