import type { Locale } from '@/lib/i18n';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

type LegalLocale = 'ar' | 'en';

function resolveLegalLocale(locale: Locale): LegalLocale {
  return locale === 'ar' ? 'ar' : 'en';
}

const PRIVACY: Record<LegalLocale, LegalDocument> = {
  en: {
    title: 'Privacy Policy',
    subtitle: 'How CIAR collects, uses, and protects your personal information.',
    lastUpdated: 'July 8, 2026',
    sections: [
      {
        title: '1. Introduction',
        paragraphs: [
          'CIAR Real Estate ("CIAR", "we", "us") operates a global property marketplace. This Privacy Policy explains what information we collect when you use our website and services, how we use it, and the choices you have.',
          'By using CIAR, you agree to the practices described in this policy. If you do not agree, please discontinue use of our services.',
        ],
      },
      {
        title: '2. Information We Collect',
        paragraphs: [
          'Account information: name, email address, phone number, password (stored securely), profile photo, and role (buyer, agent, or company).',
          'Property and listing data: descriptions, photos, prices, locations, and inquiry messages you submit.',
          'Usage data: pages visited, searches, favorites, device type, browser, IP address, and approximate location derived from IP or your selected country.',
          'Payment-related data: billing details and transaction references when you purchase or subscribe. Card data is processed by secure payment providers and is not stored on our servers.',
          'Communications: messages sent through contact forms, inquiries, WhatsApp links, or support channels.',
        ],
      },
      {
        title: '3. How We Use Your Information',
        paragraphs: [
          'To provide and improve our marketplace, including search, listings, agent profiles, and favorites.',
          'To process registrations, logins, subscriptions, and checkout flows.',
          'To respond to inquiries and connect buyers with agents or companies.',
          'To send service-related notifications, security alerts, and—where permitted—marketing updates.',
          'To analyze usage, prevent fraud, enforce our Terms, and comply with legal obligations.',
        ],
      },
      {
        title: '4. Sharing of Information',
        paragraphs: [
          'We may share information with verified agents and companies when you inquire about a property or request contact.',
          'We use trusted service providers for hosting, analytics, email delivery, maps, and payments. They process data only on our instructions.',
          'We may disclose information when required by law, to protect rights and safety, or in connection with a business transfer.',
          'We do not sell your personal information to third parties for their independent marketing.',
        ],
      },
      {
        title: '5. Cookies & Similar Technologies',
        paragraphs: [
          'We use cookies and local storage to keep you signed in, remember preferences (such as language and currency), and understand how the site is used.',
          'You can control cookies through your browser settings. Disabling cookies may limit some features.',
        ],
      },
      {
        title: '6. Data Retention & Security',
        paragraphs: [
          'We retain personal data for as long as your account is active or as needed to provide services, resolve disputes, and meet legal requirements.',
          'We apply technical and organizational measures to protect data, including encryption in transit and access controls. No method of transmission over the Internet is 100% secure.',
        ],
      },
      {
        title: '7. Your Rights',
        paragraphs: [
          'Depending on your location, you may have the right to access, correct, delete, or export your personal data, and to object to or restrict certain processing.',
          'You may update account details from your profile or contact us at info@ciar.com or +963 993 153 333 to exercise your rights.',
        ],
      },
      {
        title: '8. International Transfers',
        paragraphs: [
          'CIAR serves users in many countries. Your information may be processed in jurisdictions other than your own, with appropriate safeguards where required.',
        ],
      },
      {
        title: '9. Children',
        paragraphs: [
          'Our services are not directed to children under 16. We do not knowingly collect personal information from children.',
        ],
      },
      {
        title: '10. Changes & Contact',
        paragraphs: [
          'We may update this policy from time to time. The "Last updated" date at the top will reflect changes. Continued use after updates constitutes acceptance.',
          'Questions about this Privacy Policy: info@ciar.com | +963 993 153 333 | Contact page on ciar.com.',
        ],
      },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    subtitle: 'كيف تجمع CIAR معلوماتك الشخصية وتستخدمها وتحميها.',
    lastUpdated: '8 يوليو 2026',
    sections: [
      {
        title: '1. مقدمة',
        paragraphs: [
          'تشغّل CIAR العقارية ("CIAR" أو "نحن") سوقاً عالمياً للعقارات. توضّح سياسة الخصوصية هذه المعلومات التي نجمعها عند استخدامك لموقعنا وخدماتنا، وكيف نستخدمها، والخيارات المتاحة لك.',
          'باستخدامك لـ CIAR، فإنك توافق على الممارسات الموضّحة في هذه السياسة. إذا لم توافق، يرجى التوقف عن استخدام خدماتنا.',
        ],
      },
      {
        title: '2. المعلومات التي نجمعها',
        paragraphs: [
          'معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، كلمة المرور (مخزّنة بشكل آمن)، صورة الملف الشخصي، والدور (مشتري، وكيل، أو شركة).',
          'بيانات العقارات والإعلانات: الأوصاف، الصور، الأسعار، المواقع، ورسائل الاستفسار التي ترسلها.',
          'بيانات الاستخدام: الصفحات التي تزورها، عمليات البحث، المفضلة، نوع الجهاز، المتصفح، عنوان IP، والموقع التقريبي المستنتج من IP أو الدولة المختارة.',
          'بيانات الدفع: تفاصيل الفوترة ومراجع المعاملات عند الشراء أو الاشتراك. تُعالَج بيانات البطاقات عبر مزوّدي دفع آمنين ولا تُخزَّن على خوادمنا.',
          'المراسلات: الرسائل المرسلة عبر نماذج التواصل، الاستفسارات، روابط واتساب، أو قنوات الدعم.',
        ],
      },
      {
        title: '3. كيف نستخدم معلوماتك',
        paragraphs: [
          'لتقديم وتحسين السوق، بما في ذلك البحث، الإعلانات، ملفات الوكلاء، والمفضلة.',
          'لمعالجة التسجيل، تسجيل الدخول، الاشتراكات، وعمليات الدفع.',
          'للرد على الاستفسارات وربط المشترين بالوكلاء أو الشركات.',
          'لإرسال إشعارات الخدمة، تنبيهات الأمان، و—حيث يُسمح—التحديثات التسويقية.',
          'لتحليل الاستخدام، منع الاحتيال، تطبيق الشروط، والامتثال للالتزامات القانونية.',
        ],
      },
      {
        title: '4. مشاركة المعلومات',
        paragraphs: [
          'قد نشارك المعلومات مع وكلاء وشركات موثّقة عند استفسارك عن عقار أو طلب التواصل.',
          'نستخدم مزوّدي خدمات موثوقين للاستضافة، التحليلات، البريد، الخرائط، والدفع. يعالجون البيانات وفق تعليماتنا فقط.',
          'قد نفصح عن المعلومات عند الطلب القانوني، لحماية الحقوق والسلامة، أو في إطار نقل أعمال.',
          'لا نبيع معلوماتك الشخصية لأطراف ثالثة لأغراض تسويقية مستقلة.',
        ],
      },
      {
        title: '5. ملفات تعريف الارتباط والتقنيات المشابهة',
        paragraphs: [
          'نستخدم ملفات تعريف الارتباط والتخزين المحلي لإبقائك مسجّل الدخول، وتذكّر التفضيلات (مثل اللغة والعملة)، وفهم استخدام الموقع.',
          'يمكنك التحكم في ملفات تعريف الارتباط من إعدادات المتصفح. تعطيلها قد يحدّ من بعض الميزات.',
        ],
      },
      {
        title: '6. الاحتفاظ بالبيانات والأمان',
        paragraphs: [
          'نحتفظ بالبيانات الشخصية طالما كان حسابك نشطاً أو حسب الحاجة لتقديم الخدمات وحل النزاعات والالتزامات القانونية.',
          'نطبّق إجراءات تقنية وتنظيمية لحماية البيانات، بما في ذلك التشفير أثناء النقل وضوابط الوصول. لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%.',
        ],
      },
      {
        title: '7. حقوقك',
        paragraphs: [
          'بحسب موقعك، قد يكون لك الحق في الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها أو تصديرها، والاعتراض على بعض المعالجة أو تقييدها.',
          'يمكنك تحديث بيانات الحساب من ملفك الشخصي أو التواصل معنا على info@ciar.com أو +963 993 153 333 لممارسة حقوقك.',
        ],
      },
      {
        title: '8. النقل الدولي',
        paragraphs: [
          'تخدم CIAR مستخدمين في دول عديدة. قد تُعالَج معلوماتك في ولايات قضائية غير ولايتك، مع الضمانات المناسبة حيثما يُطلب ذلك.',
        ],
      },
      {
        title: '9. الأطفال',
        paragraphs: [
          'خدماتنا غير موجّهة للأطفال دون 16 عاماً. لا نجمع عن قصد معلومات شخصية من الأطفال.',
        ],
      },
      {
        title: '10. التغييرات والتواصل',
        paragraphs: [
          'قد نحدّث هذه السياسة من وقت لآخر. يعكس تاريخ "آخر تحديث" في الأعلى أي تغيير. الاستمرار في الاستخدام بعد التحديث يعني القبول.',
          'للاستفسارات حول سياسة الخصوصية: info@ciar.com | +963 993 153 333 | صفحة تواصل معنا على ciar.com.',
        ],
      },
    ],
  },
};

const TERMS: Record<LegalLocale, LegalDocument> = {
  en: {
    title: 'Terms of Service',
    subtitle: 'Rules and conditions for using the CIAR real estate platform.',
    lastUpdated: 'July 8, 2026',
    sections: [
      {
        title: '1. Acceptance of Terms',
        paragraphs: [
          'These Terms of Service ("Terms") govern your access to and use of CIAR Real Estate websites, applications, and related services.',
          'By creating an account, browsing listings, or using any CIAR feature, you agree to these Terms and our Privacy Policy.',
        ],
      },
      {
        title: '2. Eligibility & Accounts',
        paragraphs: [
          'You must be at least 18 years old and legally able to enter into a binding agreement.',
          'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.',
          'You agree to provide accurate, current information and to update it when it changes.',
        ],
      },
      {
        title: '3. Platform Role',
        paragraphs: [
          'CIAR is a marketplace that connects buyers, renters, agents, and companies. Unless explicitly stated, CIAR is not a party to property transactions and does not guarantee the accuracy of third-party listings.',
          'Property details, prices, availability, and legal status are provided by listers and should be verified independently before any commitment.',
        ],
      },
      {
        title: '4. Listings & User Content',
        paragraphs: [
          'Agents and companies are responsible for the accuracy and legality of their listings, photos, and descriptions.',
          'You grant CIAR a non-exclusive license to display, promote, and distribute content you submit in connection with the service.',
          'We may remove content that violates these Terms, applicable law, or our community standards, without prior notice.',
        ],
      },
      {
        title: '5. Prohibited Conduct',
        paragraphs: [
          'You may not post false, misleading, or fraudulent listings; harass other users; scrape or automate access without permission; attempt to breach security; or use the platform for unlawful purposes.',
          'Unauthorized use of CIAR branding, data, or APIs is prohibited.',
        ],
      },
      {
        title: '6. Subscriptions & Payments',
        paragraphs: [
          'Partner subscriptions, featured listings, and checkout services may require payment. Fees, billing cycles, and renewal terms are shown at purchase.',
          'Unless otherwise stated, subscription fees are non-refundable except where required by law. You authorize us and our payment partners to charge your selected payment method.',
        ],
      },
      {
        title: '7. Intellectual Property',
        paragraphs: [
          'CIAR logos, design, software, and original content are owned by CIAR or its licensors and protected by intellectual property laws.',
          'You may not copy, modify, or redistribute platform materials without written permission.',
        ],
      },
      {
        title: '8. Disclaimers',
        paragraphs: [
          'The service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement.',
          'CIAR does not warrant uninterrupted or error-free operation.',
        ],
      },
      {
        title: '9. Limitation of Liability',
        paragraphs: [
          'To the fullest extent permitted by law, CIAR and its affiliates shall not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill arising from your use of the service.',
          'Our total liability for any claim relating to the service shall not exceed the amount you paid to CIAR in the twelve (12) months preceding the claim, or one hundred US dollars (USD 100), whichever is greater.',
        ],
      },
      {
        title: '10. Termination',
        paragraphs: [
          'You may close your account at any time. We may suspend or terminate access if you breach these Terms or if required for security or legal reasons.',
          'Provisions that by nature should survive termination (including liability limits and governing law) will remain in effect.',
        ],
      },
      {
        title: '11. Governing Law & Disputes',
        paragraphs: [
          'These Terms are governed by applicable laws in the jurisdiction where CIAR operates its principal services, without regard to conflict-of-law principles.',
          'Disputes should first be raised with our support team at info@ciar.com or +963 993 153 333.',
        ],
      },
      {
        title: '12. Changes',
        paragraphs: [
          'We may modify these Terms at any time. Material changes will be indicated by updating the "Last updated" date. Continued use after changes constitutes acceptance.',
        ],
      },
    ],
  },
  ar: {
    title: 'الشروط والأحكام',
    subtitle: 'قواعد وشروط استخدام منصة CIAR العقارية.',
    lastUpdated: '8 يوليو 2026',
    sections: [
      {
        title: '1. قبول الشروط',
        paragraphs: [
          'تحكم شروط الخدمة هذه ("الشروط") وصولك إلى واستخدامك لمواقع وتطبيقات وخدمات CIAR العقارية.',
          'بإنشاء حساب أو تصفح الإعلانات أو استخدام أي ميزة في CIAR، فإنك توافق على هذه الشروط وسياسة الخصوصية الخاصة بنا.',
        ],
      },
      {
        title: '2. الأهلية والحسابات',
        paragraphs: [
          'يجب أن يكون عمرك 18 عاماً على الأقل وأن تكون قادراً قانونياً على إبرام اتفاق ملزم.',
          'أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول وعن كل النشاط تحت حسابك.',
          'توافق على تقديم معلومات دقيقة ومحدّثة وتحديثها عند تغيّرها.',
        ],
      },
      {
        title: '3. دور المنصة',
        paragraphs: [
          'CIAR سوق يربط المشترين والمستأجرين والوكلاء والشركات. ما لم يُذكر صراحة، فإن CIAR ليست طرفاً في معاملات العقارات ولا تضمن دقة إعلانات الأطراف الثالثة.',
          'تفاصيل العقار والأسعار والتوافر والوضع القانوني يقدّمها المعلنون ويجب التحقق منها بشكل مستقل قبل أي التزام.',
        ],
      },
      {
        title: '4. الإعلانات ومحتوى المستخدم',
        paragraphs: [
          'الوكلاء والشركات مسؤولون عن دقة وقانونية إعلاناتهم وصورهم وأوصافهم.',
          'تمنح CIAR ترخيصاً غير حصري لعرض وترويج وتوزيع المحتوى الذي ترسله في إطار الخدمة.',
          'قد نزيل محتوى يخالف هذه الشروط أو القانون أو معايير المجتمع دون إشعار مسبق.',
        ],
      },
      {
        title: '5. السلوك المحظور',
        paragraphs: [
          'لا يجوز نشر إعلانات كاذبة أو مضللة أو احتيالية؛ أو مضايقة المستخدمين؛ أو استخراج البيانات آلياً دون إذن؛ أو محاولة اختراق الأمان؛ أو استخدام المنصة لأغراض غير قانونية.',
          'يُحظر الاستخدام غير المصرّح به لعلامة CIAR أو بياناتها أو واجهات برمجة التطبيقات.',
        ],
      },
      {
        title: '6. الاشتراكات والمدفوعات',
        paragraphs: [
          'اشتراكات الشركاء والإعلانات المميزة وخدمات الدفع قد تتطلب رسوماً. تُعرض الرسوم ودورات الفوترة وشروط التجديد عند الشراء.',
          'ما لم يُنص على خلاف ذلك، رسوم الاشتراك غير قابلة للاسترداد إلا حيث يفرض القانون ذلك. تفوّضنا وشركاء الدفع بخصم وسيلة الدفع المختارة.',
        ],
      },
      {
        title: '7. الملكية الفكرية',
        paragraphs: [
          'شعارات CIAR وتصميمها وبرمجياتها ومحتواها الأصلي مملوكة لـ CIAR أو مرخّصيها ومحمية بقوانين الملكية الفكرية.',
          'لا يجوز نسخ أو تعديل أو إعادة توزيع مواد المنصة دون إذن كتابي.',
        ],
      },
      {
        title: '8. إخلاء المسؤولية',
        paragraphs: [
          'تُقدَّم الخدمة "كما هي" و"حسب التوفر" دون ضمانات من أي نوع، صريحة أو ضمنية، بما في ذلك الملاءمة لغرض معين أو عدم الانتهاك.',
          'لا تضمن CIAR تشغيلاً دون انقطاع أو خالٍ من الأخطاء.',
        ],
      },
      {
        title: '9. تحديد المسؤولية',
        paragraphs: [
          'في الحد الأقصى الذي يسمح به القانون، لا تتحمل CIAR وشركاتها التابعة مسؤولية الأضرار غير المباشرة أو العرضية أو الخاصة أو التبعية أو العقابية، أو فقدان الأرباح أو البيانات أو السمعة الناتج عن استخدامك للخدمة.',
          'لا تتجاوز مسؤوليتنا الإجمالية عن أي مطالبة متعلقة بالخدمة المبلغ الذي دفعته لـ CIAR خلال الاثني عشر (12) شهراً السابقة للمطالبة، أو مائة دولار أمريكي (100 USD)، أيهما أكبر.',
        ],
      },
      {
        title: '10. الإنهاء',
        paragraphs: [
          'يمكنك إغلاق حسابك في أي وقت. قد نعلّق أو ننهي الوصول عند مخالفة هذه الشروط أو لأسباب أمنية أو قانونية.',
          'تبقى أحكام من طبيعتها الاستمرار بعد الإنهاء (بما في ذلك حدود المسؤولية والقانون الحاكم) سارية.',
        ],
      },
      {
        title: '11. القانون الحاكم والنزاعات',
        paragraphs: [
          'تخضع هذه الشروط للقوانين المعمول بها في الولاية القضائية التي تدير فيها CIAR خدماتها الرئيسية، دون مراعاة تعارض القوانين.',
          'يجب رفع النزاعات أولاً لفريق الدعم على info@ciar.com أو +963 993 153 333.',
        ],
      },
      {
        title: '12. التغييرات',
        paragraphs: [
          'قد نعدّل هذه الشروط في أي وقت. تُبيَّن التغييرات الجوهرية بتحديث تاريخ "آخر تحديث". الاستمرار في الاستخدام بعد التغيير يعني القبول.',
        ],
      },
    ],
  },
};

export function getPrivacyPolicy(locale: Locale): LegalDocument {
  return PRIVACY[resolveLegalLocale(locale)];
}

export function getTermsOfService(locale: Locale): LegalDocument {
  return TERMS[resolveLegalLocale(locale)];
}
