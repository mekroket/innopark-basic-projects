import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, Shield, Zap, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Landing = () => {
  const { settings } = useApp();
  const anim = settings.animationsEnabled;
  const [modalData, setModalData] = useState<{ title: string; detail: string } | null>(null);

  return (
    <div className="min-h-screen bg-[#070B18] text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1600')] bg-cover bg-center opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] opacity-30 animate-pulse" />

      <nav className="relative z-10 flex justify-between items-center p-8 lg:px-24">
        <img src="/Logo.png" alt="AURA Logo" className="h-10 object-contain drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]" />
        <Link to="/auth">
          <button className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all font-medium">
            Terminale Bağlan
          </button>
        </Link>
      </nav>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={anim ? { opacity: 0, y: 30 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium tracking-wide">
            EST. 2165 • GEZEGENLER ARASI AĞ
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Evrenin Ötesiyle <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Bağlantı Kur</span>
          </h1>
          <p className="text-lg lg:text-xl text-white/60 mb-12 max-w-2xl mx-auto">
            Dünya, Mars, Titan ve Europa arasında sıfır gecikmeli sosyal köprüyü deneyimleyin. AuraMind yapay zekası ile güçlendirildi.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-secondary font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                Bağlantıyı Başlat
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={anim ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full px-4"
        >
          {[
            { icon: Zap, title: "Sıfır Gecikme", desc: "Öngörücü YSA modelleri, ışık hızı gecikmelerine rağmen gerçek zamanlı sohbet simülasyonu sunar.", detail: "Gezegenler arası mesafe kaynaklı ışık hızı gecikmesi kuantum durum kestirim algoritmalarıyla tamamen sönümlendirilir. Kullanıcı akış kesintisi yaşamaz." },
            { icon: Rocket, title: "Gezegen Merkezleri", desc: "Olympus Dağı'ndan Kraken Denizi'ne kadar sürükleyici yerel merkezlere katılın.", detail: "Her koloni kümesi kendi yerel alt ağ sunucularına sahiptir. Bu sunucular yerel etkinlikleri, takvimleri ve madencilik/otomasyon loncalarını koordine eder." },
            { icon: Shield, title: "Kuantum Güvenlik", desc: "Gezegenler arası verileriniz için uçtan uca kuantum şifreleme.", detail: "Veri paketleri dolaşık foton matrisleri kullanılarak şifrelenir. Araya girme veya sinirsel veriyi manipüle etme girişimleri kuantum çökmesiyle anında engellenir." }
          ].map((feature, i) => (
            <div 
              key={i} 
              onClick={() => setModalData({ title: feature.title, detail: feature.detail })}
              className="bg-white/5 p-6 rounded-2xl text-left border border-white/5 hover:border-primary/50 transition-all cursor-pointer backdrop-blur-md hover:scale-[1.02]"
            >
              <feature.icon className="text-secondary mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <AnimatePresence>
        {modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full relative"
            >
              <button onClick={() => setModalData(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{modalData.title}</h3>
              <p className="text-white/70 leading-relaxed text-sm">{modalData.detail}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};