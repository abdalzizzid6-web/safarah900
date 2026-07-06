import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function WcUsersTab({ usersList, handleToggleAdmin, role, UserRole }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-[#f3c623] uppercase">إدارة صلاحيات مستخدمي المنصة الحية</h3>
      
      {role === UserRole.SUPER_ADMIN ? (
        <div className="bg-[#0f0f12] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs" dir="rtl">
            <thead className="bg-[#1a1a1a] text-gray-400">
              <tr>
                <th className="p-3">الإيميل</th>
                <th className="p-3">الاسم</th>
                <th className="p-3">نوع الحساب</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="p-3 text-white font-mono">{u.email}</td>
                  <td className="p-3 text-gray-300">{u.displayName || 'بدون اسم'}</td>
                  <td className="p-3">
                    {u.isAdmin ? (
                      <span className="text-[10px] bg-[#d4af37]/20 text-[#f3c623] px-2 py-1 rounded-md font-bold">مشرف</span>
                    ) : (
                      <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-1 rounded-md font-bold">عضو</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                      className="px-3 py-1 bg-black border border-white/10 rounded-lg text-[10px] text-gray-300 hover:text-white hover:border-[#f3c623]"
                    >
                      مبادلة الصلاحية
                    </button>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">لا يوجد مستخدمين مسجلين بعد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 border border-[#d4af37]/20 bg-[#d4af37]/5 rounded-2xl flex items-center gap-4">
          <ShieldAlert className="w-8 h-8 text-[#f3c623]" />
          <div>
            <h4 className="text-sm font-black text-white">ترقية الحسابات تتطلب SUPER_ADMIN</h4>
            <p className="text-xs text-gray-400">فقط المشرف الرئيسي يمكنه إدارة رتب وصلاحيات باقي الأعضاء لضمان أمان المنصة.</p>
          </div>
        </div>
      )}
    </div>
  );
}
