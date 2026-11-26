import { create } from 'zustand';

export type Lang = 'en' | 'ar';

// Semantic keys (not English sentences) so Arabic is written naturally, not word-for-word.
// To add a screen: add keys here, then call t('key') in the component. Missing Arabic falls back to English.
const dict: Record<Lang, Record<string, string>> = {
  en: {
    'app.name': 'Tashgheel Clinics',
    'lang.switch': 'العربية',
    'nav.dashboard': 'Dashboard', 'nav.patients': 'Patients', 'nav.appointments': 'Appointments', 'nav.calendar': 'Calendar',
    'nav.reports': 'Reports', 'nav.doctors': 'Doctors', 'nav.schedule': 'Schedule', 'nav.stockBalance': 'Stock Balance',
    'nav.finance': 'Finance', 'nav.products': 'Products', 'nav.vendors': 'Vendors', 'nav.specialties': 'Specialties', 'nav.settings': 'Settings',
    'nav.signOut': 'Sign Out', 'nav.superAdmin': 'Super Admin Portal',
    'title.dashboard': 'Dashboard', 'title.patients': 'Patients', 'title.newPatient': 'New Patient', 'title.appointments': 'Appointments',
    'title.calendar': 'Calendar', 'title.doctors': 'Doctors', 'title.schedule': 'Doctor Schedule', 'title.specialties': 'Specialties & Services',
    'title.reports': 'Reports', 'title.finance': 'Finance & Accounting', 'title.stockBalance': 'Stock Balance', 'title.products': 'Products',
    'title.vendors': 'Vendors', 'title.settings': 'Clinic Settings',
    'top.trial': '14-Day Free Trial (Pro Features)', 'top.search': 'Quick search...',
    'login.title': 'Sign in to your account', 'login.email': 'Email', 'login.password': 'Password', 'login.submit': 'Sign in',
    'login.submitting': 'Signing in...', 'login.forgot': 'Forgot password?',
    'login.forgotHelp': 'Ask your clinic administrator to reset your password from Settings > System Users. If you are the clinic owner, contact Tashgheel support.',
    'login.noAccount': 'New clinic?', 'login.register': 'Start your free trial',
    'reg.title': 'Create Clinic Account', 'reg.subtitle': 'Launch your clinic on Tashgheel SaaS with a 14-day free trial',
    'reg.clinicName': 'Clinic Name', 'reg.slug': 'Clinic Slug (Subdomain identifier)', 'reg.adminDetails': 'Admin Account Details',
    'reg.ownerName': 'Doctor / Owner Full Name', 'reg.email': 'Email Address', 'reg.password': 'Password (min 8 characters)',
    'reg.submit': 'Register Clinic & Start Free Trial', 'reg.haveAccount': 'Already have a clinic account?', 'reg.signIn': 'Sign In',
    'dash.totalPatients': 'Total Patients', 'dash.activePatients': 'Active patients', 'dash.todayAppts': "Today's Appointments",
    'dash.todayRevenue': "Today's Revenue", 'dash.paymentsToday': 'Payments received today', 'dash.activeDoctors': 'Active Doctors',
    'dash.onStaff': 'Currently on staff', 'dash.viewAll': 'View all', 'dash.noAppts': 'No appointments today', 'dash.breakdown': "Today's Breakdown",
    'dash.revenue': 'Revenue',
    'status.Pending': 'Pending', 'status.Confirmed': 'Confirmed', 'status.Done': 'Done', 'status.Cancelled': 'Cancelled',
    'common.save': 'Save', 'common.cancel': 'Cancel', 'common.search': 'Search', 'common.actions': 'Actions',
    'users.title': 'System Users', 'users.resetPassword': 'Reset password', 'users.newPassword': 'New password (min 8 characters)',
    'users.resetDone': 'Password reset. Share the new password with the user.', 'users.reset': 'Reset',
    'patients.title': 'Patients', 'patients.new': 'New Patient',
    'appts.title': 'Appointments', 'appts.subtitle': 'Manage and schedule patient visits', 'appts.new': 'New Appointment',
    'appts.copyLink': 'Copy Online Booking Link',
  },
  ar: {
    'app.name': 'تشغيل كلينكس',
    'lang.switch': 'English',
    'nav.dashboard': 'لوحة التحكم', 'nav.patients': 'المرضى', 'nav.appointments': 'المواعيد', 'nav.calendar': 'التقويم',
    'nav.reports': 'التقارير', 'nav.doctors': 'الأطباء', 'nav.schedule': 'جداول الأطباء', 'nav.stockBalance': 'رصيد المخزون',
    'nav.finance': 'الحسابات', 'nav.products': 'المنتجات', 'nav.vendors': 'الموردين', 'nav.specialties': 'التخصصات', 'nav.settings': 'الإعدادات',
    'nav.signOut': 'تسجيل الخروج', 'nav.superAdmin': 'لوحة إدارة المنصة',
    'title.dashboard': 'لوحة التحكم', 'title.patients': 'المرضى', 'title.newPatient': 'مريض جديد', 'title.appointments': 'المواعيد',
    'title.calendar': 'التقويم', 'title.doctors': 'الأطباء', 'title.schedule': 'جداول الأطباء', 'title.specialties': 'التخصصات والخدمات',
    'title.reports': 'التقارير', 'title.finance': 'الحسابات والمالية', 'title.stockBalance': 'رصيد المخزون', 'title.products': 'المنتجات',
    'title.vendors': 'الموردين', 'title.settings': 'إعدادات العيادة',
    'top.trial': 'تجربة مجانية 14 يوم (كل المميزات)', 'top.search': 'بحث سريع...',
    'login.title': 'سجّل دخولك', 'login.email': 'البريد الإلكتروني', 'login.password': 'كلمة السر', 'login.submit': 'دخول',
    'login.submitting': 'جاري الدخول...', 'login.forgot': 'نسيت كلمة السر؟',
    'login.forgotHelp': 'اطلب من مدير العيادة يغيّر كلمة السر من الإعدادات > مستخدمي النظام. لو حضرتك صاحب العيادة، كلّم دعم تشغيل.',
    'login.noAccount': 'عيادة جديدة؟', 'login.register': 'ابدأ التجربة المجانية',
    'reg.title': 'إنشاء حساب عيادة', 'reg.subtitle': 'ابدأ عيادتك على تشغيل بتجربة مجانية 14 يوم',
    'reg.clinicName': 'اسم العيادة', 'reg.slug': 'رابط العيادة (بالإنجليزي)', 'reg.adminDetails': 'بيانات مدير الحساب',
    'reg.ownerName': 'اسم الدكتور / صاحب العيادة', 'reg.email': 'البريد الإلكتروني', 'reg.password': 'كلمة السر (8 حروف على الأقل)',
    'reg.submit': 'سجّل العيادة وابدأ التجربة', 'reg.haveAccount': 'عندك حساب بالفعل؟', 'reg.signIn': 'تسجيل الدخول',
    'dash.totalPatients': 'إجمالي المرضى', 'dash.activePatients': 'مرضى نشطين', 'dash.todayAppts': 'مواعيد النهارده',
    'dash.todayRevenue': 'إيراد النهارده', 'dash.paymentsToday': 'المدفوعات المستلمة النهارده', 'dash.activeDoctors': 'الأطباء',
    'dash.onStaff': 'على قوة العمل', 'dash.viewAll': 'عرض الكل', 'dash.noAppts': 'مفيش مواعيد النهارده', 'dash.breakdown': 'ملخص النهارده',
    'dash.revenue': 'الإيراد',
    'status.Pending': 'منتظر', 'status.Confirmed': 'مؤكد', 'status.Done': 'تم', 'status.Cancelled': 'ملغي',
    'common.save': 'حفظ', 'common.cancel': 'إلغاء', 'common.search': 'بحث', 'common.actions': 'إجراءات',
    'users.title': 'مستخدمي النظام', 'users.resetPassword': 'تغيير كلمة السر', 'users.newPassword': 'كلمة السر الجديدة (8 حروف على الأقل)',
    'users.resetDone': 'تم تغيير كلمة السر. ابعتها للمستخدم.', 'users.reset': 'تغيير',
    'patients.title': 'المرضى', 'patients.new': 'مريض جديد',
    'appts.title': 'المواعيد', 'appts.subtitle': 'إدارة وجدولة زيارات المرضى', 'appts.new': 'موعد جديد',
    'appts.copyLink': 'نسخ رابط الحجز أونلاين',
  },
};

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) as Lang | null;

function apply(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

interface LangState { lang: Lang; setLang: (l: Lang) => void; }
export const useLang = create<LangState>((set) => ({
  lang: stored === 'ar' ? 'ar' : 'en',
  setLang: (lang) => { localStorage.setItem('lang', lang); apply(lang); set({ lang }); window.location.reload(); },
}));
apply(useLang.getState().lang);

export function useT() {
  const lang = useLang((s) => s.lang);
  return (key: string) => dict[lang][key] ?? dict.en[key] ?? key;
}
