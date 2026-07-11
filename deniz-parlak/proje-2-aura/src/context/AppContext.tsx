import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Task, Post, EventItem, CommunityHubItem, NotificationItem, AppSettings } from '../types/app';

interface AppContextType {
  user: UserProfile | null;
  tasks: Task[];
  posts: Post[];
  events: EventItem[];
  communities: CommunityHubItem[];
  notifications: NotificationItem[];
  settings: AppSettings;
  toasts: { id: string; text: string; type: 'success' | 'error' | 'info' }[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  loginUser: (profile: UserProfile) => void;
  logoutUser: () => void;
  updateProfile: (name: string, title: string, avatar: string) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addPost: (content: string) => void;
  deletePost: (id: string) => void;
  updatePost: (id: string, content: string) => void;
  toggleLikePost: (id: string) => void;
  addComment: (postId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  buyTicket: (eventId: string) => void;
  purchasedTickets: string[];
  toggleCommunity: (id: string) => void;
  markNotificationsAsRead: () => void;
  updateSettings: (key: keyof AppSettings, value: any) => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialEvents: EventItem[] = [
  { id: 'ev-1', title: "Satürn Halkaları VR Konseri", date: "2165-08-14", location: "Global Holo-Ağ", attendees: 1200000, img: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?q=80&w=800", category: "Müzik", description: "Satürn halkalarının eşsiz kütleçekim tınılarından esinlenilerek hazırlanan, güneş sisteminin en büyük kuantum sanal gerçeklik senfonisi." },
  { id: 'ev-2', title: "Kızıl Gezegen E-Spor Finalleri", date: "2165-08-18", location: "Olympus Arenası", attendees: 45000, img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800", category: "E-Spor", description: "Mars yerel yerleşim birimleri arası düzenlenen, yerçekimsiz koordinasyon refleks liginin büyük holo-finalleri." },
  { id: 'ev-3', title: "Yapay Zeka Operatörleri Zirvesi", date: "2165-09-02", location: "Dünya Merkezi / Sanal", attendees: 8500, img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800", category: "Akademik", description: "Gezegenler arası veri senkronizasyonu ve derin kuantum LLM mimarilerinin optimizasyon panellerini içeren akademik kongre." }
];

const initialCommunities: CommunityHubItem[] = [
  { id: 'com-1', name: 'Mars Teknoloji Tutkunları', members: 12400, type: 'Tartışma', color: 'from-orange-500/20 to-red-500/20', description: 'Kızıl gezegendeki terraforming algoritmaları ve kubbe otomasyon sistemleri üzerine teknik araştırma topluluğu.', isJoined: false },
  { id: 'com-2', name: 'Titan Madencileri Loncası', members: 8100, type: 'Meslek', color: 'from-cyan-500/20 to-blue-500/20', description: 'Satürn uydusu Titan üzerindeki hidrokarbon kaynaklarının çıkarma teknikleri ve ağır iş otonom robotik operatörleri.', isJoined: false },
  { id: 'com-3', name: 'Dünya Nostaljisi VR', members: 45000, type: 'Eğlence', color: 'from-green-500/20 to-emerald-500/20', description: 'Eski Dünya metropollerinin, yeşil ekosistemlerinin ve siber-punk öncesi kültürün holo-arşiv simülasyon odası.', isJoined: false },
  { id: 'com-4', name: 'Yapay Zeka Sözdizimi Geliştiricileri', members: 3200, type: 'Kodlama', color: 'from-purple-500/20 to-pink-500/20', description: 'Kuantum yapay zeka çekirdeklerine doğrudan semantik enjeksiyon yapan üst düzey operatörlerin ortak kütüphanesi.', isJoined: false }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const data = localStorage.getItem('aura_user');
    return data ? JSON.parse(data) : null;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const data = localStorage.getItem('aura_tasks');
    return data ? JSON.parse(data) : [
      { id: 't-1', text: "Yerel oksijen filtrelerini kalibre et", completed: false },
      { id: 't-2', text: "Europa terraform belgelerini incele", completed: false }
    ];
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const data = localStorage.getItem('aura_posts');
    return data ? JSON.parse(data) : [
      { id: 'p-1', user: 'Jax Vane', avatar: 'https://i.pravatar.cc/150?u=jax', location: 'Europa Buzaltı Üssü', content: 'Yeni sentetik mercan resifi kurulumunu bitirdim. Buradaki biyolüminesans gerçek dışı.', likes: 342, comments: [], time: '2 saat önce', isLiked: false }
    ];
  });

  const [events] = useState<EventItem[]>(initialEvents);
  
  const [communities, setCommunities] = useState<CommunityHubItem[]>(() => {
    const data = localStorage.getItem('aura_communities');
    return data ? JSON.parse(data) : initialCommunities;
  });

  const [purchasedTickets, setPurchasedTickets] = useState<string[]>(() => {
    const data = localStorage.getItem('aura_tickets');
    return data ? JSON.parse(data) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const data = localStorage.getItem('aura_notifications');
    return data ? JSON.parse(data) : [
      { id: 'n-1', text: 'Kuantum sunucu senkronizasyonu tamamlandı.', time: '10 dk önce', unread: true },
      { id: 'n-2', text: 'Yeni galaktik etkinlikler listelendi.', time: '1 saat önce', unread: true }
    ];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const data = localStorage.getItem('aura_settings');
    return data ? JSON.parse(data) : { theme: 'dark', notificationsEnabled: true, animationsEnabled: true };
  });

  const [toasts, setToasts] = useState<{ id: string; text: string; type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => { localStorage.setItem('aura_user', user ? JSON.stringify(user) : ''); }, [user]);
  useEffect(() => { localStorage.setItem('aura_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('aura_posts', JSON.stringify(posts)); }, [posts]);
  useEffect(() => { localStorage.setItem('aura_communities', JSON.stringify(communities)); }, [communities]);
  useEffect(() => { localStorage.setItem('aura_tickets', JSON.stringify(purchasedTickets)); }, [purchasedTickets]);
  useEffect(() => { localStorage.setItem('aura_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('aura_settings', JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc';
      root.style.color = '#0f172a';
    } else {
      root.classList.add('dark');
      root.style.backgroundColor = '';
      root.style.color = '';
    }
  }, [settings.theme]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, text, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loginUser = (profile: UserProfile) => {
    setUser(profile);
    showToast('Biyometrik doğrulama başarılı. Terminale bağlanıldı.', 'success');
  };

  const logoutUser = () => {
    setUser(null);
    showToast('Terminal bağlantısı kesildi.', 'info');
  };

  const updateProfile = (name: string, title: string, avatar: string) => {
    if (user) {
      setUser({ ...user, name, title, avatar });
      showToast('Sinirsel kimlik matrisi güncellendi.', 'success');
    }
  };

  const addTask = (text: string) => {
    const newTask: Task = { id: Date.now().toString(), text, completed: false };
    setTasks(prev => [...prev, newTask]);
    showToast('Görev kuantum defterine işlendi.', 'success');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Görev bellekten silindi.', 'info');
  };

  const addPost = (content: string) => {
    if (!user) return;
    const newPost: Post = {
      id: Date.now().toString(),
      user: user.name,
      avatar: user.avatar,
      location: 'Sektör 4, Mars Kolonisi',
      content,
      likes: 0,
      comments: [],
      time: 'Şimdi',
      isLiked: false
    };
    setPosts(prev => [newPost, ...prev]);
    showToast('Yayın galaktik ağa iletildi.', 'success');
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    showToast('Yayın kuantum ağından çekildi.', 'info');
  };

  const updatePost = (id: string, content: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, content, time: 'Düzenlendi • Şimdi' } : p));
    showToast('Yayın sinirsel kaydı güncellendi.', 'success');
  };

  const toggleLikePost = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          isLiked: !p.isLiked
        };
      }
      return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    if (!user) return;
    const newComment = {
      id: Date.now().toString(),
      user: user.name,
      avatar: user.avatar,
      text,
      time: 'Şimdi'
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const deleteComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p));
    showToast('Yorum silindi.', 'info');
  };

  const buyTicket = (eventId: string) => {
    if (purchasedTickets.includes(eventId)) {
      showToast('Bu etkinlik için zaten bir kuantum biletiniz mevcut.', 'error');
      return;
    }
    setPurchasedTickets(prev => [...prev, eventId]);
    showToast('Bilet kriptografik olarak cüzdanınıza işlendi.', 'success');
    
    const targetEvent = events.find(e => e.id === eventId);
    if (targetEvent) {
      setNotifications(prev => [{
        id: Date.now().toString(),
        text: `${targetEvent.title} biletiniz onaylandı. Giriş kodu ayrıldı.`,
        time: 'Şimdi',
        unread: true
      }, ...prev]);
    }
  };

  const toggleCommunity = (id: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.isJoined;
        showToast(nextState ? `${c.name} frekansına bağlanıldı.` : `${c.name} veri akışı kesildi.`, 'info');
        return {
          ...c,
          isJoined: nextState,
          members: nextState ? c.members + 1 : c.members - 1
        };
      }
      return c;
    }));
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const updateSettings = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const clearAllData = () => {
    localStorage.clear();
    setUser(null);
    setTasks([]);
    setPosts([]);
    setCommunities(initialCommunities);
    setPurchasedTickets([]);
    setNotifications([]);
    setSettings({ theme: 'dark', notificationsEnabled: true, animationsEnabled: true });
    window.location.href = '/';
  };

  return (
    <AppContext.Provider value={{
      user, tasks, posts, events, communities, notifications, settings, toasts,
      showToast, removeToast, loginUser, logoutUser, updateProfile, addTask, toggleTask, deleteTask,
      addPost, deletePost, updatePost, toggleLikePost, addComment, deleteComment, buyTicket, purchasedTickets,
      toggleCommunity, markNotificationsAsRead, updateSettings, clearAllData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp AppProvider sarmalı dışında çağrılamaz.');
  return context;
};