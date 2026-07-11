import { worldCupService } from '../../../../services/worldCupService';
import React from 'react';
import { Plus, Edit3, Trash2, Check, Eye, EyeOff, Play } from 'lucide-react';

export function WcStreamsTab({ 
  streamsList, dbMatches,
  newStream, setNewStream,
  editingStreamId, setEditingStreamId,
  handlePublishStream, handleEditStreamClick, handleToggleStreamActive, handleDeleteStream
}: any) {
  return (
    <>
      {/* SUB 4: STREAMS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" dir="rtl">
            
            {/* Form Column */}
            <form onSubmit={handlePublishStream} className="lg:col-span-5 space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-[#f3c623] uppercase flex items-center gap-1.5">
                  <Play size={14} className="animate-pulse text-amber-500" />
                  <span>{editingStreamId ? 'تعديل مصدر البث المباشر' : 'إضافة وتأمين بث مباشر جديد'}</span>
                </h3>
                {editingStreamId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingStreamId(null);
                      setNewStream({
                        matchId: '',
                        channelName: '',
                        primaryStream: '',
                        backupStream: '',
                        streamQuality: 'FHD',
                        streamNotes: '',
                        isActive: true
                      });
                    }}
                    className="text-[9px] hover:underline text-gray-400 font-black"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">المباراة المستهدفة (ID من football-data)</label>
                <select 
                  value={newStream.matchId} 
                  required
                  onChange={e => setNewStream({ ...newStream, matchId: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="">-- اختر المباراة للبث --</option>
                  {dbMatches.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.id} • {worldCupService.translateTeam(m.homeTeam.name)} ضد {worldCupService.translateTeam(m.awayTeam.name)} ({new Date(m.utcDate).toLocaleDateString('ar-SA', {month:'short', day:'numeric'})})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">اسم القناة والناقل</label>
                <input 
                  type="text" 
                  value={newStream.channelName} 
                  required
                  onChange={e => setNewStream({ ...newStream, channelName: e.target.value })}
                  placeholder="مثال: بي إن سبورتس 1 - القناة الصوتية الأولى"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">رابط البث الرئيسي (Embed URL)</label>
                <input 
                  type="text" 
                  value={newStream.primaryStream} 
                  required
                  onChange={e => setNewStream({ ...newStream, primaryStream: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">رابط بث احتياطي (اختياري)</label>
                <input 
                  type="text" 
                  value={newStream.backupStream} 
                  onChange={e => setNewStream({ ...newStream, backupStream: e.target.value })}
                  placeholder="https://www.youtube.com/embed/... (او سيرفر بديل)"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">جودة البث</label>
                  <select 
                    value={newStream.streamQuality} 
                    onChange={e => setNewStream({ ...newStream, streamQuality: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="SD">SD (جودة منخفضة)</option>
                    <option value="HD">HD (جودة متوسطة)</option>
                    <option value="FHD">FHD (جودة عالية)</option>
                    <option value="4K">4K (جودة فائقة)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input 
                    type="checkbox" 
                    id="is_active_st"
                    checked={newStream.isActive} 
                    onChange={e => setNewStream({ ...newStream, isActive: e.target.checked })}
                    className="rounded bg-black border-white/10 text-amber-500 focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="is_active_st" className="text-[10px] text-gray-300 font-bold cursor-pointer select-none">
                    عرض وتفعيل البث للجمهور
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">ملاحظات البث (اختياري)</label>
                <textarea 
                  value={newStream.streamNotes} 
                  onChange={e => setNewStream({ ...newStream, streamNotes: e.target.value })}
                  placeholder="مثال: بصوت المعلق عصام الشوالي - بث سريع بدون تقطيع"
                  rows={2}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-[#d4af37] text-black text-xs font-black rounded-xl hover:bg-[#f3c623] transition-all"
              >
                {editingStreamId ? 'تحديث وتأمين البث المباشر 📺' : 'حفظ ونشر البث المباشر 📺'}
              </button>
            </form>

            {/* List Column */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase font-sans">
                مصادر البث المستقرة في قاعدة البيانات ({streamsList.length})
              </h3>
              
              <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
                {streamsList.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-white/5 bg-white/[0.01] rounded-2xl">
                    <p className="text-xs text-gray-400 font-bold">لا يوجد أي مصادر بث مضافة حالياً في قاعدة البيانات.</p>
                  </div>
                ) : (
                  streamsList.map((stream: any) => {
                    // Try to find the associated match details to display home / away names for better readability
                    const mInfo = dbMatches.find((m: any) => String(m.id) === String(stream.matchId));
                    return (
                      <div key={stream.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-white/[0.02] hover:border-amber-500/20">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-500/20">
                              {stream.streamQuality || 'FHD'}
                            </span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${stream.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {stream.isActive ? 'نشط ويظهر للجمهور' : 'مخفي عن الجمهور'}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold font-mono">ID: {stream.matchId}</span>
                          </div>

                          <div>
                            <strong className="text-xs font-black text-white block">{stream.channelName}</strong>
                            {mInfo ? (
                              <span className="text-[10px] text-gray-400 font-bold block pt-0.5">
                                المباراة: {worldCupService.translateTeam(mInfo.homeTeam.name)} ضد {worldCupService.translateTeam(mInfo.awayTeam.name)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold block pt-0.5">مباراة غير مرتبطة بمعلومات</span>
                            )}
                            {stream.streamNotes && (
                              <span className="text-[10px] text-[#f3c623] font-bold block mt-1">🗒️ {stream.streamNotes}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button 
                            type="button"
                            onClick={() => handleToggleStreamActive(stream.id, stream.isActive)}
                            title={stream.isActive ? "إخفاء البث" : "إظهار البث"}
                            className={`p-2 rounded-xl transition-all ${stream.isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                          >
                            {stream.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleEditStreamClick(stream)}
                            title="تعديل تيار البث"
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                          >
                            <Edit3 size={14} />
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleDeleteStream(stream.id)}
                            title="حذف البث نهائياً"
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
  );
}
