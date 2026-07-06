import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldAlert, RefreshCw, UserCheck, ArrowLeft, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredRole }) => {
  const { user, profile, loading, hasPermission, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<string | null>(null);

  // Diagnostic logging specifically for identifying issues in route authorization
  useEffect(() => {
    if (!loading) {
      console.log('[ProtectedRoute Diagnostics]', {
        timestamp: new Date().toISOString(),
        authInitialized: !!user,
        userEmail: user?.email,
        uid: user?.uid,
        profileLoaded: !!profile,
        profileRole: profile?.role,
        requiredRoles: allowedRoles,
        hierarchicalRequiredRole: requiredRole,
        path: location.pathname
      });

      if (user) {
        user.getIdTokenResult().then(tokenResult => {
          console.log('[ProtectedRoute Claims]', {
            claims: tokenResult.claims,
            expirationTime: tokenResult.expirationTime,
            issuedAtTime: tokenResult.issuedAtTime
          });
        }).catch(err => {
          console.warn('[ProtectedRoute Claims Error]', err);
        });
      }
    }
  }, [user, profile, loading, allowedRoles, requiredRole, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-8 text-gray-300">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 text-sm font-medium">جاري التحقق من صلاحيات الوصول الآمنة...</p>
      </div>
    );
  }

  // If completely unauthenticated (no user at all)
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If user is authenticated but profile is missing or role checks fail
  const hasRequiredAllowedRole = !allowedRoles || allowedRoles.length === 0 || (profile && allowedRoles.includes(profile.role));
  const hasRequiredHierarchicalRole = !requiredRole || hasPermission(requiredRole);

  const isAuthorized = profile && hasRequiredAllowedRole && hasRequiredHierarchicalRole;

  // Render Diagnostic View if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center p-4 text-gray-300" dir="rtl">
        <div className="w-full max-w-xl bg-[#111112] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-600" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center border border-red-500/20">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">مركز تشخيص ومعالجة صلاحيات لوحة التحكم</h2>
              <p className="text-xs text-gray-500">تم حظر الوصول إلى هذا المسار لحماية النظام الموحد</p>
            </div>
          </div>

          {/* Diagnostic Details */}
          <div className="space-y-4 bg-white/5 border border-white/5 rounded-xl p-5 mb-6 text-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">حالة الجلسة النشطة:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                متصل بالبوابة الآمنة
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">البريد الإلكتروني الموثق:</span>
              <span className="text-white font-mono font-medium">{user.email}</span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">الرتبة المحمّلة في الـ Profile:</span>
              <span className={`font-bold uppercase px-2 py-0.5 rounded text-xs ${profile ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                {profile ? profile.role : 'لم يتم تحميل ملف التعريف (فارغ)'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">الرتب المطلوبة للمسار:</span>
              <span className="text-gray-300 font-mono text-xs font-bold">
                {allowedRoles?.join(' / ') || requiredRole || 'غير محدد'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">المسار المطلوب الوصول إليه:</span>
              <span className="text-gray-400 font-mono text-xs">{location.pathname}</span>
            </div>
          </div>



          {/* Nav Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => refreshProfile()}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl border border-white/5 transition-all"
            >
              <RefreshCw size={16} />
              <span>إعادة المزامنة والتحميل</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl border border-white/5 transition-all"
            >
              <ArrowLeft size={16} />
              <span>العودة للصفحة الرئيسية</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
