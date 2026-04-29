export type Locale = 'en' | 'ar' | 'fr' | 'es' | 'tr';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    properties: string;
    agents: string;
    favorites: string;
    admin: string;
    signIn: string;
    signOut: string;
  };
  // Hero
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    search: string;
    countries: string;
    propertiesCount: string;
    agentsCount: string;
    companiesCount: string;
    scroll: string;
    featuredProperties: string;
    featuredSubtitle: string;
    explore: string;
    exploreSubtitle: string;
  };
  // Property
  property: {
    featured: string;
    forSale: string;
    forRent: string;
    shortTerm: string;
    bedrooms: string;
    bathrooms: string;
    area: string;
    yearBuilt: string;
    floors: string;
    views: string;
    viewDetails: string;
    description: string;
    amenities: string;
    agentInfo: string;
    contactAgent: string;
    sendMessage: string;
    location: string;
    back: string;
    noProperties: string;
    sqm: string;
    perMonth: string;
    smartTools: string;
    listingAgent: string;
    ciarFeatures: string;
    recentProperties: string;
    recentPropertiesSubtitle: string;
    topDestinations: string;
    topDestinationsSubtitle: string;
    beds: string;
    baths: string;
  };
  // Property types
  propertyTypes: {
    apartment: string;
    villa: string;
    house: string;
    land: string;
    office: string;
    commercial: string;
    studio: string;
    penthouse: string;
    townhouse: string;
    duplex: string;
  };
  // Listing types
  listingTypes: {
    all: string;
    sale: string;
    rent: string;
    shortTerm: string;
  };
  // Search/Filters
  search: {
    title: string;
    allCountries: string;
    allCities: string;
    allTypes: string;
    allListingTypes: string;
    priceRange: string;
    minPrice: string;
    maxPrice: string;
    minBedrooms: string;
    minBathrooms: string;
    areaRange: string;
    minArea: string;
    maxArea: string;
    featuredOnly: string;
    applyFilters: string;
    resetFilters: string;
    filters: string;
    sort: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    showing: string;
    of: string;
    results: string;
    noResults: string;
    tryAdjusting: string;
    prev: string;
    next: string;
    any: string;
  };
  // Agents
  agents: {
    title: string;
    ourAgents: string;
    verified: string;
    experience: string;
    years: string;
    listings: string;
    sales: string;
    rating: string;
    viewProfile: string;
    contactInfo: string;
    company: string;
    license: string;
    bio: string;
    properties: string;
    noAgents: string;
  };
  // Favorites
  favorites: {
    title: string;
    myFavorites: string;
    noFavorites: string;
    signInToView: string;
    signInMessage: string;
    browseProperties: string;
    removed: string;
    added: string;
  };
  // Auth
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    demoAccounts: string;
    welcome: string;
    signOut: string;
    subtitle: string;
    registerSubtitle: string;
    createAccount: string;
  };
  // Admin
  admin: {
    dashboard: string;
    overview: string;
    properties: string;
    users: string;
    locations: string;
    inquiries: string;
    banners: string;
    settings: string;
    languages: string;
    content: string;
    totalProperties: string;
    totalUsers: string;
    totalAgents: string;
    totalInquiries: string;
    totalViews: string;
    recentInquiries: string;
    propertiesByType: string;
    actions: string;
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    confirmDelete: string;
    search: string;
    active: string;
    inactive: string;
    role: string;
    status: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    price: string;
    image: string;
    images: string;
    featured: string;
    new: string;
    read: string;
    replied: string;
    closed: string;
    accessDenied: string;
    accessDeniedMessage: string;
    manageCountries: string;
    manageRegions: string;
    manageCities: string;
    addCountry: string;
    addRegion: string;
    addCity: string;
    countryName: string;
    countryCode: string;
    flag: string;
    currency: string;
    regionName: string;
    cityName: string;
    parentCountry: string;
    parentRegion: string;
    noData: string;
    adminPortal: string;
    adminPortalSubtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    backToHome: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    viewAll: string;
    learnMore: string;
    getStarted: string;
    contact: string;
    or: string;
    and: string;
  };
  // Footer
  footer: {
    quickLinks: string;
    buyProperty: string;
    rentProperty: string;
    findAgents: string;
    topLocations: string;
    contactUs: string;
    privacy: string;
    terms: string;
    rights: string;
    newsletter: string;
    newsletterSubtitle: string;
    subscribe: string;
    emailPlaceholder: string;
    trustedBy: string;
    globalReach: string;
    premiumListings: string;
    securePayments: string;
    support247: string;
  };
  // How it works
  howItWorks: {
    title: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  // CTA
  cta: {
    title: string;
    subtitle: string;
    browseProperties: string;
    findAgents: string;
  };
  // Status
  status: {
    available: string;
    sold: string;
    rented: string;
    pending: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      home: 'Home',
      properties: 'Properties',
      agents: 'Agents',
      favorites: 'Favorites',
      admin: 'Admin',
      signIn: 'Sign In',
      signOut: 'Sign Out',
    },
    hero: {
      title: 'Find Your Dream Property',
      subtitle: 'Discover premium properties in over 60 countries worldwide',
      searchPlaceholder: 'Search properties...',
      search: 'Search',
      countries: 'Countries+',
      propertiesCount: 'Properties+',
      agentsCount: 'Agents+',
      companiesCount: 'Companies+',
      scroll: 'Scroll',
      featuredProperties: 'Featured Properties',
      featuredSubtitle: 'Handpicked premium properties for you',
      explore: 'Explore Property Types',
      exploreSubtitle: 'Explore diverse property categories to find exactly what you need',
    },
    property: {
      featured: 'Featured',
      forSale: 'For Sale',
      forRent: 'For Rent',
      shortTerm: 'Short Term',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      area: 'Area',
      yearBuilt: 'Year Built',
      floors: 'Floors',
      views: 'Views',
      viewDetails: 'View Details',
      description: 'Description',
      amenities: 'Amenities',
      agentInfo: 'Agent Info',
      contactAgent: 'Contact Agent',
      sendMessage: 'Send Message',
      location: 'Location',
      back: 'Back',
      noProperties: 'No properties found',
      sqm: 'sqm',
      perMonth: '/month',
      smartTools: 'CIAR Smart Tools',
      listingAgent: 'Listing Agent',
      ciarFeatures: 'CIAR Exclusive Features',
      recentProperties: 'Recent Properties',
      recentPropertiesSubtitle: 'Stay updated with the latest property listings',
      topDestinations: 'Top Destinations',
      topDestinationsSubtitle: 'Browse properties in the most popular destinations',
      beds: 'beds',
      baths: 'baths',
    },
    propertyTypes: {
      apartment: 'Apartment',
      villa: 'Villa',
      house: 'House',
      land: 'Land',
      office: 'Office',
      commercial: 'Commercial',
      studio: 'Studio',
      penthouse: 'Penthouse',
      townhouse: 'Townhouse',
      duplex: 'Duplex',
    },
    listingTypes: {
      all: 'All',
      sale: 'Sale',
      rent: 'Rent',
      shortTerm: 'Short Term',
    },
    search: {
      title: 'Advanced Search',
      allCountries: 'All Countries',
      allCities: 'All Cities',
      allTypes: 'All Types',
      allListingTypes: 'All Listing Types',
      priceRange: 'Price Range',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      minBedrooms: 'Min Bedrooms',
      minBathrooms: 'Min Bathrooms',
      areaRange: 'Area Range',
      minArea: 'Min Area',
      maxArea: 'Max Area',
      featuredOnly: 'Featured Only',
      applyFilters: 'Apply Filters',
      resetFilters: 'Reset Filters',
      filters: 'Filters',
      sort: 'Sort',
      sortNewest: 'Newest',
      sortPriceAsc: 'Price: Low to High',
      sortPriceDesc: 'Price: High to Low',
      showing: 'Showing',
      of: 'of',
      results: 'results',
      noResults: 'No results found',
      tryAdjusting: 'Try adjusting your search criteria',
      prev: 'Previous',
      next: 'Next',
      any: 'Any',
    },
    agents: {
      title: 'Agents',
      ourAgents: 'Our Agents',
      verified: 'Verified',
      experience: 'Experience',
      years: 'years',
      listings: 'Listings',
      sales: 'Sales',
      rating: 'Rating',
      viewProfile: 'View Profile',
      contactInfo: 'Contact Info',
      company: 'Company',
      license: 'License',
      bio: 'Bio',
      properties: 'Properties',
      noAgents: 'No agents found',
    },
    favorites: {
      title: 'Favorites',
      myFavorites: 'My Favorites',
      noFavorites: 'No favorites yet',
      signInToView: 'Sign In to View',
      signInMessage: 'You need to sign in to save properties to your favorites',
      browseProperties: 'Browse Properties',
      removed: 'Removed from favorites',
      added: 'Added to favorites',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Create Account',
      email: 'Email',
      password: 'Password',
      name: 'Full Name',
      phone: 'Phone',
      demoAccounts: 'Demo Accounts',
      welcome: 'Welcome',
      signOut: 'Sign Out',
      subtitle: 'Enter your email to access the platform',
      registerSubtitle: 'Create your account to get started',
      createAccount: 'Create Account',
    },
    admin: {
      dashboard: 'Dashboard',
      overview: 'Overview',
      properties: 'Properties',
      users: 'Users',
      locations: 'Locations',
      inquiries: 'Inquiries',
      banners: 'Banners',
      settings: 'Settings',
      languages: 'Languages',
      content: 'Content',
      totalProperties: 'Total Properties',
      totalUsers: 'Total Users',
      totalAgents: 'Total Agents',
      totalInquiries: 'Total Inquiries',
      totalViews: 'Total Views',
      recentInquiries: 'Recent Inquiries',
      propertiesByType: 'Properties by Type',
      actions: 'Actions',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      confirmDelete: 'Confirm Delete',
      search: 'Search',
      active: 'Active',
      inactive: 'Inactive',
      role: 'Role',
      status: 'Status',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      description: 'Description',
      price: 'Price',
      image: 'Image',
      images: 'Images',
      featured: 'Featured',
      new: 'New',
      read: 'Read',
      replied: 'Replied',
      closed: 'Closed',
      accessDenied: 'Access Denied',
      accessDeniedMessage: 'You need to sign in as an admin to access the dashboard',
      manageCountries: 'Manage Countries',
      manageRegions: 'Manage Regions',
      manageCities: 'Manage Cities',
      addCountry: 'Add Country',
      addRegion: 'Add Region',
      addCity: 'Add City',
      countryName: 'Country Name',
      countryCode: 'Country Code',
      flag: 'Flag',
      currency: 'Currency',
      regionName: 'Region Name',
      cityName: 'City Name',
      parentCountry: 'Parent Country',
      parentRegion: 'Parent Region',
      noData: 'No data',
      adminPortal: 'Admin Portal',
      adminPortalSubtitle: 'Access CIAR Administration',
      emailPlaceholder: 'admin@ciar.com',
      passwordPlaceholder: 'Enter your password',
      backToHome: 'Back to Home',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      viewAll: 'View All',
      learnMore: 'Learn More',
      getStarted: 'Get Started',
      contact: 'Contact',
      or: 'or',
      and: 'and',
    },
    footer: {
      quickLinks: 'Quick Links',
      buyProperty: 'Buy Property',
      rentProperty: 'Rent Property',
      findAgents: 'Find Agents',
      topLocations: 'Top Locations',
      contactUs: 'Contact Us',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      rights: 'All rights reserved',
      newsletter: 'Newsletter',
      newsletterSubtitle: 'Subscribe to get the latest updates',
      subscribe: 'Subscribe',
      emailPlaceholder: 'Enter your email',
      trustedBy: 'Trusted By',
      globalReach: 'Global Reach',
      premiumListings: 'Premium Listings',
      securePayments: 'Secure Payments',
      support247: '24/7 Support',
    },
    howItWorks: {
      title: 'How It Works',
      step1Title: 'Search',
      step1Desc: 'Browse thousands of properties with advanced search and filters',
      step2Title: 'Connect',
      step2Desc: 'Get in touch directly with verified real estate agents',
      step3Title: 'Settle',
      step3Desc: 'Find your ideal property and make it your new home',
    },
    cta: {
      title: 'Start Your Property Journey Today',
      subtitle: 'Join thousands of users who found their ideal property',
      browseProperties: 'Browse Properties',
      findAgents: 'Find Agents',
    },
    status: {
      available: 'Available',
      sold: 'Sold',
      rented: 'Rented',
      pending: 'Pending',
    },
  },

  ar: {
    nav: {
      home: 'الرئيسية',
      properties: 'العقارات',
      agents: 'الوكلاء',
      favorites: 'المفضلة',
      admin: 'لوحة التحكم',
      signIn: 'تسجيل الدخول',
      signOut: 'تسجيل الخروج',
    },
    hero: {
      title: 'اعثر على عقار أحلامك',
      subtitle: 'اكتشف عقارات متميزة في أكثر من 60 دولة حول العالم',
      searchPlaceholder: 'ابحث عن عقارات...',
      search: 'بحث',
      countries: 'دولة+',
      propertiesCount: 'عقار+',
      agentsCount: 'وكيل+',
      companiesCount: 'شركة+',
      scroll: 'تمرير',
      featuredProperties: 'عقارات مميزة',
      featuredSubtitle: 'عقارات متميزة مختارة بعناية لك',
      explore: 'استكشف أنواع العقارات',
      exploreSubtitle: 'استكشف فئات العقارات المتنوعة للعثور على ما تريده بالضبط',
    },
    property: {
      featured: 'مميز',
      forSale: 'للبيع',
      forRent: 'للإيجار',
      shortTerm: 'إيجار قصير',
      bedrooms: 'غرف النوم',
      bathrooms: 'الحمامات',
      area: 'المساحة',
      yearBuilt: 'سنة البناء',
      floors: 'الطوابق',
      views: 'مشاهدات',
      viewDetails: 'عرض التفاصيل',
      description: 'الوصف',
      amenities: 'المرافق',
      agentInfo: 'معلومات الوكيل',
      contactAgent: 'تواصل مع الوكيل',
      sendMessage: 'إرسال الرسالة',
      location: 'الموقع',
      back: 'رجوع',
      noProperties: 'لا توجد عقارات',
      sqm: 'م²',
      perMonth: '/شهر',
      smartTools: 'أدوات CIAR الذكية',
      listingAgent: 'وكيل الباقة',
      ciarFeatures: 'مميزات CIAR الحصرية',
      recentProperties: 'أحدث العقارات',
      recentPropertiesSubtitle: 'ابق على اطلاع بأحدث القوائم العقارية',
      topDestinations: 'أفضل الوجهات',
      topDestinationsSubtitle: 'تصفح العقارات في الوجهات الأكثر شعبية',
      beds: 'غرف نوم',
      baths: 'حمامات',
    },
    propertyTypes: {
      apartment: 'شقة',
      villa: 'فيلا',
      house: 'منزل',
      land: 'أرض',
      office: 'مكتب',
      commercial: 'تجاري',
      studio: 'استوديو',
      penthouse: 'بنتهاوس',
      townhouse: 'تاون هاوس',
      duplex: 'دوبلكس',
    },
    listingTypes: {
      all: 'الكل',
      sale: 'بيع',
      rent: 'إيجار',
      shortTerm: 'إيجار قصير',
    },
    search: {
      title: 'البحث المتقدم',
      allCountries: 'جميع الدول',
      allCities: 'جميع المدن',
      allTypes: 'جميع الأنواع',
      allListingTypes: 'جميع أنواع العروض',
      priceRange: 'نطاق السعر',
      minPrice: 'الحد الأدنى',
      maxPrice: 'الحد الأقصى',
      minBedrooms: 'الحد الأدنى للغرف',
      minBathrooms: 'الحد الأدنى للحمامات',
      areaRange: 'نطاق المساحة',
      minArea: 'الحد الأدنى',
      maxArea: 'الحد الأقصى',
      featuredOnly: 'المميزة فقط',
      applyFilters: 'تطبيق الفلاتر',
      resetFilters: 'إعادة تعيين',
      filters: 'الفلاتر',
      sort: 'ترتيب',
      sortNewest: 'الأحدث',
      sortPriceAsc: 'السعر: من الأقل',
      sortPriceDesc: 'السعر: من الأعلى',
      showing: 'عرض',
      of: 'من',
      results: 'نتيجة',
      noResults: 'لا توجد نتائج',
      tryAdjusting: 'حاول تعديل معايير البحث',
      prev: 'السابق',
      next: 'التالي',
      any: 'أي',
    },
    agents: {
      title: 'الوكلاء',
      ourAgents: 'وكلاؤنا',
      verified: 'موثق',
      experience: 'الخبرة',
      years: 'سنوات',
      listings: 'العقارات',
      sales: 'المبيعات',
      rating: 'التقييم',
      viewProfile: 'عرض الملف',
      contactInfo: 'معلومات التواصل',
      company: 'الشركة',
      license: 'الرخصة',
      bio: 'نبذة',
      properties: 'العقارات',
      noAgents: 'لا يوجد وكلاء',
    },
    favorites: {
      title: 'المفضلة',
      myFavorites: 'مفضلاتي',
      noFavorites: 'لا توجد مفضلات',
      signInToView: 'سجل دخولك لمشاهدة المفضلات',
      signInMessage: 'يجب عليك تسجيل الدخول لحفظ العقارات في مفضلاتك',
      browseProperties: 'تصفح العقارات',
      removed: 'تمت الإزالة من المفضلة',
      added: 'تمت الإضافة إلى المفضلة',
    },
    auth: {
      signIn: 'تسجيل الدخول',
      signUp: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم الكامل',
      phone: 'الهاتف',
      demoAccounts: 'حسابات تجريبية',
      welcome: 'مرحباً',
      signOut: 'تسجيل الخروج',
      subtitle: 'أدخل بريدك الإلكتروني للوصول إلى المنصة',
      registerSubtitle: 'أنشئ حسابك للبدء',
      createAccount: 'إنشاء حساب',
    },
    admin: {
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      properties: 'العقارات',
      users: 'المستخدمون',
      locations: 'المواقع',
      inquiries: 'الاستفسارات',
      banners: 'البانرات',
      settings: 'الإعدادات',
      languages: 'اللغات',
      content: 'المحتوى',
      totalProperties: 'إجمالي العقارات',
      totalUsers: 'إجمالي المستخدمين',
      totalAgents: 'إجمالي الوكلاء',
      totalInquiries: 'إجمالي الاستفسارات',
      totalViews: 'إجمالي المشاهدات',
      recentInquiries: 'أحدث الاستفسارات',
      propertiesByType: 'العقارات حسب النوع',
      actions: 'الإجراءات',
      add: 'إضافة',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      confirmDelete: 'تأكيد الحذف',
      search: 'بحث',
      active: 'نشط',
      inactive: 'غير نشط',
      role: 'الدور',
      status: 'الحالة',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      address: 'العنوان',
      description: 'الوصف',
      price: 'السعر',
      image: 'الصورة',
      images: 'الصور',
      featured: 'مميز',
      new: 'جديد',
      read: 'مقروء',
      replied: 'تم الرد',
      closed: 'مغلق',
      accessDenied: 'تم رفض الوصول',
      accessDeniedMessage: 'يجب عليك تسجيل الدخول كمسؤول للوصول إلى لوحة التحكم',
      manageCountries: 'إدارة الدول',
      manageRegions: 'إدارة المناطق',
      manageCities: 'إدارة المدن',
      addCountry: 'إضافة دولة',
      addRegion: 'إضافة منطقة',
      addCity: 'إضافة مدينة',
      countryName: 'اسم الدولة',
      countryCode: 'رمز الدولة',
      flag: 'العلم',
      currency: 'العملة',
      regionName: 'اسم المنطقة',
      cityName: 'اسم المدينة',
      parentCountry: 'الدولة الأم',
      parentRegion: 'المنطقة الأم',
      noData: 'لا توجد بيانات',
      adminPortal: 'بوابة الإدارة',
      adminPortalSubtitle: 'الوصول إلى إدارة CIAR',
      emailPlaceholder: 'admin@ciar.com',
      passwordPlaceholder: 'أدخل كلمة المرور',
      backToHome: 'العودة للرئيسية',
    },
    common: {
      loading: 'جار التحميل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      viewAll: 'عرض الكل',
      learnMore: 'اعرف المزيد',
      getStarted: 'ابدأ الآن',
      contact: 'تواصل',
      or: 'أو',
      and: 'و',
    },
    footer: {
      quickLinks: 'روابط سريعة',
      buyProperty: 'شراء عقار',
      rentProperty: 'إيجار عقار',
      findAgents: 'البحث عن وكلاء',
      topLocations: 'أفضل المواقع',
      contactUs: 'تواصل معنا',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الخدمة',
      rights: 'جميع الحقوق محفوظة',
      newsletter: 'النشرة الإخبارية',
      newsletterSubtitle: 'اشترك للحصول على أحدث التحديثات',
      subscribe: 'اشتراك',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      trustedBy: 'موثوق من قبل',
      globalReach: 'وصول عالمي',
      premiumListings: 'قوائم متميزة',
      securePayments: 'دفع آمن',
      support247: 'دعم على مدار الساعة',
    },
    howItWorks: {
      title: 'كيف تعمل المنصة',
      step1Title: 'ابحث',
      step1Desc: 'تصفح آلاف العقارات باستخدام البحث المتقدم والفلاتر',
      step2Title: 'تواصل',
      step2Desc: 'تواصل مباشرة مع وكلاء عقارات موثقين',
      step3Title: 'استقر',
      step3Desc: 'اعثر على عقارك المثالي واجعله بيتك الجديد',
    },
    cta: {
      title: 'ابدأ رحلتك العقارية اليوم',
      subtitle: 'انضم لآلاف المستخدمين الذين وجدوا عقارهم المثالي',
      browseProperties: 'تصفح العقارات',
      findAgents: 'البحث عن وكلاء',
    },
    status: {
      available: 'متاح',
      sold: 'مباع',
      rented: 'مؤجر',
      pending: 'قيد الانتظار',
    },
  },

  fr: {
    nav: {
      home: 'Accueil',
      properties: 'Propriétés',
      agents: 'Agents',
      favorites: 'Favoris',
      admin: 'Administration',
      signIn: 'Connexion',
      signOut: 'Déconnexion',
    },
    hero: {
      title: 'Trouvez votre propriété de rêve',
      subtitle: 'Découvrez des propriétés premium dans plus de 60 pays',
      searchPlaceholder: 'Rechercher des propriétés...',
      search: 'Rechercher',
      countries: 'Pays+',
      propertiesCount: 'Propriétés+',
      agentsCount: 'Agents+',
      companiesCount: 'Entreprises+',
      scroll: 'Défiler',
      featuredProperties: 'Propriétés en vedette',
      featuredSubtitle: 'Propriétés premium sélectionnées pour vous',
      explore: 'Explorer les types de biens',
      exploreSubtitle: 'Explorez diverses catégories de biens pour trouver exactement ce que vous cherchez',
    },
    property: {
      featured: 'En vedette',
      forSale: 'À vendre',
      forRent: 'À louer',
      shortTerm: 'Court terme',
      bedrooms: 'Chambres',
      bathrooms: 'Salles de bain',
      area: 'Surface',
      yearBuilt: 'Année',
      floors: 'Étages',
      views: 'Vues',
      viewDetails: 'Voir les détails',
      description: 'Description',
      amenities: 'Équipements',
      agentInfo: 'Info agent',
      contactAgent: 'Contacter l\'agent',
      sendMessage: 'Envoyer',
      location: 'Emplacement',
      back: 'Retour',
      noProperties: 'Aucune propriété',
      sqm: 'm²',
      perMonth: '/mois',
      smartTools: 'Outils intelligents CIAR',
      listingAgent: 'Agent annonceur',
      ciarFeatures: 'Fonctionnalités exclusives CIAR',
      recentProperties: 'Propriétés récentes',
      recentPropertiesSubtitle: 'Restez informé des dernières annonces immobilières',
      topDestinations: 'Top destinations',
      topDestinationsSubtitle: 'Parcourez les biens dans les destinations les plus populaires',
      beds: 'ch.',
      baths: 'SDB',
    },
    propertyTypes: {
      apartment: 'Appartement',
      villa: 'Villa',
      house: 'Maison',
      land: 'Terrain',
      office: 'Bureau',
      commercial: 'Commercial',
      studio: 'Studio',
      penthouse: 'Penthouse',
      townhouse: 'Maison de ville',
      duplex: 'Duplex',
    },
    listingTypes: {
      all: 'Tous',
      sale: 'Vente',
      rent: 'Location',
      shortTerm: 'Court terme',
    },
    search: {
      title: 'Recherche avancée',
      allCountries: 'Tous les pays',
      allCities: 'Toutes les villes',
      allTypes: 'Tous les types',
      allListingTypes: 'Tous les types',
      priceRange: 'Fourchette de prix',
      minPrice: 'Prix min',
      maxPrice: 'Prix max',
      minBedrooms: 'Chambres min',
      minBathrooms: 'SDB min',
      areaRange: 'Surface',
      minArea: 'Surface min',
      maxArea: 'Surface max',
      featuredOnly: 'En vedette',
      applyFilters: 'Appliquer',
      resetFilters: 'Réinitialiser',
      filters: 'Filtres',
      sort: 'Trier',
      sortNewest: 'Plus récent',
      sortPriceAsc: 'Prix croissant',
      sortPriceDesc: 'Prix décroissant',
      showing: 'Affichage',
      of: 'sur',
      results: 'résultats',
      noResults: 'Aucun résultat',
      tryAdjusting: 'Essayez de modifier vos critères',
      prev: 'Précédent',
      next: 'Suivant',
      any: 'Tous',
    },
    agents: {
      title: 'Agents',
      ourAgents: 'Nos agents',
      verified: 'Vérifié',
      experience: 'Expérience',
      years: 'ans',
      listings: 'Annonces',
      sales: 'Ventes',
      rating: 'Note',
      viewProfile: 'Voir profil',
      contactInfo: 'Coordonnées',
      company: 'Entreprise',
      license: 'Licence',
      bio: 'Biographie',
      properties: 'Propriétés',
      noAgents: 'Aucun agent',
    },
    favorites: {
      title: 'Favoris',
      myFavorites: 'Mes favoris',
      noFavorites: 'Aucun favori',
      signInToView: 'Connectez-vous',
      signInMessage: 'Connectez-vous pour sauvegarder vos propriétés favorites',
      browseProperties: 'Parcourir',
      removed: 'Retiré des favoris',
      added: 'Ajouté aux favoris',
    },
    auth: {
      signIn: 'Connexion',
      signUp: 'Créer un compte',
      email: 'E-mail',
      password: 'Mot de passe',
      name: 'Nom complet',
      phone: 'Téléphone',
      demoAccounts: 'Comptes démo',
      welcome: 'Bienvenue',
      signOut: 'Déconnexion',
      subtitle: 'Entrez votre e-mail pour accéder à la plateforme',
      registerSubtitle: 'Créez votre compte pour commencer',
      createAccount: 'Créer un compte',
    },
    admin: {
      dashboard: 'Tableau de bord',
      overview: 'Vue d\'ensemble',
      properties: 'Propriétés',
      users: 'Utilisateurs',
      locations: 'Localisations',
      inquiries: 'Demandes',
      banners: 'Bannières',
      settings: 'Paramètres',
      languages: 'Langues',
      content: 'Contenu',
      totalProperties: 'Total propriétés',
      totalUsers: 'Total utilisateurs',
      totalAgents: 'Total agents',
      totalInquiries: 'Total demandes',
      totalViews: 'Total vues',
      recentInquiries: 'Demandes récentes',
      propertiesByType: 'Par type',
      actions: 'Actions',
      add: 'Ajouter',
      edit: 'Modifier',
      delete: 'Supprimer',
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      confirmDelete: 'Confirmer la suppression',
      search: 'Rechercher',
      active: 'Actif',
      inactive: 'Inactif',
      role: 'Rôle',
      status: 'Statut',
      name: 'Nom',
      email: 'E-mail',
      phone: 'Téléphone',
      address: 'Adresse',
      description: 'Description',
      price: 'Prix',
      image: 'Image',
      images: 'Images',
      featured: 'En vedette',
      new: 'Nouveau',
      read: 'Lu',
      replied: 'Répondu',
      closed: 'Fermé',
      accessDenied: 'Accès refusé',
      accessDeniedMessage: 'Connectez-vous en tant qu\'administrateur',
      manageCountries: 'Gérer les pays',
      manageRegions: 'Gérer les régions',
      manageCities: 'Gérer les villes',
      addCountry: 'Ajouter un pays',
      addRegion: 'Ajouter une région',
      addCity: 'Ajouter une ville',
      countryName: 'Nom du pays',
      countryCode: 'Code pays',
      flag: 'Drapeau',
      currency: 'Devise',
      regionName: 'Nom de la région',
      cityName: 'Nom de la ville',
      parentCountry: 'Pays parent',
      parentRegion: 'Région parente',
      noData: 'Aucune donnée',
      adminPortal: 'Portail admin',
      adminPortalSubtitle: 'Accéder à l\'administration CIAR',
      emailPlaceholder: 'admin@ciar.com',
      passwordPlaceholder: 'Entrez votre mot de passe',
      backToHome: 'Retour à l\'accueil',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      retry: 'Réessayer',
      viewAll: 'Voir tout',
      learnMore: 'En savoir plus',
      getStarted: 'Commencer',
      contact: 'Contact',
      or: 'ou',
      and: 'et',
    },
    footer: {
      quickLinks: 'Liens rapides',
      buyProperty: 'Acheter',
      rentProperty: 'Louer',
      findAgents: 'Trouver un agent',
      topLocations: 'Top localisations',
      contactUs: 'Contactez-nous',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      rights: 'Tous droits réservés',
      newsletter: 'Newsletter',
      newsletterSubtitle: 'Abonnez-vous pour recevoir les dernières mises à jour',
      subscribe: 'S\'abonner',
      emailPlaceholder: 'Entrez votre e-mail',
      trustedBy: 'Approuvé par',
      globalReach: 'Portée mondiale',
      premiumListings: 'Annonces premium',
      securePayments: 'Paiements sécurisés',
      support247: 'Support 24/7',
    },
    howItWorks: {
      title: 'Comment ça marche',
      step1Title: 'Rechercher',
      step1Desc: 'Parcourez des milliers de propriétés avec des filtres avancés',
      step2Title: 'Contacter',
      step2Desc: 'Contactez directement des agents vérifiés',
      step3Title: 'Déménager',
      step3Desc: 'Trouvez votre propriété idéale et installez-vous',
    },
    cta: {
      title: 'Commencez votre recherche immobilière',
      subtitle: 'Rejoignez des milliers de personnes qui ont trouvé leur bien idéal',
      browseProperties: 'Parcourir',
      findAgents: 'Trouver des agents',
    },
    status: {
      available: 'Disponible',
      sold: 'Vendu',
      rented: 'Loué',
      pending: 'En attente',
    },
  },

  es: {
    nav: {
      home: 'Inicio',
      properties: 'Propiedades',
      agents: 'Agentes',
      favorites: 'Favoritos',
      admin: 'Admin',
      signIn: 'Iniciar sesión',
      signOut: 'Cerrar sesión',
    },
    hero: {
      title: 'Encuentra la propiedad de tus sueños',
      subtitle: 'Descubre propiedades premium en más de 60 países del mundo',
      searchPlaceholder: 'Buscar propiedades...',
      search: 'Buscar',
      countries: 'Países+',
      propertiesCount: 'Propiedades+',
      agentsCount: 'Agentes+',
      companiesCount: 'Empresas+',
      scroll: 'Desplazar',
      featuredProperties: 'Propiedades destacadas',
      featuredSubtitle: 'Propiedades premium seleccionadas para ti',
      explore: 'Explorar tipos de propiedades',
      exploreSubtitle: 'Explora diversas categorías de propiedades para encontrar exactamente lo que necesitas',
    },
    property: {
      featured: 'Destacado',
      forSale: 'En venta',
      forRent: 'En alquiler',
      shortTerm: 'Corto plazo',
      bedrooms: 'Habitaciones',
      bathrooms: 'Baños',
      area: 'Área',
      yearBuilt: 'Año',
      floors: 'Pisos',
      views: 'Vistas',
      viewDetails: 'Ver detalles',
      description: 'Descripción',
      amenities: 'Comodidades',
      agentInfo: 'Info del agente',
      contactAgent: 'Contactar agente',
      sendMessage: 'Enviar mensaje',
      location: 'Ubicación',
      back: 'Volver',
      noProperties: 'Sin propiedades',
      sqm: 'm²',
      perMonth: '/mes',
      smartTools: 'Herramientas inteligentes CIAR',
      listingAgent: 'Agente anunciante',
      ciarFeatures: 'Características exclusivas CIAR',
      recentProperties: 'Propiedades recientes',
      recentPropertiesSubtitle: 'Mantente actualizado con los últimos anuncios inmobiliarios',
      topDestinations: 'Destinos populares',
      topDestinationsSubtitle: 'Explora propiedades en los destinos más populares',
      beds: 'hab.',
      baths: 'baños',
    },
    propertyTypes: {
      apartment: 'Apartamento',
      villa: 'Villa',
      house: 'Casa',
      land: 'Terreno',
      office: 'Oficina',
      commercial: 'Comercial',
      studio: 'Estudio',
      penthouse: 'Penthouse',
      townhouse: 'Casa adosada',
      duplex: 'Dúplex',
    },
    listingTypes: {
      all: 'Todos',
      sale: 'Venta',
      rent: 'Alquiler',
      shortTerm: 'Corto plazo',
    },
    search: {
      title: 'Búsqueda avanzada',
      allCountries: 'Todos los países',
      allCities: 'Todas las ciudades',
      allTypes: 'Todos los tipos',
      allListingTypes: 'Todos los tipos de anuncio',
      priceRange: 'Rango de precio',
      minPrice: 'Precio mín',
      maxPrice: 'Precio máx',
      minBedrooms: 'Hab. mín',
      minBathrooms: 'Baños mín',
      areaRange: 'Rango de área',
      minArea: 'Área mín',
      maxArea: 'Área máx',
      featuredOnly: 'Solo destacados',
      applyFilters: 'Aplicar',
      resetFilters: 'Restablecer',
      filters: 'Filtros',
      sort: 'Ordenar',
      sortNewest: 'Más reciente',
      sortPriceAsc: 'Precio: menor',
      sortPriceDesc: 'Precio: mayor',
      showing: 'Mostrando',
      of: 'de',
      results: 'resultados',
      noResults: 'Sin resultados',
      tryAdjusting: 'Intenta ajustar los filtros',
      prev: 'Anterior',
      next: 'Siguiente',
      any: 'Cualquiera',
    },
    agents: {
      title: 'Agentes',
      ourAgents: 'Nuestros agentes',
      verified: 'Verificado',
      experience: 'Experiencia',
      years: 'años',
      listings: 'Anuncios',
      sales: 'Ventas',
      rating: 'Calificación',
      viewProfile: 'Ver perfil',
      contactInfo: 'Info de contacto',
      company: 'Empresa',
      license: 'Licencia',
      bio: 'Biografía',
      properties: 'Propiedades',
      noAgents: 'Sin agentes',
    },
    favorites: {
      title: 'Favoritos',
      myFavorites: 'Mis favoritos',
      noFavorites: 'Sin favoritos',
      signInToView: 'Inicia sesión',
      signInMessage: 'Inicia sesión para guardar propiedades en favoritos',
      browseProperties: 'Explorar',
      removed: 'Eliminado de favoritos',
      added: 'Añadido a favoritos',
    },
    auth: {
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      email: 'Correo',
      password: 'Contraseña',
      name: 'Nombre completo',
      phone: 'Teléfono',
      demoAccounts: 'Cuentas de prueba',
      welcome: 'Bienvenido',
      signOut: 'Cerrar sesión',
      subtitle: 'Ingresa tu correo para acceder a la plataforma',
      registerSubtitle: 'Crea tu cuenta para comenzar',
      createAccount: 'Crear cuenta',
    },
    admin: {
      dashboard: 'Panel de control',
      overview: 'Resumen',
      properties: 'Propiedades',
      users: 'Usuarios',
      locations: 'Ubicaciones',
      inquiries: 'Consultas',
      banners: 'Banners',
      settings: 'Ajustes',
      languages: 'Idiomas',
      content: 'Contenido',
      totalProperties: 'Total propiedades',
      totalUsers: 'Total usuarios',
      totalAgents: 'Total agentes',
      totalInquiries: 'Total consultas',
      totalViews: 'Total vistas',
      recentInquiries: 'Consultas recientes',
      propertiesByType: 'Por tipo',
      actions: 'Acciones',
      add: 'Añadir',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      confirmDelete: 'Confirmar eliminación',
      search: 'Buscar',
      active: 'Activo',
      inactive: 'Inactivo',
      role: 'Rol',
      status: 'Estado',
      name: 'Nombre',
      email: 'Correo',
      phone: 'Teléfono',
      address: 'Dirección',
      description: 'Descripción',
      price: 'Precio',
      image: 'Imagen',
      images: 'Imágenes',
      featured: 'Destacado',
      new: 'Nuevo',
      read: 'Leído',
      replied: 'Respondido',
      closed: 'Cerrado',
      accessDenied: 'Acceso denegado',
      accessDeniedMessage: 'Inicia sesión como administrador',
      manageCountries: 'Gestionar países',
      manageRegions: 'Gestionar regiones',
      manageCities: 'Gestionar ciudades',
      addCountry: 'Añadir país',
      addRegion: 'Añadir región',
      addCity: 'Añadir ciudad',
      countryName: 'Nombre del país',
      countryCode: 'Código del país',
      flag: 'Bandera',
      currency: 'Moneda',
      regionName: 'Nombre de la región',
      cityName: 'Nombre de la ciudad',
      parentCountry: 'País padre',
      parentRegion: 'Región padre',
      noData: 'Sin datos',
      adminPortal: 'Portal de administración',
      adminPortalSubtitle: 'Acceder a la administración de CIAR',
      emailPlaceholder: 'admin@ciar.com',
      passwordPlaceholder: 'Ingresa tu contraseña',
      backToHome: 'Volver al inicio',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      viewAll: 'Ver todo',
      learnMore: 'Más info',
      getStarted: 'Comenzar',
      contact: 'Contacto',
      or: 'o',
      and: 'y',
    },
    footer: {
      quickLinks: 'Enlaces rápidos',
      buyProperty: 'Comprar',
      rentProperty: 'Alquilar',
      findAgents: 'Buscar agentes',
      topLocations: 'Top ubicaciones',
      contactUs: 'Contáctenos',
      privacy: 'Privacidad',
      terms: 'Términos',
      rights: 'Todos los derechos reservados',
      newsletter: 'Boletín',
      newsletterSubtitle: 'Suscríbete para recibir las últimas novedades',
      subscribe: 'Suscribirse',
      emailPlaceholder: 'Ingresa tu correo',
      trustedBy: 'Confianza de',
      globalReach: 'Alcance global',
      premiumListings: 'Anuncios premium',
      securePayments: 'Pagos seguros',
      support247: 'Soporte 24/7',
    },
    howItWorks: {
      title: 'Cómo funciona',
      step1Title: 'Buscar',
      step1Desc: 'Explora miles de propiedades con filtros avanzados',
      step2Title: 'Contactar',
      step2Desc: 'Contacta directamente con agentes verificados',
      step3Title: 'Mudarse',
      step3Desc: 'Encuentra tu propiedad ideal y hazla tu hogar',
    },
    cta: {
      title: 'Comienza tu búsqueda inmobiliaria hoy',
      subtitle: 'Únete a miles de personas que encontraron su propiedad ideal',
      browseProperties: 'Explorar',
      findAgents: 'Buscar agentes',
    },
    status: {
      available: 'Disponible',
      sold: 'Vendido',
      rented: 'Alquilado',
      pending: 'Pendiente',
    },
  },

  tr: {
    nav: {
      home: 'Ana Sayfa',
      properties: 'Emlaklar',
      agents: 'Danışmanlar',
      favorites: 'Favoriler',
      admin: 'Yönetim',
      signIn: 'Giriş Yap',
      signOut: 'Çıkış',
    },
    hero: {
      title: 'Hayalinizdeki Emlağı Bulun',
      subtitle: '60\'tan fazla ülkede premium emlak keşfedin',
      searchPlaceholder: 'Emlak ara...',
      search: 'Ara',
      countries: 'Ülke+',
      propertiesCount: 'Emlak+',
      agentsCount: 'Danışman+',
      companiesCount: 'Şirket+',
      scroll: 'Kaydır',
      featuredProperties: 'Öne Çıkan Emlaklar',
      featuredSubtitle: 'Sizin için özenle seçilmiş premium emlaklar',
      explore: 'Emlak Türlerini Keşfet',
      exploreSubtitle: 'İhtiyacınız olanı bulmak için çeşitli emlak kategorilerini keşfedin',
    },
    property: {
      featured: 'Öne Çıkan',
      forSale: 'Satılık',
      forRent: 'Kiralık',
      shortTerm: 'Kısa Dönem',
      bedrooms: 'Yatak Odası',
      bathrooms: 'Banyo',
      area: 'Alan',
      yearBuilt: 'Yıl',
      floors: 'Kat',
      views: 'Görüntülenme',
      viewDetails: 'Detayları Gör',
      description: 'Açıklama',
      amenities: 'Olanaklar',
      agentInfo: 'Danışman Bilgisi',
      contactAgent: 'Danışmanla İletişim',
      sendMessage: 'Mesaj Gönder',
      location: 'Konum',
      back: 'Geri',
      noProperties: 'Emlak bulunamadı',
      sqm: 'm²',
      perMonth: '/ay',
      smartTools: 'CIAR Akıllı Araçlar',
      listingAgent: 'İlan Sahibi Danışman',
      ciarFeatures: 'CIAR Özel Özellikler',
      recentProperties: 'Son Emlaklar',
      recentPropertiesSubtitle: 'En son emlak ilanlarından haberdar olun',
      topDestinations: 'Popüler Destinasyonlar',
      topDestinationsSubtitle: 'En popüler destinasyonlardaki emlakları gezin',
      beds: 'oda',
      baths: 'banyo',
    },
    propertyTypes: {
      apartment: 'Daire',
      villa: 'Villa',
      house: 'Ev',
      land: 'Arsa',
      office: 'Ofis',
      commercial: 'Ticari',
      studio: 'Stüdyo',
      penthouse: 'Penthouse',
      townhouse: 'Sıra Ev',
      duplex: 'Dublex',
    },
    listingTypes: {
      all: 'Tümü',
      sale: 'Satış',
      rent: 'Kiralama',
      shortTerm: 'Kısa Dönem',
    },
    search: {
      title: 'Gelişmiş Arama',
      allCountries: 'Tüm Ülkeler',
      allCities: 'Tüm Şehirler',
      allTypes: 'Tüm Türler',
      allListingTypes: 'Tüm İlan Türleri',
      priceRange: 'Fiyat Aralığı',
      minPrice: 'Min Fiyat',
      maxPrice: 'Max Fiyat',
      minBedrooms: 'Min Yatak Odası',
      minBathrooms: 'Min Banyo',
      areaRange: 'Alan Aralığı',
      minArea: 'Min Alan',
      maxArea: 'Max Alan',
      featuredOnly: 'Sadece Öne Çıkanlar',
      applyFilters: 'Uygula',
      resetFilters: 'Sıfırla',
      filters: 'Filtreler',
      sort: 'Sırala',
      sortNewest: 'En Yeni',
      sortPriceAsc: 'Fiyat: Artan',
      sortPriceDesc: 'Fiyat: Azalan',
      showing: 'Gösterilen',
      of: '/',
      results: 'sonuç',
      noResults: 'Sonuç bulunamadı',
      tryAdjusting: 'Arama kriterlerinizi değiştirmeyi deneyin',
      prev: 'Önceki',
      next: 'Sonraki',
      any: 'Herhangi',
    },
    agents: {
      title: 'Danışmanlar',
      ourAgents: 'Danışmanlarımız',
      verified: 'Onaylı',
      experience: 'Deneyim',
      years: 'yıl',
      listings: 'İlan',
      sales: 'Satış',
      rating: 'Puan',
      viewProfile: 'Profili Gör',
      contactInfo: 'İletişim Bilgileri',
      company: 'Şirket',
      license: 'Lisans',
      bio: 'Hakkında',
      properties: 'Emlaklar',
      noAgents: 'Danışman bulunamadı',
    },
    favorites: {
      title: 'Favoriler',
      myFavorites: 'Favorilerim',
      noFavorites: 'Favori yok',
      signInToView: 'Giriş Yapın',
      signInMessage: 'Favori emlakları kaydetmek için giriş yapın',
      browseProperties: 'Emlakları Gör',
      removed: 'Favorilerden çıkarıldı',
      added: 'Favorilere eklendi',
    },
    auth: {
      signIn: 'Giriş Yap',
      signUp: 'Hesap Oluştur',
      email: 'E-posta',
      password: 'Şifre',
      name: 'Ad Soyad',
      phone: 'Telefon',
      demoAccounts: 'Demo Hesaplar',
      welcome: 'Hoş Geldiniz',
      signOut: 'Çıkış Yap',
      subtitle: 'Platforma erişmek için e-postanızı girin',
      registerSubtitle: 'Başlamak için hesabınızı oluşturun',
      createAccount: 'Hesap Oluştur',
    },
    admin: {
      dashboard: 'Yönetim Paneli',
      overview: 'Genel Bakış',
      properties: 'Emlaklar',
      users: 'Kullanıcılar',
      locations: 'Konumlar',
      inquiries: 'Sorular',
      banners: 'Bannerlar',
      settings: 'Ayarlar',
      languages: 'Diller',
      content: 'İçerik',
      totalProperties: 'Toplam Emlak',
      totalUsers: 'Toplam Kullanıcı',
      totalAgents: 'Toplam Danışman',
      totalInquiries: 'Toplam Soru',
      totalViews: 'Toplam Görüntülenme',
      recentInquiries: 'Son Sorular',
      propertiesByType: 'Türüne Göre',
      actions: 'İşlemler',
      add: 'Ekle',
      edit: 'Düzenle',
      delete: 'Sil',
      save: 'Kaydet',
      cancel: 'İptal',
      confirm: 'Onayla',
      confirmDelete: 'Silmeyi Onayla',
      search: 'Ara',
      active: 'Aktif',
      inactive: 'Pasif',
      role: 'Rol',
      status: 'Durum',
      name: 'Ad',
      email: 'E-posta',
      phone: 'Telefon',
      address: 'Adres',
      description: 'Açıklama',
      price: 'Fiyat',
      image: 'Görsel',
      images: 'Görseller',
      featured: 'Öne Çıkan',
      new: 'Yeni',
      read: 'Okundu',
      replied: 'Yanıtlandı',
      closed: 'Kapalı',
      accessDenied: 'Erişim Engellendi',
      accessDeniedMessage: 'Yönetim paneline erişmek için giriş yapın',
      manageCountries: 'Ülke Yönetimi',
      manageRegions: 'Bölge Yönetimi',
      manageCities: 'Şehir Yönetimi',
      addCountry: 'Ülke Ekle',
      addRegion: 'Bölge Ekle',
      addCity: 'Şehir Ekle',
      countryName: 'Ülke Adı',
      countryCode: 'Ülke Kodu',
      flag: 'Bayrak',
      currency: 'Para Birimi',
      regionName: 'Bölge Adı',
      cityName: 'Şehir Adı',
      parentCountry: 'Üst Ülke',
      parentRegion: 'Üst Bölge',
      noData: 'Veri yok',
      adminPortal: 'Yönetim Portalı',
      adminPortalSubtitle: 'CIAR Yönetimine Erişin',
      emailPlaceholder: 'admin@ciar.com',
      passwordPlaceholder: 'Şifrenizi girin',
      backToHome: 'Ana Sayfaya Dön',
    },
    common: {
      loading: 'Yükleniyor...',
      error: 'Hata',
      retry: 'Tekrar Dene',
      viewAll: 'Tümünü Gör',
      learnMore: 'Daha Fazla',
      getStarted: 'Başla',
      contact: 'İletişim',
      or: 'veya',
      and: 've',
    },
    footer: {
      quickLinks: 'Hızlı Bağlantılar',
      buyProperty: 'Satın Al',
      rentProperty: 'Kiralık',
      findAgents: 'Danışman Bul',
      topLocations: 'Popüler Konumlar',
      contactUs: 'Bize Ulaşın',
      privacy: 'Gizlilik',
      terms: 'Koşullar',
      rights: 'Tüm hakları saklıdır',
      newsletter: 'Bülten',
      newsletterSubtitle: 'Son güncellemeler için abone olun',
      subscribe: 'Abone Ol',
      emailPlaceholder: 'E-posta adresinizi girin',
      trustedBy: 'Güvenilir',
      globalReach: 'Küresel Erişim',
      premiumListings: 'Premium İlanlar',
      securePayments: 'Güvenli Ödeme',
      support247: '7/24 Destek',
    },
    howItWorks: {
      title: 'Nasıl Çalışır',
      step1Title: 'Ara',
      step1Desc: 'Gelişmiş filtrelerle binlerce emlakı keşfedin',
      step2Title: 'İletişim',
      step2Desc: 'Onaylı danışmanlarla doğrudan iletişime geçin',
      step3Title: 'Taşının',
      step3Desc: 'İdeal emlacınızı bulun ve yeni evinize taşının',
    },
    cta: {
      title: 'Emlak Arayışınıza Bugün Başlayın',
      subtitle: 'İdeal emlaklarını bulan binlerce kullanıcıya katılın',
      browseProperties: 'Emlakları Gör',
      findAgents: 'Danışman Bul',
    },
    status: {
      available: 'Müsait',
      sold: 'Satıldı',
      rented: 'Kiralık',
      pending: 'Beklemede',
    },
  },
};
