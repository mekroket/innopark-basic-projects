import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Globe2, BrainCircuit, Calendar, Users, User, Settings, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Kontrol Paneli', path: '/dashboard' },
  { icon: Globe2, label: 'Sosyal Akış', path: '/feed' },
  { icon: BrainCircuit, label: 'AuraMind', path: '/ai' },
  { icon: Calendar, label: 'Etkinlikler', path: '/events' },
  { icon: Users, label: 'Topluluk', path: '/community' },
  { icon: User, label: 'Profil', path: '/profile' },
  { icon: Settings, label: 'Ayarlar', path: '/settings' },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { logoutUser, settings } = useApp();
  const anim = settings.animationsEnabled;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background dark:bg-[#070B18] text-slate-900 dark:text-white relative font-sans transition-colors duration-300">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.aside 
        initial={anim ? { x: -100, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        className="w-20 lg:w-64 bg-white/5 border-r border-slate-200 dark:border-white/5 flex flex-col justify-between py-8 z-10 backdrop-blur-xl"
      >
        <div>
          <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-12">
            <img src="/Logo.png" alt="AURA Logo" className="h-8 lg:h-10 object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
          </div>

          <nav className="flex flex-col gap-2 px-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link key={item.path} to={item.path} className="relative">
                  <div className={`flex items-center p-3 lg:px-4 rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <item.icon size={22} className={isActive ? 'text-primary' : ''} />
                    <span className="hidden lg:block ml-4 font-medium">{item.label}</span>
                    {isActive && anim && (
                      <motion.div layoutId="activeNav" className="absolute left-0 top-2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4">
          <button onClick={logoutUser} className="w-full flex items-center p-3 lg:px-4 rounded-xl text-slate-500 dark:text-white/50 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer">
            <LogOut size={22} />
            <span className="hidden lg:block ml-4 font-medium">Bağlantıyı Kes</span>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 h-full overflow-y-auto z-10 relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
};