import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export function WcNewsTab({ 
  newsList, 
  newArticle, setNewArticle, 
  handlePublishNews, handleDeleteNews 
}: any) {
  return (
    <>
      {/* SUB 3: NEWS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handlePublishNews} className="space-y-4">
              <h3 className="text-xs font-bold text-[#f3c623] uppercase">نشر مقال رياضي جديد في wcup2026.org</h3>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">عنوان المقال</label>
                <input 
                  type="text" 
                  value={newArticle.title} 
                  required
                  onChange={e => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="مثال: القرعة تضع المنتخب السعودي في مجموعة مثيرة"
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">ملخص سريع للأخبار</label>
                <input 
                  type="text" 
                  value={newArticle.summary} 
                  onChange={e => setNewArticle({ ...newArticle, summary: e.target.value })}
                  placeholder="موجز يظهر في الصفحة المبتدئة..."
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">محتوى المقال الكامل بالتفصيل</label>
                <textarea 
                  value={newArticle.content} 
                  required
                  rows={4}
                  onChange={e => setNewArticle({ ...newArticle, content: e.target.value })}
                  placeholder="اكتب هنا كافة تفاصيل الخبر والتحليل الفني..."
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">رابط صورة المقال</label>
                  <input 
                    type="text" 
                    value={newArticle.image} 
                    onChange={e => setNewArticle({ ...newArticle, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">المحرر الكاتب</label>
                  <input 
                    type="text" 
                    value={newArticle.author} 
                    onChange={e => setNewArticle({ ...newArticle, author: e.target.value })}
                    placeholder="هيئة التحرير"
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-[#d4af37] text-black text-xs font-black rounded-xl hover:bg-[#f3c623] transition-all"
              >
                نشر وتوزيع المقال فورياً
              </button>
            </form>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase">الأخبار المنشورة المتزامنة ({newsList.length})</h3>
              <div className="divide-y divide-white/5 space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {newsList.map(item => (
                  <div key={item.id} className="pt-3 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-white leading-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-500 font-bold">بواسطة {item.author || 'محرر'}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteNews(item.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg shrink-0 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
  );
}
