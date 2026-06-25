import { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Send, Cpu, ActivitySquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
// Gemini servisimizi projemize dahil ediyoruz
import { askAura } from '../services/gemini';

export const AICompanion = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [msgs, setMsgs] = useState<{role: string, text: string}[]>([
    { role: 'ai', text: 'Sistem çevrimiçi. Ben AuraMind. Galaktik ağ üzerindeki kişisel Kuantum Yoldaşınım. Gemini Kuantum Çekirdeği aktif. Sana nasıl yardımcı olabilirim?' }
  ]);

  // Yeni mesaj geldiğinde otomatik en alta kaydırma
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  // Gerçek AI yanıt sistemi (Artık fallback yok, tamamen askAura() kullanılıyor)
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 1. Yazdığın mesajı doğrudan gemini.ts dosyasındaki askAura fonksiyonuna gönderiyoruz
      const responseText = await askAura(userMsg);
      
      // 2. Gemini'den gelen gerçek cevabı ekrana basıyoruz
      setMsgs(prev => [...prev, { role: 'ai', text: responseText }]);
    } catch (error) {
      console.error("Gemini API Hatası:", error);
      setMsgs(prev => [...prev, { 
        role: 'ai', 
        text: 'Sistem Hatası: Kuantum bağlantısı koptu. Lütfen konsoldaki hatayı inceleyin ve .env dosyanızdaki VITE_GEMINI_API_KEY anahtarını kontrol edin.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-4xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gradient">
            <Cpu className="text-primary" /> AuraMind
          </h1>
          {/* Başlığın değiştiğini buradan görebilirsin */}
          <p className="text-white/50">Kişisel Kuantum Yoldaşı (Gemini AI Destekli)</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <ActivitySquare size={14} /> Kuantum Ağı Aktif
          </div>
        </div>
      </header>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden" hover={false}>
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth">
          <div className="flex justify-center mb-8">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: isLoading ? ['0 0 40px #00F0FF66', '0 0 80px #00F0FF88', '0 0 40px #00F0FF66'] : ['0 0 20px #8B5CF633', '0 0 40px #8B5CF666', '0 0 20px #8B5CF633']
              }}
              transition={{ repeat: Infinity, duration: isLoading ? 1.5 : 4, ease: "easeInOut" }}
              className={`w-32 h-32 rounded-full border flex items-center justify-center backdrop-blur-xl ${isLoading ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-primary/30 bg-primary/5'}`}
            >
              <div className={`w-16 h-16 rounded-full blur-md animate-pulse ${isLoading ? 'bg-gradient-to-tr from-cyan-400 to-blue-500' : 'bg-gradient-to-tr from-primary to-secondary'}`} />
            </motion.div>
          </div>

          {msgs.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-gradient-to-r from-primary/80 to-secondary/80 text-white rounded-br-sm' 
                  : 'bg-white/10 border border-white/5 text-white/90 rounded-bl-sm shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/5 text-white/50 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-primary" />
                AuraMind hiper-uzay verilerini sentezliyor...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40 z-10 relative">
          <div className="flex items-center gap-4 bg-white/5 rounded-xl p-2 border border-white/10 focus-within:border-primary/50 transition-colors">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder={isLoading ? "Lütfen bekleyin..." : "AuraMind'a bir şeyler yaz..."} 
              className="flex-1 bg-transparent border-none outline-none text-white px-4 disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};