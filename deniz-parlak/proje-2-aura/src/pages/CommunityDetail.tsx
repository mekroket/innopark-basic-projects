import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Users2, Shield, Radio, Activity } from 'lucide-react';

export const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { communities, toggleCommunity, posts } = useApp();

  const currentCom = communities.find(c => c.id === id);

  if (!currentCom) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm">Topluluk sinyal bandı algılanamadı.</p>
        <button onClick={() => navigate('/community')} className="text-xs bg-primary px-4 py-2 rounded-xl text-white mt-4">Geri Dön</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
        <ChevronLeft size={16} /> Lonca Ağlarına Dön
      </button>

      <div className={`p-8 rounded-3xl bg-gradient-to-br ${currentCom.color} border border-slate-200 dark:border-white/10 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Radio size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase border border-primary/20 mb-2 inline-block">
              {currentCom.type} Loncası
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{currentCom.name}</h1>
            <p className="text-xs text-slate-600 dark:text-white/70 mt-2 max-w-xl leading-relaxed">{currentCom.description}</p>
          </div>
          <button 
            onClick={() => toggleCommunity(currentCom.id)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shrink-0 border transition-all ${currentCom.isJoined ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-primary border-primary text-white shadow-lg hover:opacity-90'}`}
          >
            {currentCom.isJoined ? 'Kanaldan Ayrıl' : 'Frekansa Bağlan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-sm tracking-wide text-slate-400 uppercase">Topluluk İçi Yayın Akışı</h3>
          {posts.length === 0 ? (
            <p className="text-xs text-slate-400">Bu topluluk kanalında henüz arşiv kaydı bulunmuyor.</p>
          ) : (
            posts.slice(0, 3).map((p, i) => (
              <GlassCard key={i} hover={false} className="p-4">
                <div className="flex gap-2.5 items-center mb-2 text-xs">
                  <img src={p.avatar} className="w-6 h-6 rounded-full object-cover" alt="User" />
                  <span className="font-semibold">{p.user}</span>
                  <span className="text-slate-400 text-[10px] ml-auto">{p.time}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-white/80 leading-relaxed">{p.content}</p>
              </GlassCard>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm tracking-wide text-slate-400 uppercase">Ağ Parametreleri</h3>
          <GlassCard className="space-y-3 text-xs" hover={false}>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-400 flex items-center gap-1"><Users2 size={14}/> Toplam Üye</span>
              <span className="font-semibold">{currentCom.members.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-400 flex items-center gap-1"><Shield size={14}/> Güvenlik Seviyesi</span>
              <span className="font-semibold text-green-400">Kuantum Korumalı</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 flex items-center gap-1"><Activity size={14}/> Veri Akış Hızı</span>
              <span className="font-semibold text-primary">94.2 Gb/sn</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};