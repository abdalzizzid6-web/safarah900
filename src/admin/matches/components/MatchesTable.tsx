import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckSquare2, Square, RefreshCw, CheckCircle2, Star, EyeOff, Eye, Archive, Edit, Trash2, Calendar, Trophy, RotateCcw, Copy, History, Save, X, Activity } from 'lucide-react';
import LiveMatchControls from '../../shared/MatchesCms/LiveMatchControls';

export default function MatchesTable({
  loading,
  filteredMatches,
  selectedIds,
  handleSelectAllVisible,
  handleToggleSelectMatch,
  formatDateString,
  actionLoading,
  handleToggleApproved,
  handleToggleFeatured,
  handleToggleHidden,
  handleToggleArchived,
  handleStartEditMatch,
  handleDeleteMatch,
  handleRestoreMatch,
  handleDuplicateMatch,
  handleShowHistory,
  handleQuickSave,
  viewMode = 'table'
}: any) {
  const [quickEditId, setQuickEditId] = React.useState<string | null>(null);
  const [quickEditData, setQuickEditData] = React.useState<any>({});
  const [controlMatchId, setControlMatchId] = React.useState<string | null>(null);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-gray-500 animate-pulse">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (filteredMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
        <div className="p-4 bg-white/5 rounded-full">
          <AlertCircle size={44} className="text-gray-600" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white">لم يتم العثور على أي مباراة</h4>
          <p className="text-[10px] text-gray-500 mt-1">حاول تغيير معايير التصفية أو البحث عن كلمة أخرى</p>
        </div>
      </div>
    );
  }

  const isGrid = viewMode === 'cards';

  return (
    <div className="space-y-4">
      {controlMatchId && <LiveMatchControls match={filteredMatches.find((m: any) => m.id === controlMatchId)} onClose={() => setControlMatchId(null)} />}
      
      {/* Table Header (Desktop Only, only in table mode) */}
      {!isGrid && (
        <div className="hidden md:flex items-center justify-between px-6 py-3 border-b border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-widest select-none">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => handleSelectAllVisible(filteredMatches)} 
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              {filteredMatches.every((m: any) => selectedIds.includes(m.id)) ? 
                <CheckSquare2 size={16} className="text-amber-500 fill-amber-500/10" /> : 
                <Square size={16} />
              }
            </button>
            <span>الحدث الرياضي والبطولة</span>
          </div>
          <div className="flex items-center gap-12 w-96 justify-end">
            <div className="w-24 text-center">المصدر والحالة</div>
            <div className="w-32 text-center">التوقيت</div>
            <div className="w-24 text-center">الإجراءات</div>
          </div>
        </div>
      )}

      <div className={cn(
        isGrid 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "space-y-3"
      )}>
        {filteredMatches.map((m: any) => {
          const matchId = m.id; console.log('MATCH DATA:', m.homeTeam, m.awayTeam);
          const isSelected = selectedIds.includes(matchId);
          const sourceColor = m.source === 'manual' ? 'text-blue-400 bg-blue-500/10' : (m.source === 'world-cup' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10');
          
          const homeName = typeof m.homeTeam === 'object' ? m.homeTeam?.name : (m.homeTeam || '');
          const awayName = typeof m.awayTeam === 'object' ? m.awayTeam?.name : (m.awayTeam || '');
          const leagueName = typeof m.league === 'object' ? m.league?.name : (m.league || '');
          
          if (isGrid) {
            return (
              <div 
                key={matchId} 
                className={cn(
                  "group relative bg-[#151516] border border-white/5 rounded-3xl p-5 transition-all duration-300 flex flex-col",
                  isSelected ? "border-amber-500/30 bg-amber-500/[0.03] shadow-xl shadow-black/40" : "hover:border-white/10 hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => handleToggleSelectMatch(matchId)} 
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                  >
                    {isSelected ? <CheckSquare2 size={18} className="text-amber-500" /> : <Square size={18} />}
                  </button>
                  <div className="flex gap-1.5">
                    <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md", sourceColor)}>
                      {m.source || 'api'}
                    </span>
                    {m.approved && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-black">معتمد</span>}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="flex items-center gap-4 w-full justify-center">
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl p-2.5 flex items-center justify-center border border-white/5">
                        <img 
                          src={m.homeLogo || (typeof m.homeTeam === 'object' ? m.homeTeam?.logo : '') || ''} 
                          className="w-full h-full object-contain" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e: any) => { e.currentTarget.src = ''; }} 
                        />
                      </div>
                      <span className="text-[11px] font-black text-white text-center line-clamp-1">{homeName}</span>
                    </div>
                    
                    <span className="text-xs text-gray-700 font-black italic">VS</span>
                    
                    <div className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl p-2.5 flex items-center justify-center border border-white/5">
                        <img 
                          src={m.awayLogo || (typeof m.awayTeam === 'object' ? m.awayTeam?.logo : '') || ''} 
                          className="w-full h-full object-contain" 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e: any) => { e.currentTarget.src = ''; }} 
                        />
                      </div>
                      <span className="text-[11px] font-black text-white text-center line-clamp-1">{awayName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-amber-500/80">
                      <Trophy size={12} />
                      <span className="text-[10px] font-bold truncate">{leagueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold">{formatDateString(m.startTime || m.utcDate)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5 mt-1">
                      <span className="text-[11px] font-black text-white">{m.score?.home ?? 0}</span>
                      <span className="text-[8px] text-gray-700 font-bold"> - </span>
                      <span className="text-[11px] font-black text-white">{m.score?.away ?? 0}</span>
                      <div className="w-px h-3 bg-white/5 mx-2" />
                      <span className="text-[9px] font-black text-gray-500">{m.status || 'NS'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 w-full justify-between pt-1">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggleApproved(matchId)} disabled={actionLoading === matchId} className={cn("p-2 rounded-xl border", m.approved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-gray-500 border-white/10")}>
                        <CheckCircle2 size={13} />
                      </button>
                      <button onClick={() => handleToggleFeatured(matchId)} disabled={actionLoading === matchId} className={cn("p-2 rounded-xl border", m.isFeatured ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/5 text-gray-500 border-white/10")}>
                        <Star size={13} className={m.isFeatured ? "fill-amber-400" : ""} />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {m.isDeleted ? (
                        <button onClick={() => handleRestoreMatch(matchId)} disabled={actionLoading === matchId} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl" title="استعادة">
                          <RotateCcw size={13} />
                        </button>
                      ) : (
                        <>
                          <button onClick={() => handleDuplicateMatch(matchId)} disabled={actionLoading === matchId} className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl" title="تكرار">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => handleStartEditMatch(m)} className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl" title="تعديل">
                            <Edit size={13} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteMatch(matchId)} className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl" title={m.isDeleted ? "حذف نهائي" : "نقل لسلة المهملات"}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={matchId} 
              className={cn(
                "group relative bg-[#151516] border border-white/5 rounded-2xl p-4 transition-all duration-300",
                isSelected ? "border-amber-500/30 bg-amber-500/[0.03] shadow-lg shadow-black/20" : "hover:border-white/10 hover:bg-white/[0.02]"
              )}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Main Info Section */}
                <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 pt-1 md:pt-0">
                    <button 
                      onClick={() => handleToggleSelectMatch(matchId)} 
                      className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"
                    >
                      {isSelected ? <CheckSquare2 size={18} className="text-amber-500 fill-amber-500/10" /> : <Square size={18} />}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Teams Display */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/5 rounded-full p-1.5 flex items-center justify-center border border-white/5">
                          <img 
                            src={m.homeLogo || (typeof m.homeTeam === 'object' ? m.homeTeam?.logo : '') || ''} 
                            className="w-full h-full object-contain" 
                            alt="" 
                            referrerPolicy="no-referrer"
                            onError={(e: any) => { e.currentTarget.src = ''; }} 
                          />
                        </div>
                        <span className="text-sm font-black text-white truncate max-w-[140px] tracking-tight">{homeName}</span>
                      </div>
                      
                      {quickEditId === matchId ? (
                        <div className="flex items-center gap-2 bg-black/40 p-1 px-2 rounded-xl border border-white/10">
                          <input 
                            type="number" 
                            className="w-8 bg-white/5 text-center text-xs font-black text-white rounded border border-white/10 outline-none"
                            value={quickEditData.homeScore ?? (m.score?.home || 0)}
                            onChange={e => setQuickEditData({...quickEditData, homeScore: parseInt(e.target.value)})}
                          />
                          <span className="text-xs text-gray-700">-</span>
                          <input 
                            type="number" 
                            className="w-8 bg-white/5 text-center text-xs font-black text-white rounded border border-white/10 outline-none"
                            value={quickEditData.awayScore ?? (m.score?.away || 0)}
                            onChange={e => setQuickEditData({...quickEditData, awayScore: parseInt(e.target.value)})}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                          <span className="text-xs font-black text-amber-500">{m.score?.home ?? 0}</span>
                          <span className="text-[10px] text-gray-700">-</span>
                          <span className="text-xs font-black text-amber-500">{m.score?.away ?? 0}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/5 rounded-full p-1.5 flex items-center justify-center border border-white/5">
                          <img 
                            src={m.awayLogo || (typeof m.awayTeam === 'object' ? m.awayTeam?.logo : '') || ''} 
                            className="w-full h-full object-contain" 
                            alt="" 
                            referrerPolicy="no-referrer"
                            onError={(e: any) => { e.currentTarget.src = ''; }} 
                          />
                        </div>
                        <span className="text-sm font-black text-white truncate max-w-[140px] tracking-tight">{awayName}</span>
                      </div>
                    </div>

                    {/* Metadata (Mobile & Desktop) */}
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      <div className="flex items-center gap-1.5 text-amber-500/80">
                        <Trophy size={10} />
                        <span className="text-[10px] font-bold truncate max-w-[180px]">{leagueName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar size={10} />
                        <span className="text-[10px] font-bold">{formatDateString(m.startTime || m.utcDate)}</span>
                      </div>
                      {quickEditId === matchId ? (
                        <select 
                          className="bg-black/40 text-[9px] font-black text-blue-400 border border-blue-500/20 rounded px-2 py-0.5 outline-none"
                          value={quickEditData.status ?? m.status}
                          onChange={e => setQuickEditData({...quickEditData, status: e.target.value})}
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Live">Live</option>
                          <option value="Half Time">Half Time</option>
                          <option value="Second Half">Second Half</option>
                          <option value="Extra Time">Extra Time</option>
                          <option value="Penalties">Penalties</option>
                          <option value="Finished">Finished</option>
                          <option value="Postponed">Postponed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Abandoned">Abandoned</option>
                        </select>
                      ) : (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded uppercase font-black">{m.status || 'NS'}</span>
                      )}
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", sourceColor)}>
                        {m.source || 'api'}
                      </span>
                      <span className="text-[9px] text-gray-600 font-mono font-bold">
                        #{m.id.toString().slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Actions Section */}
                <div className="flex flex-row-reverse md:flex-row items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 border-t md:border-0 border-white/5 pt-4 md:pt-0">
                  {/* Status Indicator (Mobile view helper) */}
                  <div className="flex items-center gap-2 md:hidden">
                     {m.approved ? 
                       <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black">معتمد</span> : 
                       <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-black">قيد الانتظار</span>
                     }
                  </div>

                  {/* Desktop Only Status */}
                  <div className="hidden md:flex flex-col items-center gap-1 w-24">
                    {m.approved ? 
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black"><CheckCircle2 size={12} /> معتمد</span> : 
                      <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-black"><RefreshCw size={12} className="animate-spin-slow" /> انتظار</span>
                    }
                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{m.syncStatus || 'synced'}</span>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex items-center gap-1.5">
                    {m.isDeleted ? (
                      <button 
                        onClick={() => handleRestoreMatch(matchId)} 
                        disabled={actionLoading === matchId}
                        className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all"
                        title="استعادة المباراة"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleToggleApproved(matchId)} 
                          disabled={actionLoading === matchId} 
                          title={m.approved ? "إلغاء الاعتماد" : "اعتماد المباراة"}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-50",
                            m.approved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          {actionLoading === matchId ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        </button>
                        
                        <button 
                          onClick={() => handleToggleFeatured(matchId)} 
                          disabled={actionLoading === matchId}
                          title="تمييز في الواجهة"
                          className={cn(
                            "p-2.5 rounded-xl border transition-all active:scale-95 disabled:opacity-50",
                            m.isFeatured ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          <Star size={14} className={m.isFeatured ? "fill-amber-400" : ""} />
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

                        <button 
                          onClick={() => handleDuplicateMatch(matchId)} 
                          disabled={actionLoading === matchId}
                          title="تكرار المباراة"
                          className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all"
                        >
                          <Copy size={14} />
                        </button>

                        <button 
                          onClick={() => handleShowHistory(matchId)} 
                          disabled={actionLoading === matchId}
                          title="سجل التعديلات"
                          className="p-2.5 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-xl hover:bg-gray-500/20 transition-all"
                        >
                          <History size={14} />
                        </button>

                        {quickEditId === matchId ? (
                          <div className="flex gap-1 animate-in fade-in zoom-in-95 duration-200">
                            <button 
                              onClick={() => {
                                handleQuickSave(matchId, quickEditData);
                                setQuickEditId(null);
                              }}
                              className="p-2.5 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"
                              title="حفظ سريع"
                            >
                              <Save size={14} />
                            </button>
                            <button 
                              onClick={() => setQuickEditId(null)}
                              className="p-2.5 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 transition-all"
                              title="إلغاء"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setQuickEditId(matchId);
                              setQuickEditData({
                                homeScore: m.score?.home || 0,
                                awayScore: m.score?.away || 0,
                                status: m.status || 'NS'
                              });
                            }}
                            className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all"
                            title="تعديل سريع"
                          >
                            <Activity size={14} />
                          </button>
                        )}

                        <button 
                          onClick={() => {
                            setControlMatchId(matchId);
                          }}
                          className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all"
                          title="التحكم المباشر"
                        >
                          <Activity size={14} />
                        </button>

                        <button 
                          onClick={() => handleStartEditMatch(m)} 
                          disabled={actionLoading === matchId}
                          className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all"
                          title="تعديل كامل"
                        >
                          <Edit size={14} />
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteMatch(matchId)} 
                      disabled={actionLoading === matchId}
                      className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                      title={m.isDeleted ? "حذف نهائي" : "نقل لسلة المهملات"}
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Desktop More Options */}
                    {!m.isDeleted && (
                      <div className="hidden lg:flex items-center gap-1.5 ml-1">
                        <button 
                          onClick={() => handleToggleHidden(matchId)} 
                          disabled={actionLoading === matchId}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            m.isHidden ? "bg-gray-500/10 border-gray-500/20 text-gray-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          {m.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button 
                          onClick={() => handleToggleArchived(matchId)} 
                          disabled={actionLoading === matchId}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            m.archived ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                          )}
                        >
                          <Archive size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
