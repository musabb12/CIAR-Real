/**
 * Seeds sample documents into Firestore collection `properties` (or FIRESTORE_PROPERTIES_COLLECTION).
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat serviceAccount.json)" node scripts/seed-firestore-properties.cjs
 */
const admin = require('firebase-admin');

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw || !raw.trim()) {
  console.error('Set FIREBASE_SERVICE_ACCOUNT_JSON to the full JSON of a Firebase service account.');
  process.exit(1);
}

const cred = JSON.parse(raw);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: cred.project_id,
      clientEmail: cred.client_email,
      privateKey: cred.private_key.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const collection = process.env.FIRESTORE_PROPERTIES_COLLECTION?.trim() || 'properties';

const now = admin.firestore.Timestamp.now();

const samples = [
  {
    id: 'ciar-demo-riyadh-1',
    data: {
      title: 'فيلا فاخرة — الرياض',
      slug: 'villa-riyadh-demo-1',
      description: 'فيلا واسعة مع مسبح وحديقة، مناسبة للعائلة.',
      price: 2850000,
      listingType: 'SALE',
      propertyType: 'VILLA',
      status: 'AVAILABLE',
      area: 420,
      bedrooms: 5,
      bathrooms: 4,
      floors: 2,
      yearBuilt: 2022,
      isFeatured: true,
      views: 1200,
      countryId: 'sa',
      regionId: 'sa-riyadh',
      cityId: 'sa-riyadh-capital',
      countryName: 'السعودية',
      countryCode: 'SA',
      currencySymbol: 'ر.س',
      regionName: 'منطقة الرياض',
      cityName: 'الرياض',
      address: 'حي الملقا، الرياض',
      latitude: 24.8,
      longitude: 46.6,
      agentId: null,
      createdAt: now,
      updatedAt: now,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
          alt: 'Villa exterior',
          isCover: true,
          order: 0,
        },
      ],
    },
  },
  {
    id: 'ciar-demo-dubai-2',
    data: {
      title: 'شقة بانوراما — دبي مارينا',
      slug: 'apartment-dubai-demo-2',
      description: 'إطلالة بحرية، أدوات مطبخ فاخرة، جاهزة للسكن.',
      price: 1850000,
      listingType: 'SALE',
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      area: 110,
      bedrooms: 2,
      bathrooms: 2,
      floors: 42,
      yearBuilt: 2021,
      isFeatured: true,
      views: 3400,
      countryId: 'ae',
      regionId: 'ae-dubai',
      cityId: 'ae-dubai-marina',
      countryName: 'الإمارات',
      countryCode: 'AE',
      currencySymbol: 'د.إ',
      regionName: 'دبي',
      cityName: 'دبي مارينا',
      address: 'Dubai Marina',
      latitude: 25.08,
      longitude: 55.14,
      agentId: null,
      createdAt: now,
      updatedAt: now,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
          alt: 'Apartment view',
          isCover: true,
          order: 0,
        },
      ],
    },
  },
  {
    id: 'ciar-demo-cairo-3',
    data: {
      title: 'شقة للإيجار — القاهرة الجديدة',
      slug: 'rent-cairo-demo-3',
      description: 'شقة مفروشة بالكامل، قريبة من الخدمات.',
      price: 12000,
      listingType: 'RENT',
      propertyType: 'APARTMENT',
      status: 'AVAILABLE',
      area: 95,
      bedrooms: 3,
      bathrooms: 2,
      floors: 8,
      yearBuilt: 2019,
      isFeatured: true,
      views: 890,
      countryId: 'eg',
      regionId: 'eg-cairo',
      cityId: 'eg-new-cairo',
      countryName: 'مصر',
      countryCode: 'EG',
      currencySymbol: 'ج.م',
      regionName: 'القاهرة',
      cityName: 'القاهرة الجديدة',
      address: 'التجمع الخامس',
      latitude: 30.03,
      longitude: 31.47,
      agentId: null,
      createdAt: now,
      updatedAt: now,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
          alt: 'Living room',
          isCover: true,
          order: 0,
        },
      ],
    },
  },
];

async function main() {
  const batch = db.batch();
  for (const { id, data } of samples) {
    const ref = db.collection(collection).doc(id);
    batch.set(ref, data);
  }
  await batch.commit();
  console.log(`Wrote ${samples.length} documents to Firestore collection "${collection}".`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
