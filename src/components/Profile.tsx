import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { auth, signInWithGoogle, signInWithFacebook, handleFirestoreError, OperationType, handleRedirectResult, loginWithEmail, registerWithEmail, registerForPushNotifications, resetPasswordWithEmail } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Link } from 'react-router-dom';
import { LogOut, Settings, Bell, Star, Shield, User as UserIcon, Check, Plus, Trophy, Users, Mail, Lock, AlertCircle, Radio, Download, Bookmark, BookOpen, Trash2, ChevronRight, Cookie, Info, FileText, AlertTriangle, HelpCircle, Megaphone, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as userRepository from '../features/users/repositories/userRepository';
import { updateProfile } from 'firebase/auth';
import { UserProfile, League, UserRole } from '../types';
import { cn } from '../lib/utils';
import { useError } from '../context/ErrorContext';
import { useAuth } from '../context/AuthContext';

const POPULAR_LEAGUE_CHOICES = [
  { id: '307', name: 'الدوري السعودي للمحترفين', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { id: '39', name: 'الدوري الإنجليزي الممتاز', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: '140', name: 'الدوري الإسباني - لاليغا', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: '135', name: 'الدوري الإيطالي - الدرجة أ', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: '2', name: 'دوري أبطال أوروبا', logo: 'https://media.api-sports.io/football/leagues/2.png' }
];

import ThemeSettings from './ThemeSettings';
import ShareButton from './ShareButton';

// دالة مساعدة لترجمة أخطاء تسجيل الدخول بجوجل وعرض السبب الحقيقي للمستخدم بوضوح
const getAuthErrorMessage = (error: any): string => {
  if (!error) return 'حدث خطأ غير معروف في تسجيل الدخول.';
  
  const code = error.code || '';
  const message = error.message || String(error);
  
  // تسجيل تفصيلي كامل للخطأ في الـ Console لتسهيل المطالعة والتحقق
  console.error("[Google Auth Error Details]:", {
    code,
    message,
    originalError: error
  });

  let arMsg = '';
  if (message === 'POPUP_BLOCKED_AND_IFRAME' || code === 'POPUP_BLOCKED_AND_IFRAME') {
    arMsg = 'تم حظر نافذة تسجيل الدخول المنبثقة من قِبل المتصفح، أو أن البيئة الحالية (Iframe) تمنع الاتصال بـ Google Auth.';
  } else {
    switch (code) {
      case 'auth/popup-blocked':
        arMsg = 'تم حظر النافذة المنبثقة لتسجيل الدخول بـ Google بواسطة متصفحك. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجدداً.';
        break;
      case 'auth/popup-closed-by-user':
        arMsg = 'تم إغلاق نافذة تسجيل الدخول بجوجل بواسطة المستخدم قبل إتمام العملية.';
        break;
      case 'auth/cancelled-popup-request':
        arMsg = 'تم إلغاء عملية تسجيل الدخول المنبثقة بسبب طلب تسجيل دخول آخر.';
        break;
      case 'auth/unauthorized-domain':
        arMsg = `هذا النطاق غير مضاف إلى نطاقات تفعيل Google Auth في مشروع Firebase. يرجى التأكد من إضافة النطاق الحالي (korea90.xyz أو www.korea90.xyz) في قائمة "Authorized Domains" بإعدادات منصة Firebase Console لتفعيل تسجيل الدخول.`;
        break;
      case 'auth/operation-not-allowed':
        arMsg = 'طريقة تسجيل الدخول عبر Google ليست مفعلة في مشروع Firebase الخاص بك. يرجى تفعيل (Google Provider) في لوحة تحكم Firebase Console.';
        break;
      case 'auth/network-request-failed':
        arMsg = 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت لديك وحاول مجدداً.';
        break;
      case 'auth/internal-error':
        arMsg = 'حدث خطأ داخلي في خوادم Google Auth. يرجى إعادة المحاولة لاحقاً.';
        break;
      case 'auth/invalid-api-key':
        arMsg = 'مفتاح Firebase API Key غير صالح أو تم حظره.';
        break;
      case 'auth/account-exists-with-different-credential':
        arMsg = 'هناك حساب مسجل بهذا البريد الإلكتروني في التطبيق باستخدام فيسبوك أو البريد الإلكتروني العادي. يرجى استخدامه لتسجيل الدخول.';
        break;
      case 'auth/credential-already-in-use':
        arMsg = 'هذه الهوية مستخدمة بالفعل من قبل حساب مستخدم آخر بقاعدة البيانات.';
        break;
      default:
        // عرض تفصيلي صريح من Firebase كما طلب المستخدم لمعرفة السبب الحقيقي
        arMsg = `فشل تسجيل الدخول. رمز الخطأ: (${code || 'UNKNOWN'}) | تفاصيل: ${message}`;
    }
  }

  // إذا كنا نعمل داخل إطار معاينة، نوفر للمطور حلاً بديلاً
  if (typeof window !== 'undefined' && window !== window.top) {
    arMsg += '\n\n💡 ملحوظة: بما أنك تتصفح التطبيق داخل إطار معاينة (Iframe)، يوصى بفتح التطبيق في علامة تبويب كاملة مستقلة بالمتصفح (Open in new tab) ليعمل تسجيل دخول جوجل بسلاسة.';
  }

  return arMsg;
};

export default function Profile() {
  const { showError, showToast } = useError();
  const { hasPermission } = useAuth();
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // User Point Tracker state variables
  const [points, setPoints] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userRank, setUserRank] = useState<string>('مشجع مستجد ⚽');
  const [newsCount, setNewsCount] = useState<number>(0);
  const [matchesCount, setMatchesCount] = useState<number>(0);
  const [contestsCount, setContestsCount] = useState<number>(0);

  useEffect(() => {
    const loadPointsData = async () => {
      try {
        const { getUserProgress } = await import('../utils/UserPointTracker');
        const progress = await getUserProgress();
        setPoints(progress.points);
        setUserLevel(progress.level);
        setUserRank(progress.rankTitle);
        setNewsCount(progress.newsCount);
        setMatchesCount(progress.matchesCount);
        setContestsCount(progress.contestsCount);
      } catch (e) {
        console.warn("Failed to load user level/points metrics:", e);
      }
    };
    loadPointsData();
    
    const handlePointsUpdate = (e: any) => {
      if (e.detail) {
        setPoints(e.detail.points);
        import('../utils/UserPointTracker').then(({ calculateLevel, getRankTitle }) => {
          setUserLevel(calculateLevel(e.detail.points));
          setUserRank(getRankTitle(e.detail.points));
        });
      }
    };
    window.addEventListener('Safara 90_points_updated', handlePointsUpdate);
    return () => window.removeEventListener('Safara 90_points_updated', handlePointsUpdate);
  }, [user]);

  const handleRegisterPush = async () => {
    if (!user) return;
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setNotificationToken(token);
        showToast('تم تفعيل التنبيهات بنجاح! ستصلك تنبيهات عند الأهداف وانطلاق المباريات.', 'success');
      }
    } catch (e) {
      showError('فشل تفعيل التنبيهات. يرجى التأكد من السماح بالإشعارات في المتصفح.');
    }
  };

  useEffect(() => {
    // معالجة نتيجة الـ Redirect (مهم جداً لتطبيقات الأندرويد لربط حساب جوجل بنجاح)
    const checkRedirect = async () => {
      try {
        setAuthLoading(true);
        const result = await handleRedirectResult();
        if (result?.user) {
          console.log("[Google Auth Debug] تم تسجيل الدخول بنجاح عبر إعادة التوجيه:", result.user.displayName);
          showToast(`مرحباً بك مجدداً يا ${result.user.displayName}!`, 'success');
        }
      } catch (error: any) {
        console.error("[Google Auth Error] فشل التحقق في checkRedirect المباشر:", error);
        if (error.code !== 'auth/credential-already-in-use' && error.code !== 'auth/operation-not-allowed') {
          setAuthError(getAuthErrorMessage(error));
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const data = await userRepository.getUserProfile(user.uid);
          if (data) {
            setProfile(data as any);
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
              email: user.email || '',
              photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`,
              isAdmin: user.email === 'abdalziz2022@gmail.com',
              favoriteLeagues: [],
              favoriteTeams: [],
            };
            await userRepository.createUserProfile(user.uid, newProfile as any);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          showError(error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        if (!displayNameInput.trim()) {
          setAuthError('الرجاء إدخال الاسم بالكامل أولاً.');
          setAuthLoading(false);
          return;
        }
        const userCredential = await registerWithEmail(email, password);
        const registeredUser = userCredential.user;
        
        // Update user display name in Firebase Auth
        await updateProfile(registeredUser, {
          displayName: displayNameInput.trim()
        });

        // Create the Firestore user profile document direct
        const newProfile: UserProfile = {
          uid: registeredUser.uid,
          displayName: displayNameInput.trim(),
          email: registeredUser.email || '',
          photoURL: registeredUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${registeredUser.uid}`,
          isAdmin: registeredUser.email === 'abdalziz2022@gmail.com',
          favoriteLeagues: [],
          favoriteTeams: [],
        };
        await userRepository.createUserProfile(registeredUser.uid, newProfile as any);
        setProfile(newProfile);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setAuthError('البريد الإلكتروني مستخدم بالفعل');
      else if (err.code === 'auth/wrong-password') setAuthError('كلمة المرور خاطئة');
      else if (err.code === 'auth/user-not-found') setAuthError('المستخدم غير موجود');
      else if (err.code === 'auth/weak-password') setAuthError('كلمة المرور ضعيفة جداً (أدخل 6 خانات على الأقل)');
      else setAuthError('حدث خطأ أثناء تسجيل الدخول. تأكد من البيانات.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("[Google Auth Error] فشل المستمع في واجهة المستخدم:", error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setResetMessage('');
    if (!resetEmail) {
      setAuthError('الرجاء كتابة البريد الإلكتروني أولاً لإرسال رابط الاستعادة.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPasswordWithEmail(resetEmail);
      setResetMessage('تم إرسال رابط فريد لإعادة تعيين كلمة المرور بنجاح! يرجى التحقق من صندوق الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).');
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setAuthError('عذراً، هذا البريد الإلكتروني غير مسجل لدينا.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('البريد الإلكتروني الذي أدخلته غير صحيح.');
      } else {
        setAuthError('حدث خطأ أثناء محاولة إرسال الرابط. تأكد من اتصالك بالإنترنت وحاول مجدداً.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const toggleFavorite = async (type: 'favoriteLeagues' | 'favoriteTeams', value: string) => {
    if (!profile || !user) return;

    setSaving(true);
    const currentList = profile[type] || [];
    const newList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];

    try {
      await userRepository.updateUserProfile(user.uid, { [type]: newList });
      setProfile({ ...profile, [type]: newList });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 space-y-6 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass p-8 rounded-[40px] space-y-6"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-primary/20 rounded-full ring-4 ring-primary/10">
              <UserIcon size={40} className="text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black">حساب المشجع</h1>
            <p className="text-gray-400 text-sm font-medium">إنشاء الحساب اختياري بالكامل. يمكنك الاستمتاع بكافة مميزات التطبيق كزائر.</p>
          </div>
          
          {points > 0 && (
            <div className="bg-[#121c2c] border border-primary/20 p-4 rounded-2xl flex items-center justify-between text-right gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                  <Trophy size={16} />
                </span>
                <div>
                  <span className="text-xs text-primary font-black block">نقاطك التفاعلية الحالية</span>
                  <span className="text-[10px] text-gray-400 font-bold block">{userRank} • المستوى {userLevel}</span>
                </div>
              </div>
              <span className="text-sm font-black text-white shrink-0">{points} نقطة 🔥</span>
            </div>
          )}
          
          <div className="space-y-4">
            {!showEmailAuth ? (
              <>
                {!Capacitor.isNativePlatform() && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-black px-6 py-4 rounded-2xl hover:neon-glow transition-all active:scale-95 text-sm disabled:opacity-50"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                        {authLoading ? 'جاري التحميل...' : 'تسجيل الدخول السريع'}
                      </button>
                    </div>

                    {authError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-semibold leading-relaxed">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <div>{authError}</div>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0a0a0a] px-3 text-gray-500 font-black">أو عبر البريد</span></div>
                    </div>
                  </>
                )}

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowEmailAuth(true);
                      setAuthError('');
                    }}
                    className="w-full flex items-center justify-center gap-3 glass text-white font-black px-6 py-4 rounded-2xl hover:bg-white/5 transition-all text-sm"
                  >
                    <Mail size={18} />
                    البريد الإلكتروني
                  </button>

                  <div className="pt-4 space-y-3">
                    <Link 
                      to="/"
                      className="w-full flex items-center justify-center gap-3 bg-primary/10 text-primary border border-primary/20 font-black px-6 py-4 rounded-2xl hover:bg-primary/20 transition-all shadow-lg shadow-primary/5"
                    >
                      المتابعة كزائر (بدون حساب)
                    </Link>
                    <p className="text-[10px] text-center text-gray-500 font-bold px-8">
                      * تسجيل الحساب يتيح لك فقط حفظ الفرق المفضلة وتلقي تنبيهات الأهداف المباشرة.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                   <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <Download size={16} />
                         </div>
                         <h3 className="text-xs font-black">تطبيق Safara 90</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                         ثبّت التطبيق على شاشة هاتفك الرئيسية لمتابعة المباريات بشكل أسرع والحصول على تنبيهات فورية.
                      </p>
                      <button 
                        onClick={() => {
                          alert("لتثبيت التطبيق:\n1. اضغط على زر المشاركة (Share) في المتصفح\n2. اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen)");
                        }}
                        className="w-full bg-primary/20 text-primary text-[10px] font-black py-2 rounded-xl hover:bg-primary/30 transition-colors"
                      >
                         كيفية التثبيت؟
                      </button>
                   </div>
                </div>
              </>
            ) : showForgotPassword ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-black text-primary">إعادة تعيين كلمة المرور</h2>
                  <p className="text-gray-400 text-xs font-medium">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة حسابك فوراً.</p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block px-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        required
                        placeholder="example@mail.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-shake">
                      <AlertCircle size={14} className="shrink-0" />
                      {authError}
                    </div>
                  )}

                  {resetMessage && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-2 text-green-400 text-xs font-bold leading-relaxed">
                      <Check size={16} className="shrink-0 mt-0.5 text-green-500" />
                      <div>{resetMessage}</div>
                    </div>
                  )}

                  <button 
                    disabled={resetLoading}
                    type="submit"
                    className="w-full bg-primary text-black font-black px-6 py-4 rounded-2xl hover:neon-glow transition-all disabled:opacity-50"
                  >
                    {resetLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setAuthError('');
                      setResetMessage('');
                    }}
                    className="text-xs text-gray-500 font-bold hover:text-white transition-colors text-center w-full block pt-2"
                  >
                    ← العودة لصفحة تسجيل الدخول
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-surface p-1 rounded-2xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setAuthError('');
                    }}
                    className={cn(
                      "flex-1 py-2 text-sm font-black rounded-xl transition-all",
                      !isSignUp ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setAuthError('');
                    }}
                    className={cn(
                      "flex-1 py-2 text-sm font-black rounded-xl transition-all",
                      isSignUp ? "bg-primary text-black shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                  >
                    حساب جديد
                  </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 block px-2 text-right">الاسم بالكامل</label>
                      <div className="relative text-right">
                        <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                          type="text" 
                          required
                          placeholder="مثال: أحمد محمد"
                          value={displayNameInput}
                          onChange={(e) => setDisplayNameInput(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all text-right"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 block px-2">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="email" 
                        required
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-xs font-bold text-gray-400">كلمة المرور</label>
                      {!isSignUp && (
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setResetEmail(email);
                            setAuthError('');
                          }}
                          className="text-primary text-[11px] font-black hover:underline"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:neon-border outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-xs font-bold animate-shake">
                      <AlertCircle size={14} className="shrink-0" />
                      {authError}
                    </div>
                  )}

                  <button 
                    disabled={authLoading}
                    type="submit"
                    className="w-full bg-primary text-black font-black px-6 py-4 rounded-2xl hover:neon-glow transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'جاري التحميل...' : (isSignUp ? 'إنشاء الحساب' : 'تسجيل الدخول')}
                  </button>

                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowEmailAuth(false)}
                      className="text-xs text-gray-500 font-bold hover:text-white transition-colors text-center w-full"
                    >
                      ← العودة لخيارات الدخول
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md"
        >
          <ThemeSettings />
        </motion.div>

        {/* Guest Information and Compliance Pages */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-md bg-[#0b1424]/45 backdrop-blur-md rounded-[32px] p-6 border border-white/5 space-y-4"
        >
          <h3 className="text-sm font-black text-slate-300 border-b border-white/5 pb-2 text-right">
            روابط ومعلومات هامة للمشجعين
          </h3>
          <div className="grid grid-cols-2 gap-2 text-right" dir="rtl">
            <Link to="/about" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <Info size={14} className="text-secondary shrink-0" />
              <span>من نحن</span>
            </Link>
            <Link to="/contact" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <Mail size={14} className="text-primary shrink-0" />
              <span>اتصل بنا</span>
            </Link>
            <Link to="/privacy" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <Shield size={14} className="text-emerald-500 shrink-0" />
              <span>سياسة الخصوصية</span>
            </Link>
            <Link to="/cookies" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <Cookie size={14} className="text-amber-500 shrink-0" />
              <span>سياسة الكوكيز</span>
            </Link>
            <Link to="/terms" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <FileText size={14} className="text-blue-500 shrink-0" />
              <span>الشروط والأحكام</span>
            </Link>
            <Link to="/disclaimer" className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs">
              <AlertTriangle size={14} className="text-yellow-500 shrink-0" />
              <span>إخلاء المسؤولية</span>
            </Link>
            <Link to="/advertising" className="col-span-2 flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-all text-xs border-t border-white/5 mt-1">
              <span className="flex items-center gap-2">
                <Megaphone size={14} className="text-rose-500 shrink-0" />
                <span>برنامج الناشرين والإعلانات</span>
              </span>
              <ChevronRight size={12} className="text-gray-500" />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const isPlatformAdmin = hasPermission(UserRole.AUTHOR);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-24 space-y-8" dir="rtl">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[40px] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
      >
        <div className="relative">
          <img src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`} alt="" className="w-32 h-32 rounded-full border-4 border-primary/20" referrerPolicy="no-referrer" />
          {isPlatformAdmin && (
            <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-full shadow-lg">
              <Shield size={20} />
            </div>
          )}
        </div>
        
        <div className="text-center md:text-right space-y-2 flex-1">
          <h1 className="text-3xl font-black text-white">{profile?.displayName || user.displayName}</h1>
          <p className="text-gray-400 text-sm font-medium">{user.email}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            {isPlatformAdmin && (
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter">إدارة المنصة</span>
            )}
            <span className="bg-[#121c2c] border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-black">{userRank}</span>
            <span className="bg-[#1a122c] border border-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-black">المستوى {userLevel} ⭐</span>
            <span className="bg-primary/10 text-white border border-white/5 px-3 py-1 rounded-full text-xs font-bold">{points} نقطة 🔥</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {isPlatformAdmin && (
            <Link 
              to="/admin"
              className="bg-primary text-black px-6 py-3 rounded-2xl font-black text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <LayoutDashboard size={18} /> لوحة التحكم
            </Link>
          )}

          <ShareButton variant="dropdown" align="right" text="انضم إليّ على صافرة 90 وتابع تفاصيل المباريات والموعد المكتملة ومواصفات الفرق!" />
          
          <button 
            onClick={() => auth.signOut()}
            className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <LogOut size={18} /> تسجيل الخروج
          </button>
        </div>
      </motion.div>

      {/* Gamified Engagement Metrics Board */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center gap-4 text-right">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">نقاط المسابقات والتوقعات</span>
            <span className="text-lg font-black text-white">{contestsCount * 15} نقطة</span>
            <span className="text-[10px] text-gray-400 block font-medium">({contestsCount} مشاركات)</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center gap-4 text-right">
          <div className="p-3 bg-secondary/10 text-secondary rounded-xl shrink-0">
            <Radio size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">نقاط مشاهدة البث والقنوات</span>
            <span className="text-lg font-black text-white">{newsCount * 5} نقطة</span>
            <span className="text-[10px] text-gray-400 block font-medium">({newsCount} قنوات تم تشغيلها)</span>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center gap-4 text-right">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase">نقاط متابعة تفاصيل المباريات</span>
            <span className="text-lg font-black text-white">{matchesCount * 2} نقطة</span>
            <span className="text-[10px] text-gray-400 block font-medium">({matchesCount} مباريات مدققة)</span>
          </div>
        </div>
      </motion.div>

      {/* User Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Favorite Leagues */}
        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Trophy size={18} className="text-secondary" /> الدوريات المفضلة
            </h3>
            {saving && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {POPULAR_LEAGUE_CHOICES.map(league => {
              const isFav = profile?.favoriteLeagues?.includes(league.name);
              return (
                <button
                  key={league.id}
                  onClick={() => toggleFavorite('favoriteLeagues', league.name)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-right transition-all",
                    isFav 
                      ? "bg-secondary/10 border-secondary text-secondary" 
                      : "bg-surface border-border hover:border-gray-500"
                  )}
                >
                  <img src={league.logo || undefined} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold leading-tight flex-1">{league.name}</span>
                  {isFav && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Teams (Common ones for demo) */}
        <div className="glass p-6 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-primary" /> الأندية المفضلة
            </h3>
            {saving && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'ريال مدريد', logo: 'https://media.api-sports.io/football/teams/541.png' },
              { name: 'برشلونة', logo: 'https://media.api-sports.io/football/teams/529.png' },
              { name: 'الهلال', logo: 'https://media.api-sports.io/football/teams/2939.png' },
              { name: 'النصر', logo: 'https://media.api-sports.io/football/teams/2940.png' },
              { name: 'ليفربول', logo: 'https://media.api-sports.io/football/teams/40.png' },
              { name: 'مانشستر سيتي', logo: 'https://media.api-sports.io/football/teams/50.png' },
            ].map(team => {
              const isFav = profile?.favoriteTeams?.includes(team.name);
              return (
                <button
                  key={team.name}
                  onClick={() => toggleFavorite('favoriteTeams', team.name)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border text-right transition-all",
                    isFav 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-surface border-border hover:border-gray-500"
                  )}
                >
                  <img src={team.logo || undefined} alt="" className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-bold leading-tight flex-1">{team.name}</span>
                  {isFav && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass p-6 rounded-3xl space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Bell size={18} className="text-primary" /> التنبيهات
          </h3>
          <button 
            onClick={handleRegisterPush}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
              notificationToken ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border hover:neon-border"
            )}
          >
            <div className="text-right">
              <span className="text-sm font-bold block">{notificationToken ? 'التنبيهات مفعلة' : 'تفعيل تنبيهات المباريات المباشرة'}</span>
              <span className="text-[10px] text-gray-500">احصل على إشعارات فورية للأهداف وبطاقات الجزاء</span>
            </div>
            {notificationToken ? <Check size={18} /> : <Radio size={18} className="animate-pulse" />}
          </button>
        </div>
        
        <ThemeSettings />

        {/* Legal & Compliance Center */}
        <div className="md:col-span-2 glass p-6 rounded-3xl space-y-4">
          <h3 className="font-extrabold flex items-center gap-2 text-md text-slate-200">
            <HelpCircle size={18} className="text-primary" /> مركز المساعدة والسياسات القانونية والتنظيمية
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link 
              to="/about" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-secondary/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
                <Info size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">من نحن</span>
                <span className="text-[10px] text-gray-500">منصة صافرة 90 الرقمية</span>
              </div>
            </Link>

            <Link 
              to="/contact" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-primary/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Mail size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">اتصل بنا</span>
                <span className="text-[10px] text-gray-500">تواصل مباشر مع الدعم</span>
              </div>
            </Link>

            <Link 
              to="/privacy" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-emerald-500/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Shield size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">سياسة الخصوصية</span>
                <span className="text-[10px] text-gray-500">حماية سرية البيانات</span>
              </div>
            </Link>

            <Link 
              to="/cookies" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-amber-500/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                <Cookie size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">سياسة الكوكيز</span>
                <span className="text-[10px] text-gray-500">ملفات تعريف الارتباط</span>
              </div>
            </Link>

            <Link 
              to="/terms" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-blue-500/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                <FileText size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">الشروط والأحكام</span>
                <span className="text-[10px] text-gray-500">بنود اتفاقية الاستخدام</span>
              </div>
            </Link>

            <Link 
              to="/disclaimer" 
              className="flex items-center gap-3 p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-yellow-500/40 rounded-2xl transition-all"
            >
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
                <AlertTriangle size={18} />
              </div>
              <div className="text-right">
                <span className="text-xs font-black block text-gray-200">إخلاء المسؤولية</span>
                <span className="text-[10px] text-gray-500">إخلاء المسؤولية القانونية</span>
              </div>
            </Link>

            <Link 
              to="/advertising" 
              className="sm:col-span-3 flex items-center justify-between p-4 bg-surface hover:bg-white/[0.03] border border-border hover:border-rose-500/40 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                  <Megaphone size={18} />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black block text-gray-200">برنامج الناشرين والإعلانات الرقمية المعززة</span>
                  <span className="text-[10px] text-gray-500">تفاصيل الشركاء الإعلانيين والمساحات المتاحة لرعايات AdSense للطرف الثالث</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
        
        {isPlatformAdmin && (
          <Link 
            to="/admin" 
            className="md:col-span-2 bg-surface hover:neon-border border border-border p-6 rounded-3xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <Settings />
              </div>
              <div>
                <h4 className="font-bold">لوحة الإدارة PRO</h4>
                <p className="text-xs text-gray-500">إدارة المباريات والبث الأخبار</p>
              </div>
            </div>
            <div className="bg-primary text-black px-4 py-1.5 rounded-full text-xs font-black group-hover:scale-105 transition-transform">
              دخول الإدارة
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
