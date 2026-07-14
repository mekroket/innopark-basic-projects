import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Orbit } from 'lucide-react';
import { useApp } from '../context/AppContext';

const availableAvatars = [
  'https://i.pravatar.cc/150?u=a1',
  'https://i.pravatar.cc/150?u=a2',
  'https://i.pravatar.cc/150?u=a3',
  'https://i.pravatar.cc/150?u=a4',
];

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Yapay Zeka Operasyon Mühendisi');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(availableAvatars[0]);
  
  const { loginUser, showToast, settings } = useApp();
  const navigate = useNavigate();
  const anim = settings.animationsEnabled;

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !password.trim()) {
      showToast('Lütfen tüm kuantum alanları doldurun.', 'error');
      return;
    }

    if (isLogin) {
      const savedUsers = localStorage.getItem('aura_registered_users');
      const usersList = savedUsers ? JSON.parse(savedUsers) : [];
      const matched = usersList.find((u: any) => u.identity === identity && u.password === password);

      if (matched) {
        loginUser({ id: matched.identity, name: matched.name, title: matched.title, avatar: matched.avatar });
        navigate('/dashboard');
      } else {
        if (identity === 'M-8842' && password === '1234') {
          loginUser({ id: 'M-8842', name: 'Deniz Komutan', title: 'Yapay Zeka Operasyon Mühendisi', avatar: 'https://i.pravatar.cc/300?u=commander' });
          navigate('/dashboard');
        } else {
          showToast('Biyometrik eşleşme bulunamadı veya şifre geçersiz.', 'error');
        }
      }
    } else {
      if (!name.trim()) {
        showToast('Lütfen kolonist unvan adını girin.', 'error');
        return;
      }
      const savedUsers = localStorage.getItem('aura_registered_users');
      const usersList = savedUsers ? JSON.parse(savedUsers) : [];
      
      if (usersList.some((u: any) => u.identity === identity)) {
        showToast('Bu Gezegenler Arası Kimlik zaten sisteme kayıtlı.', 'error');
        return;
      }

      const newUserObj = { identity, password, name, title, avatar: selectedAvatar };
      usersList.push(newUserObj);
      localStorage.setItem('aura_registered_users', JSON.stringify(usersList));
      
      showToast('Sinirsel iz ağa kaydedildi. Giriş yapabilirsiniz.', 'success');
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B18] text-white flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        initial={anim ? { scale: 0.95, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/5 border border-white/10 p-8 rounded-3xl w-full max-w-md z-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
        
        <div className="flex justify-center mb-6">
          <Orbit className="text-primary animate-spin-slow" size={44} />
        </div>
        
        <h2 className="text-3xl font-bold text-center mb-1 tracking-tight">
          {isLogin ? 'Kimlik Doğrulama' : 'Yeni Kolonist Kaydı'}
        </h2>
        <p className="text-center text-white/50 text-sm mb-6">
          {isLogin ? 'AURA erişimi için biyometrik verilerinizi doğrulayın' : 'Sinirsel izinizi galaktik ağa kaydedin'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Unvan / İsim" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Görev/Branş Unvanı" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <div className="space-y-2">
                <label className="text-xs text-white/50 block">Avatar Hologramı Seçin:</label>
                <div className="flex gap-3 justify-center">
                  {availableAvatars.map((av, index) => (
                    <img
                      key={index}
                      src={av}
                      alt="Avatar Option"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-12 h-12 rounded-xl cursor-pointer border-2 transition-all ${selectedAvatar === av ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
          <input 
            type="text" 
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Gezegenler Arası Kimlik (Örn. M-8842)" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors text-sm"
          />
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kuantum Şifre" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors text-sm"
          />
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-4 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            <Fingerprint size={18} />
            {isLogin ? 'Senkronizasyonu Başlat' : 'İmzayı Kaydet'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setName('');
              setIdentity('');
              setPassword('');
            }}
            className="text-white/50 hover:text-white transition-colors text-xs"
          >
            {isLogin ? 'İmza bulunamadı mı? Buradan kaydolun.' : 'Zaten kaydınız var mı? Giriş yapın.'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};