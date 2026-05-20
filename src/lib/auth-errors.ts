/** Map API auth/register error codes to localized UI strings. */
export function mapAuthApiError(
  message: string | undefined,
  tx: (ar: string, en: string) => string,
  fallbackAr: string,
  fallbackEn: string,
): string {
  if (!message) return tx(fallbackAr, fallbackEn);

  const normalized = message.trim();
  const table: Record<string, [string, string]> = {
    'Invalid credentials': ['البريد أو كلمة المرور غير صحيحة', 'Invalid email or password'],
    'A valid email is required': ['أدخل بريدًا إلكترونيًا صحيحًا', 'Enter a valid email address'],
    'Password is required': ['كلمة المرور مطلوبة', 'Password is required'],
    'Account is deactivated': ['الحساب معطّل', 'This account is deactivated'],
    'This account has no password set': [
      'لا توجد كلمة مرور لهذا الحساب',
      'This account has no password set',
    ],
    'Login failed': [
      'تعذّر تسجيل الدخول. تحقق من إعدادات الخادم أو حاول لاحقًا.',
      'Sign-in failed. Check server configuration or try again later.',
    ],
    'Registration failed': [
      'تعذّر إنشاء الحساب. حاول مرة أخرى.',
      'Registration failed. Please try again.',
    ],
    'An account with this email already exists': [
      'يوجد حساب بهذا البريد مسبقًا',
      'An account with this email already exists',
    ],
    'Password must be at least 6 characters': [
      'كلمة المرور قصيرة (6 أحرف على الأقل)',
      'Password must be at least 6 characters',
    ],
    'Name is required': ['الاسم مطلوب', 'Name is required'],
    'Company name is required': ['اسم الشركة مطلوب', 'Company name is required'],
    'Too many login attempts. Please try again later.': [
      'محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
      'Too many login attempts. Please try again later.',
    ],
    'Too many registration attempts. Please try again later.': [
      'محاولات تسجيل كثيرة. انتظر قليلًا ثم حاول مجددًا.',
      'Too many registration attempts. Please try again later.',
    ],
    'FIREBASE_SERVICE_ACCOUNT_JSON is not set': [
      'خدمة قاعدة البيانات غير مهيأة على Vercel — راجع متغيرات البيئة',
      'Database is not configured on the server — check Vercel environment variables',
    ],
    'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON': [
      'مفتاح Firebase على Vercel غير صحيح (JSON تالف)',
      'Firebase key on Vercel is invalid (malformed JSON)',
    ],
  };

  const mapped = table[normalized];
  if (mapped) return tx(mapped[0], mapped[1]);

  if (
    normalized === 'firebase_quota_exceeded' ||
    normalized.includes('Quota exceeded') ||
    normalized.includes('RESOURCE_EXHAUSTED')
  ) {
    return tx(
      'تم تجاوز حصة Firebase اليومية. انتظر إعادة التعيين أو رقِّ الخطة في Firebase Console. يمكنك استخدام حساب الأدمن التجريبي أثناء انقطاع قاعدة البيانات.',
      'Firebase daily quota was exceeded. Wait for reset or upgrade your plan in Firebase Console. Use the demo admin account while the database is unavailable.',
    );
  }

  if (
    normalized.includes('FIREBASE') ||
    normalized.includes('Firebase service account')
  ) {
    return tx(
      'خدمة قاعدة البيانات غير مهيأة على الخادم',
      'Database service is not configured on the server',
    );
  }

  return normalized;
}
