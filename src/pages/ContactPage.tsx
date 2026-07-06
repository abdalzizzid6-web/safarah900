import React, { useState } from 'react';
import SEO from '../components/SEO';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import * as contactRepository from '../features/contact/repositories/contactRepository';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      await contactRepository.submitContactMessage({
        name,
        email,
        subject: subject || 'بدون عنوان',
        message
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error saving contact message:', err);
      setError('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "اتصل بنا - منصة صافرة 90",
    "description": "تواصل مع فريق الدعم والإدارة لمنصة صافرة 90 لأي استفسارات، مقترحات، أو بلاغات.",
    "publisher": {
      "@type": "Organization",
      "name": "صافرة 90",
      "url": "https://korea90.xyz"
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20" dir="rtl">
      <SEO 
        title="اتصل بنا - تواصل مع فريق إدارة ودعم صافرة 90"
        description="لديك سؤال أو مقترح؟ يمكنك الاتصال بنا مباشرة من خلال نموذج المراسلة المخصص أو عبر قنوات الدعم الرسمية."
        schema={contactSchema}
      />

      <div className="container mx-auto px-4 pt-10">
        <Breadcrumbs 
          items={[
            { label: 'الرئيسية', path: '/' },
            { label: 'اتصل بنا' }
          ]}
        />

        <div className="max-w-5xl mx-auto mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface border border-border rounded-[32px] p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-xl font-black text-white">معلومات الدعم</h2>
                <p className="text-slate-400 text-xs mt-1">نسعد بالرد على استفساراتكم خلال فترات العمل الرسمية</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">البريد الإلكتروني</span>
                    <a href="mailto:support@korea90.xyz" className="text-sm font-bold text-white hover:text-primary transition-colors">support@korea90.xyz</a>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Phone className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">رقم الهاتف</span>
                    <span className="text-sm font-bold text-white" dir="ltr">+966 50 000 0000</span>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="text-blue-500 w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">المقر الرئيسي</span>
                    <span className="text-sm font-bold text-white">الرياض، المملكة العربية السعودية</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex gap-3 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 shrink-0 text-primary" />
                <p>هل تبحث عن إجابات سريعة؟ تصفح صفحة الأسئلة الشائعة (FAQ).</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-[32px] p-6 md:p-8">
              <h2 className="text-2xl font-black text-white mb-6">أرسل لنا رسالة</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {success && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-emerald-500 text-sm">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">تم إرسال رسالتك بنجاح!</p>
                      <p className="text-xs text-slate-400 mt-1">نشكرك على اهتمامك وسيقوم فريق الدعم بمراجعة رسالتك والرد عليك في أقرب وقت.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-red-500 text-sm animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-black text-slate-400">الاسم الكريم <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#121c2c] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-all"
                      placeholder="عبدالله محمد"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-xs font-black text-slate-400">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#121c2c] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-primary focus:outline-none transition-all"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-black text-slate-400">موضوع الرسالة</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#121c2c] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-all"
                    placeholder="استفسار عن مشاركة، رعاية، خدمات بريميوم"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label className="text-xs font-black text-slate-400">نص الرسالة <span className="text-red-500">*</span></label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full bg-[#121c2c] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:outline-none transition-all resize-none"
                    placeholder="اكتب رسالتك أو استفسارك هنا بالتفصيل..."
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full md:w-auto bg-primary text-black px-8 py-3.5 rounded-xl font-black text-sm hover:scale-102 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> جاري التقديم...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 translate-y-px" /> إرسال الرسالة الان
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
