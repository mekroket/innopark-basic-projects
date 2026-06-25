import { GlassCard } from '../components/GlassCard';
import { useApp } from '../context/AppContext';
import { Volume2, Eye, ShieldAlert, Cpu, Trash2 } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings, clearAllData } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sistem Tercihleri</h1>
        <p className="text-sm text-slate-500 dark:text-white/50">AURA terminal ana kart senkronizasyon ayarları</p>
      </header>

      <div className="space-y-4">
        {/* TEMA SEÇİMİ */}
        <GlassCard className="flex items-center justify-between" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-primary">
              <Eye size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none mb-1">Arayüz HUD Modu</h3>
              <p className="text-slate-500 dark:text-white/50 text-xs">Foton emisyon spektrumu seçimi (Karanlık/Aydınlık)</p>
            </div>
          </div>
          <button 
            onClick={() => updateSettings('theme', settings.theme === 'dark' ? 'light' : 'dark')}
            className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold capitalize transition-colors"
          >
            {settings.theme === 'dark' ? 'Karanlık (Dark)' : 'Aydınlık (Light)'}
          </button>
        </GlassCard>

        {/* BİLDİRİM AYARLARI */}
        <GlassCard className="flex items-center justify-between" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-secondary">
              <Volume2 size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none mb-1">Akustik Sinyal Akışı</h3>
              <p className="text-slate-500 dark:text-white/50 text-xs">Kritik uyarıların anlık terminale yansıtılması</p>
            </div>
          </div>
          <div 
            onClick={() => updateSettings('notificationsEnabled', !settings.notificationsEnabled)}
            className={`w-11 h-6 rounded-full relative cursor-pointer border border-transparent transition-all ${settings.notificationsEnabled ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-slate-300 dark:bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${settings.notificationsEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </GlassCard>

        {/* ANIMASYON AYARLARI */}
        <GlassCard className="flex items-center justify-between" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-purple-400">
              <Cpu size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none mb-1">Kuantum Geçiş Efektleri</h3>
              <p className="text-slate-500 dark:text-white/50 text-xs">HUD panelleri arası mikro-animasyon kareleri</p>
            </div>
          </div>
          <div 
            onClick={() => updateSettings('animationsEnabled', !settings.animationsEnabled)}
            className={`w-11 h-6 rounded-full relative cursor-pointer border border-transparent transition-all ${settings.animationsEnabled ? 'bg-primary shadow-[0_0_10px_rgba(139,92,246,0.4)]' : 'bg-slate-300 dark:bg-white/10'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${settings.animationsEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </GlassCard>

        {/* VERİ SIFIRLAMA */}
        <GlassCard className="flex items-center justify-between border-red-500/15" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-none mb-1 text-red-400">Çekirdeği Fabrika Ayarlarına Döndür</h3>
              <p className="text-slate-500 dark:text-white/50 text-xs">Tüm local bellek matrisini ve biletleri kalıcı siler</p>
            </div>
          </div>
          <button 
            onClick={() => { if (confirm('Tüm kolonist verileriniz kalıcı olarak silinecek. Onaylıyor musunuz?')) clearAllData(); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-xs font-bold rounded-xl transition-all border border-red-500/20 shadow-sm"
          >
            <Trash2 size={14} /> Veriyi Kazı
          </button>
        </GlassCard>
      </div>
    </div>
  );
};