import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Star, Trash2, Edit2, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { UserRole } from '../../types';
import { useError } from '../../context/ErrorContext';

export default function UserRoleManager({ users: initialUsers = [], onUpdate }: { users?: any[], onUpdate?: () => void }) {
  const { showToast } = useError();
  const [localUsers, setLocalUsers] = useState<any[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setLocalUsers(fetched);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('خطأ أثناء تحميل كشف المستخدمين', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setLocalUsers(initialUsers);
    } else {
      fetchUsers();
    }
  }, [initialUsers]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setLoading(uid);
    try {
      // Update both collections for compatibility
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      try {
        await updateDoc(doc(db, 'user_roles', uid), { role: newRole });
      } catch (e) {
        // user_roles doc might not exist yet; ignore or gracefully catch
      }
      showToast('تم تحديث صلاحيات المستخدم بنجاح', 'success');
      setLocalUsers(prev => prev.map(u => (u.uid === uid || u.id === uid) ? { ...u, role: newRole } : u));
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast('فشل تحديث الصلاحيات.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const toggleVip = async (uid: string, isVip: boolean) => {
    setLoading(uid);
    try {
      const updatedRole = isVip ? UserRole.VIP_USER : UserRole.USER;
      await updateDoc(doc(db, 'users', uid), { 
        isVip, 
        role: updatedRole
      });
      showToast(isVip ? 'تم تفعيل عضوية VIP للمستخدم' : 'تم إلغاء عضوية VIP', 'success');
      setLocalUsers(prev => prev.map(u => (u.uid === uid || u.id === uid) ? { ...u, isVip, role: updatedRole } : u));
      if (onUpdate) onUpdate();
    } catch (err) {
      showToast('فشل تحديث العضوية.', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <ShieldAlert className="text-indigo-500" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">إدارة الصلاحيات والأدوار (RBAC)</h2>
            <p className="text-xs text-gray-500 font-bold mt-1">التحكم الكامل في رتب المستخدمين وصلاحيات الوصول للمقالات والتقارير.</p>
          </div>
        </div>

        <button 
          onClick={fetchUsers}
          disabled={fetching}
          className="p-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-black"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin text-primary' : ''} />
          تحديث الكشف
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localUsers.map(u => (
          <div key={u.uid || u.id} className="bg-[#111112] border border-white/5 rounded-3xl p-6 space-y-4 hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <img 
                src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email || 'User'}`} 
                className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  {u.displayName || 'مستخدم مسجل'}
                  {u.isVip && <Star size={12} className="text-primary fill-current animate-pulse" />}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold">{u.email}</p>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-white uppercase">
                 {u.role || 'USER'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-500 mr-2">تغيير الرتبة</label>
                 <select 
                   value={u.role || UserRole.USER}
                   disabled={loading === (u.uid || u.id)}
                   onChange={(e) => handleRoleChange(u.uid || u.id, e.target.value as UserRole)}
                   className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-primary font-bold cursor-pointer"
                 >
                   {Object.values(UserRole).map(r => (
                     <option key={r} value={r}>{r}</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-gray-500 mr-2">عضوية VIP</label>
                 <button 
                   onClick={() => toggleVip(u.uid || u.id, !u.isVip)}
                   disabled={loading === (u.uid || u.id)}
                   className={`w-full py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${
                     u.isVip 
                     ? 'bg-primary text-black border-primary' 
                     : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                   }`}
                 >
                   {u.isVip ? 'إلغاء VIP' : 'تفعيل VIP'}
                 </button>
               </div>
            </div>
          </div>
        ))}

        {localUsers.length === 0 && !fetching && (
          <div className="col-span-full py-20 text-center text-gray-500 text-xs font-bold">لم يتم العثور على مستخدمين لمراجعة صلاحياتهم.</div>
        )}

        {fetching && (
          <div className="col-span-full py-20 text-center text-gray-500 text-xs font-bold flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-primary" />
            جاري سحب قائمة الأعضاء...
          </div>
        )}
      </div>
    </div>
  );
}
