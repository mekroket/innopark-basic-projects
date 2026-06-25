import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Users2, ArrowRight } from 'lucide-react';

export const CommunityHub = () => {
  const { communities, toggleCommunity } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Topluluk Merkezleri</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">Güneş sistemi genelindeki sinirsel frekans loncaları</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {communities.map((hub, i) => (
          <GlassCard 
            key={hub.id} 
            delay={i * 0.05} 
            className={`bg-gradient-to-br ${hub.color} border border-slate-200 dark:border-white/10 group overflow-visible flex flex-col justify-between`}
            hover={true}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-slate-500 dark:text-white/50 font-bold uppercase tracking-widest">{hub.type}</span>
                <div 
                  onClick={() => navigate(`/community/${hub.id}`)}
                  className="p-2 bg-slate-200/50 dark:bg-white/5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowRight size={16} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 cursor-pointer" onClick={() => navigate(`/community/${hub.id}`)}>{hub.name}</h3>
              <p className="text-xs text-slate-600 dark:text-white/60 mb-4 leading-relaxed">{hub.description}</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-300/30 dark:border-white/5 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-white/80 font-medium">
                <Users2 size={16} className="text-primary" /> {hub.members.toLocaleString()} Üye
              </div>
              <button 
                onClick={() => toggleCommunity(hub.id)}
                className={`text-xs px-4 py-1.5 rounded-xl font-semibold border transition-all ${hub.isJoined ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-white/10 border-slate-400/40 text-slate-800 dark:text-white hover:bg-primary hover:border-primary hover:text-white'}`}
              >
                {hub.isJoined ? 'Ayrıl' : 'Katıl'}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};