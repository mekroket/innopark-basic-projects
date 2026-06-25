import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { Calendar, MapPin, Users, CheckCircle2, ChevronLeft } from 'lucide-react';

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { events, buyTicket, purchasedTickets } = useApp();

  const currentEvent = events.find(e => e.id === id);

  if (!currentEvent) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm mb-4">Etkinlik log kaydı bulunamadı.</p>
        <button onClick={() => navigate('/events')} className="text-xs bg-primary px-4 py-2 rounded-xl text-white">Listeye Dön</button>
      </div>
    );
  }

  const isBought = purchasedTickets.includes(currentEvent.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
        <ChevronLeft size={16} /> Geri Dön
      </button>

      <div className="w-full h-64 rounded-3xl overflow-hidden relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <img src={currentEvent.img} alt={currentEvent.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-full border border-primary/20 block w-fit mb-2">
            {currentEvent.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{currentEvent.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="md:col-span-2 space-y-4" hover={false}>
          <h3 className="text-lg font-bold border-b border-slate-200 dark:border-white/5 pb-2">Etkinlik Özeti ve Kapsamı</h3>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{currentEvent.description}</p>
          <div className="pt-2 text-xs text-slate-400 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
            💡 **Giriş Talimatı:** Satın alım sonrasında üretilen kuantum hash imzanız koloni turnikelerinde biyometrik kimliğinizle otomatik eşleşir. Ek bilet çıktısı gerekmez.
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="space-y-3.5" hover={false}>
            <div className="flex items-center gap-3 text-xs">
              <Calendar className="text-primary" size={16} />
              <div>
                <p className="text-slate-400 text-[10px]">Kuantum Tarihi</p>
                <p className="font-semibold">{currentEvent.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <MapPin className="text-primary" size={16} />
              <div>
                <p className="text-slate-400 text-[10px]">Konum / Sektör</p>
                <p className="font-semibold">{currentEvent.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Users className="text-secondary" size={16} />
              <div>
                <p className="text-slate-400 text-[10px]">Kayıtlı Kolonist</p>
                <p className="font-semibold">{currentEvent.attendees.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5">
              {isBought ? (
                <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center gap-2 text-xs font-bold">
                  <CheckCircle2 size={16} /> Biletiniz Onaylandı
                </div>
              ) : (
                <button 
                  onClick={() => buyTicket(currentEvent.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
                >
                  Kuantum Bilet Al
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};