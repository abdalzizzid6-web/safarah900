import { worldCupService } from '../../../../services/worldCupService';
import React from 'react';
import { Edit3, Check } from 'lucide-react';

export function WcMatchesTab({ 
  dbMatches, 
  editingMatch, setEditingMatch, 
  matchOverrideForm, setMatchOverrideForm, 
  handleSaveMatchOverride, 
  matchSearchTerm, setMatchSearchTerm, handleEditMatchClick 
}: any) {
  return (
    <>
      {/* SUB 1: MATCHES */}
        <div className="space-y-6">
            <h3 className="text-xs font-black text-[#f3c623] uppercase">قائمة مباريات 2026 والتحكم الحقيقي بالسكور</h3>

            {editingMatch ? (
              <div className="bg-[#0f0f12] border border-[#d4af37]/30 p-5 rounded-2xl max-w-xl space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-black text-white">تعديل وتجاوز بيانات المباراة #{editingMatch.id}</span>
                  <button onClick={() => setEditingMatch(null)} className="text-xs text-gray-500 hover:text-white">إلغاء</button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 text-right" dir="rtl">
                  {/* Section 1: Titles & Tournament */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-[#f3c623] font-black uppercase border-r-2 border-[#f3c623] pr-1">عنوان وتنسيق المباراة</h4>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">اسم اللقاء المخصص (مثل: الافتتاح الكبير، ديربي حاسم)</label>
                      <input 
                        type="text" 
                        value={matchOverrideForm.matchName} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, matchName: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        placeholder="اترك فارغاً للاعتماد على محاذاة الفرق الافتراضية"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">البطولة الحالية</label>
                      <input 
                        type="text" 
                        value={matchOverrideForm.competitionName} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, competitionName: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        placeholder="كأس العالم لكرة القدم 2026"
                      />
                    </div>
                  </div>

                  {/* Section 2: Teams & Crests */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <h4 className="text-[10px] text-[#f3c623] font-black uppercase border-r-2 border-[#f3c623] pr-1">تجاوز أسماء وشعارات الفريقين</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">اسم الفريق الأول (المستضيف)</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.homeTeamName} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, homeTeamName: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">اسم الفريق الثاني (الضيف)</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.awayTeamName} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, awayTeamName: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">رابط شعار المستضيف (URL)</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.homeTeamCrest} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, homeTeamCrest: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-[10px] text-white font-mono"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">رابط شعار الضيف (URL)</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.awayTeamCrest} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, awayTeamCrest: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-[10px] text-white font-mono"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Timing, Status, Score */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <h4 className="text-[10px] text-[#f3c623] font-black uppercase border-r-2 border-[#f3c623] pr-1">السكور التوقيت وحالة المباراة</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">أهداف الفريق الأول</label>
                        <input 
                          type="number" 
                          value={matchOverrideForm.homeScore} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, homeScore: Number(e.target.value) })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 font-mono text-center text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">أهداف الفريق الثاني</label>
                        <input 
                          type="number" 
                          value={matchOverrideForm.awayScore} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, awayScore: Number(e.target.value) })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 font-mono text-center text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">حالة اللقاء</label>
                        <select 
                          value={matchOverrideForm.status} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, status: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        >
                          <option value="SCHEDULED">غير ملعوبة (Scheduled)</option>
                          <option value="LIVE">مباشر الآن (LIVE)</option>
                          <option value="FINISHED">انتهت بالكامل (FT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">الدقيقة الحالية</label>
                        <input 
                          type="number" 
                          value={matchOverrideForm.elapsed} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, elapsed: Number(e.target.value) })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2.5 font-mono text-center text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">تاريخ ووقت المباراة الجديد</label>
                      <input 
                        type="datetime-local" 
                        value={matchOverrideForm.utcDate} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, utcDate: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Section 4: Specifications & Staff */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <h4 className="text-[10px] text-[#f3c623] font-black uppercase border-r-2 border-[#f3c623] pr-1">الملعب، المعلق والقنوات</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">الاستاد المستضيف</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.venue} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, venue: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 font-bold block mb-1">معلق المباراة</label>
                        <input 
                          type="text" 
                          value={matchOverrideForm.referee} 
                          onChange={e => setMatchOverrideForm({ ...matchOverrideForm, referee: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                          placeholder="عصام الشوالي، فارس عوض"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">القنوات الناقلة المعتمدة</label>
                      <input 
                        type="text" 
                        value={matchOverrideForm.broadcastingChannels} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, broadcastingChannels: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white"
                        placeholder="beIN Sports 1 HD, beIN Sports 2 HD"
                      />
                    </div>
                  </div>

                  {/* Section 5: Promotional Images & Descriptions */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <h4 className="text-[10px] text-[#f3c623] font-black uppercase border-r-2 border-[#f3c623] pr-1">الترويج والوصف البصري</h4>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">رابط بوستر/صورة اللقاء (URL)</label>
                      <input 
                        type="text" 
                        value={matchOverrideForm.matchImage} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, matchImage: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-[10px] text-white font-mono"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-400 font-bold block mb-1">وصف اللقاء والاستوديو التحليلي</label>
                      <textarea 
                        value={matchOverrideForm.matchDescription} 
                        onChange={e => setMatchOverrideForm({ ...matchOverrideForm, matchDescription: e.target.value })}
                        className="w-full bg-black border border-white/10 rounded-xl p-2 text-xs text-white h-20 text-right resize-none"
                        placeholder="اكتب التجهيزات والتفاصيل الحية للمباراة هنا..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <button 
                    onClick={handleSaveMatchOverride}
                    className="w-full py-2.5 bg-[#d4af37] hover:bg-[#f3c623] text-black text-xs font-black rounded-xl transition-all"
                  >
                    حفظ التغييرات في Firestore وتحديث الاستدعاءات
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="ابحث عن مباراة..."
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                    onChange={(e) => setMatchSearchTerm(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                  {dbMatches.filter((m: any) => 
                    worldCupService.translateTeam(m.homeTeam.name).includes(matchSearchTerm) || 
                    worldCupService.translateTeam(m.awayTeam.name).includes(matchSearchTerm) ||
                    String(m.id).includes(matchSearchTerm)
                  ).map((m: any) => (
                    <div key={m.id} className="p-3.5 rounded-2xl bg-black border border-white/5 flex items-center justify-between gap-4">
                      <div className="text-right space-y-1">
                        <p className="text-[10px] text-gray-400 font-bold">مباراة #{m.id.replace('2026-m-', '')} - {m.stage === 'GROUP_STAGE' ? 'مجموعات' : 'إقصائي'}</p>
                        <div className="flex items-center gap-1 text-xs font-extrabold text-white">
                          <span>{worldCupService.translateTeam(m.homeTeam.name)}</span>
                          <span className="font-mono text-[#f3c623]">[{m.score?.fullTime?.home ?? '--'}]</span>
                          <span className="text-gray-500">vs</span>
                          <span>{worldCupService.translateTeam(m.awayTeam.name)}</span>
                          <span className="font-mono text-[#f3c623]">[{m.score?.fullTime?.away ?? '--'}]</span>
                        </div>
                      </div>
  
                      <button 
                        onClick={() => handleEditMatchClick(m)}
                        className="px-3 py-1.5 bg-[#d4af37]/10 hover:bg-[#d4af37]/25 text-[#f3c623] text-[10px] font-black rounded-lg border border-[#d4af37]/20 flex items-center gap-1 transition-all"
                      >
                        <Edit3 size={10} />
                        <span>سجل سكور</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
  );
}
