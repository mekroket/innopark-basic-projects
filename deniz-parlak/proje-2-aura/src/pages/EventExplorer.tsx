import { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, CheckCircle2 } from 'lucide-react';

export const EventExplorer = () => {
  const { events, buyTicket, purchasedTickets } = useApp();
  const [activeFilter, setActiveFilter] = useState('Tüm Etkinlikler');
  const navigate = useNavigate();

  const filteredEvents = activeFilter === 'Tüm Etkinlikler' 
    ? events 
    : events.filter(e => e.category === activeFilter);

  return (
    <div className="space-y-6 text-slate-900 dark:text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Galaktik Etkinlikler</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">Koloni kümeleri genelindeki simülasyon, konser ve teknik oturumlar</p>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/5">
        {['Tüm Etkinlikler', 'Müzik', 'E-Spor', 'Akademik'].map(f => (
          <button 
            key={f} 
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${activeFilter === f ? 'bg-primary border-primary text-white shadow-lg' : 'bg-slate-200/50 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-300/50 dark:hover:bg-white/10'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((ev, i) => {
          const isBought = purchasedTickets.includes(ev.id);
          return (
            <GlassCard key={ev.id} delay={i * 0.05} className="p-0 overflow-hidden flex flex-col hover:scale-[1.02] transition-transform">
              <div className="h-44 relative cursor-pointer" onClick={() => navigate(`/events/${ev.id}`)}>
                <img src={ev.img} className="w-full h-full object-cover" alt={ev.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-[#070B18] to-transparent" />
                {isBought && (
                  <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 border border-green-500/50 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                    <CheckCircle2 size={12} /> Rezerve
                  </div>
                )}
              </div>
              
              <div className="p-5 flex-1 flex flex-col justify-between relative z-10 -mt-6">
                <div className="cursor-pointer" onClick={() => navigate(`/events/${ev.id}`)}>
                  <span className="inline-block px-2.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full border border-primary/20 mb-2">
                    {ev.date}
                  </span>
                  <h3 className="text-lg font-bold mb-1 truncate group-hover:text-primary transition-colors">{ev.title}</h3>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-white/50 text-xs mb-3">
                    <MapPin size={12} /> {ev.location}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 border-t border-slate-200 dark:border-white/5 pt-3">
                  <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
                    <Users size={14} /> 
                    {ev.attendees >= 1000000 ? (ev.attendees / 1000000).toFixed(1) + 'M' : (ev.attendees / 100).toFixed(0) + 'B'}
                  </div>
                  
                  {isBought ? (
                    <button disabled className="px-3 py-1.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold cursor-default">
                      Cüzdanda
                    </button>
                  ) : (
                    <button 
                      onClick={() => buyTicket(ev.id)}
                      className="px-3 py-1.5 bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-primary hover:border-primary hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      Bilet Ayırt
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};