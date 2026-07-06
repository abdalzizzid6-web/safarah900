import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, Trophy, Newspaper, Video, Activity, Zap, BarChart3, Loader2, DatabaseIcon, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { UserRole, Match } from '../types';
import { matchService } from '../services/matchService';
import * as matchRepository from '../features/match-details/repositories/matchRepository';
import { getLocalDateString } from '../utils/dateUtils';
import MatchCard from '../components/MatchCard';

import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemData, setSystemData] = useState<any>(null);

  // Historical matches state and calculations
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [historyMatches, setHistoryMatches] = useState<Match[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يونيو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const ARABIC_WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

  const PRESETS = [
    { name: 'اليوم', get: () => new Date() },
    { name: 'أمس', get: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; } },
    { name: 'قبل أسبوع', get: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; } },
    { name: 'قبل أسبوعين', get: () => { const d = new Date(); d.setDate(d.getDate() - 14); return d; } },
    { name: 'قبل شهر', get: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; } },
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysGrid: Array<{ dayNum: number; isCurrentMonth: boolean; dateObj: Date }> = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    daysGrid.push({
      dayNum: day,
      isCurrentMonth: false,
      dateObj: new Date(year, month - 1, day)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      dayNum: i,
      isCurrentMonth: true,
      dateObj: new Date(year, month, i)
    });
  }

  // Next month padding to compute standard 42-cell grid
  const remainingCells = 42 - daysGrid.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({
      dayNum: i,
      isCurrentMonth: false,
      dateObj: new Date(year, month + 1, i)
    });
  }

  useEffect(() => {
    if (activeTab !== 'history') return;

    const loadHistoryMatches = async () => {
      setIsHistoryLoading(true);
      const dateStr = getLocalDateString(selectedDate);
      try {
        const matches = await matchRepository.getMatches();
        
        const filtered = matches.reduce((acc: Match[], current) => {
          const matchDateStr = current.startTime ? getLocalDateString(current.startTime) : (current.utcDate ? getLocalDateString(current.utcDate) : '');
          if (matchDateStr !== dateStr) return acc;
          
          if (!acc.some(item => item.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        filtered.sort((a, b) => {
          const timeA = new Date(a.startTime || a.utcDate || 0).getTime();
          const timeB = new Date(b.startTime || b.utcDate || 0).getTime();
          return timeA - timeB;
        });

        setHistoryMatches(filtered);
      } catch (err) {
        console.error("Error loading historical matches:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadHistoryMatches();
  }, [selectedDate, activeTab]);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Background sync every 30s
    enabled: !!user && (role === UserRole.ADMIN || role === UserRole.EDITOR),
  });

  const { data: aggregateStats, isLoading: isAggLoading } = useQuery({
    queryKey: ['dashboardAggregate'],
    queryFn: dashboardService.getAggregateStats,
    refetchInterval: 60000, 
    enabled: !!user && (role === UserRole.ADMIN || role === UserRole.EDITOR),
  });

  const loading = isStatsLoading || isAggLoading || authLoading;

  useEffect(() => {
    // Connect to Socket.IO Enterprise
    const socket = io();
    socket.on('dashboard-stats-update', (data) => {
        setSystemData((prev: any) => ({ 
            ...prev, 
            cpuUsage: data.cpuUsage, 
            memoryUsage: data.memoryUsage,
            status: 'online'
        }));
    });

    return () => {
        socket.disconnect();
    };
  }, []);

  if (authLoading) return <div className="p-20 text-center text-white"><Loader2 className="animate-spin mx-auto" /></div>;

  if (!user || (role !== UserRole.ADMIN && role !== UserRole.EDITOR)) {
    return (
      <div className="p-20 text-center text-white">
        <h2 className="text-2xl font-black">Access Denied</h2>
        <p className="text-gray-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-white/10 rounded w-48"></div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-white/10 rounded-xl"></div>
            <div className="h-9 w-32 bg-white/10 rounded-xl"></div>
            <div className="h-9 w-24 bg-white/10 rounded-xl"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-6 bg-white/10 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="h-6 bg-white/10 rounded w-48"></div>
            <div className="h-64 bg-white/10 rounded-xl"></div>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="h-6 bg-white/10 rounded w-64"></div>
            <div className="space-y-4">
                <div className="h-6 bg-white/10 rounded w-full"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-6 bg-white/10 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return (
    <div className="p-20 text-center text-white flex flex-col items-center justify-center space-y-4">
      <DatabaseIcon size={48} className="text-gray-600 mb-4" />
      <h2 className="text-2xl font-black">No Data Available</h2>
      <p className="text-gray-400">The system has not collected any analytics or matches data yet. Ensure Firebase is populated.</p>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'matches', name: 'تحليل المباريات', icon: Trophy },
    { id: 'teams', name: 'تحليل الفرق', icon: Users },
    { id: 'history', name: 'البحث التاريخي', icon: Calendar },
  ];

  const statItems = [
    { name: 'إجمالي المشاهدات', value: stats.pageViews, icon: Trophy },
    { name: 'المباريات', value: stats.matchViews, icon: Activity },
    { name: 'المستخدمين', value: stats.userActivity, icon: Users },
    { name: 'البيانات', value: stats.apiLogs, icon: Newspaper }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-white">Dashboard Pro</h1>
        <div className="flex gap-2">
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <tab.icon size={16} />
                    {tab.name}
                </button>
            ))}
        </div>
      </div>
      
      {activeTab === 'overview' && (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map((stat) => (
                <div key={stat.name} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
                    <div className="p-3 bg-[#d4af37]/20 rounded-2xl text-[#d4af37]">
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-bold">{stat.name}</p>
                        <p className="text-white text-2xl font-black">{stat.value}</p>
                    </div>
                </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <h2 className="text-lg font-black text-white mb-4">Analytics Overview</h2>
                    <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(stats).map(([name, count]: any) => ({ name, count }))}>
                            <CartesianGrid stroke="#333" />
                            <XAxis dataKey="name" hide />
                            <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #d4af37'}} />
                            <Bar dataKey="count" fill="#d4af37" />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                    <h2 className="text-lg font-black text-white mb-4">System Monitoring & Data Sources</h2>
                    <div className="h-64 overflow-y-auto text-gray-400 font-bold space-y-4">
                        <div className='flex justify-between'><span>System Status:</span> <span className='text-green-500'>Online</span></div>
                        <div className='flex justify-between'><span>CPU Usage:</span> <span>{stats.systemLogs}%</span></div>
                        <hr className='border-white/10'/>
                        {['Football API', 'SportMonks', 'Firestore'].map(ds => (
                            <div key={ds} className='flex justify-between'><span>{ds}:</span> <span className='text-green-500'>Connected</span></div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
      
      {activeTab === 'overview' && systemData && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <h2 className="text-lg font-black text-white mb-4">System Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className='p-4 bg-white/5 rounded-xl'>
                    <p className='text-gray-400 font-bold'>CPU Usage</p>
                    <p className='text-2xl font-black text-white'>{systemData.cpuUsage}%</p>
                </div>
                <div className='p-4 bg-white/5 rounded-xl'>
                    <p className='text-gray-400 font-bold'>Memory Usage</p>
                    <p className='text-2xl font-black text-white'>{systemData.memoryUsage}%</p>
                </div>
                <div className='p-4 bg-white/5 rounded-xl'>
                    <p className='text-gray-400 font-bold'>Status</p>
                    <p className='text-2xl font-black text-green-500 capitalize'>{systemData.status}</p>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'matches' && aggregateStats && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <h2 className="text-lg font-black text-white mb-4">Teams Performance (Wins)</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aggregateStats.teams}>
                        <CartesianGrid stroke="#333" />
                        <XAxis dataKey="name" stroke="#777" />
                        <YAxis stroke="#777" />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #d4af37'}} />
                        <Bar dataKey="wins" fill="#d4af37" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {activeTab === 'teams' && aggregateStats && (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <h2 className="text-lg font-black text-white mb-4">Top Players (Goals)</h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aggregateStats.players}>
                        <CartesianGrid stroke="#333" />
                        <XAxis dataKey="name" stroke="#777" />
                        <YAxis stroke="#777" />
                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #d4af37'}} />
                        <Bar dataKey="goals" fill="#d4af37" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right font-sans" dir="rtl">
          {/* Calendar Selector Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar className="text-[#d4af37]" size={20} />
                  <span>تحديد تاريخ البحث</span>
                </h3>
                <span className="text-xs text-gray-400 bg-white/10 px-2.5 py-1 rounded-full font-bold">
                  {getLocalDateString(selectedDate)}
                </span>
              </div>

              {/* Monthly Navigation */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
                <span className="text-md font-black text-white">
                  {ARABIC_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Weekly Header Grid */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-500 pb-1">
                {ARABIC_WEEKDAYS.map((wd, idx) => (
                  <div key={idx} className="py-1">
                    {wd}
                  </div>
                ))}
              </div>

              {/* Calendar Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {daysGrid.map((cell, idx) => {
                  const isSelected = getLocalDateString(cell.dateObj) === getLocalDateString(selectedDate);
                  const isToday = getLocalDateString(cell.dateObj) === getLocalDateString(new Date());

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(cell.dateObj);
                        setViewDate(cell.dateObj);
                      }}
                      className={`
                        py-2 text-sm font-bold rounded-xl transition-all relative flex flex-col items-center justify-center aspect-square
                        ${!cell.isCurrentMonth ? 'text-gray-600 hover:bg-white/5 opacity-50' : 'text-gray-200 hover:bg-white/10'}
                        ${isSelected ? 'bg-[#d4af37] text-black hover:bg-[#d4af37] scale-105 font-black shadow-lg shadow-[#d4af37]/20 border border-[#d4af37]' : ''}
                        ${isToday && !isSelected ? 'border border-[#d4af37]/30 text-[#d4af37]' : ''}
                      `}
                    >
                      <span>{cell.dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>

              <hr className="border-white/10" />

              {/* Preset Shortcuts */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-bold">تخطي سريع للأيام:</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p, idx) => {
                    const presetDateStr = getLocalDateString(p.get());
                    const isActive = getLocalDateString(selectedDate) === presetDateStr;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const dateObj = p.get();
                          setSelectedDate(dateObj);
                          setViewDate(dateObj);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200'}`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Matches List Results Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">نتائج المباريات التاريخية</h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    المباريات التي أقيمت بتاريخ: {selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                {!isHistoryLoading && (
                  <span className="text-xs font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/25 px-3 py-1 rounded-full">
                    {historyMatches.length} مباراة
                  </span>
                )}
              </div>

              {isHistoryLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
                  <Loader2 className="animate-spin text-[#d4af37]" size={36} />
                  <p className="font-bold text-sm">جاري جلب نتائج مباريات الأرشيف...</p>
                </div>
              ) : historyMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historyMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-gray-500 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                    <Search size={28} />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="text-white font-black text-md">لا توجد مباريات مسجلة تاريخياً</h4>
                    <p className="text-xs text-gray-400 font-bold leading-relaxed">
                      لم نجد أي مباريات مسجلة في قاعدة البيانات أو الأرشيف بالتاريخ المختار. جرب اختيار تاريخ آخر مثل الأمس أو الأيام السابقة.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
