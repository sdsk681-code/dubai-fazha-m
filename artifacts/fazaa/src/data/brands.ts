/**
 * Single source of truth for all brands and card types.
 * Card images live in public/cards/<brand>/<type>.png
 *  - fazaa: real card images (illustrative examples)
 *  - other brands: original generated artwork (no official logos/cards)
 */

const cardImg = (brand: BrandKey, type: CardTypeKey) => `/cards/${brand}/${type}.png`;

export type CardTypeKey = 'gold' | 'silver' | 'discount';
export type BrandKey = 'fazaa' | 'esaad' | 'homat' | 'alsaada' | 'absher';

export interface CardData {
  id: CardTypeKey;
  /** used in sentences: "بطاقة فزعة الذهبية" */
  name: string;
  /** card title on the cards page: "البطاقة الذهبية" */
  displayName: string;
  nameEn: string;
  description: string;
  image: string;
  badge?: string;
  price: string;
  benefits: string[];
}

export interface BrandData {
  key: BrandKey;
  name: string;
  nameEn: string;
  color: string;
  darkColor: string;
  description: string;
  eligibility: string[];
  cards: CardData[];
}

/* shared card-type scaffolding so every brand has: gold, silver, discount */
function cardTypes(brand: BrandKey, storeName: string): CardData[] {
  return [
    {
      id: 'gold',
      name: 'الذهبية',
      displayName: 'البطاقة الذهبية',
      nameEn: 'Gold',
      description: 'عروض وخصومات مميزة على مئات الخدمات.',
      image: cardImg(brand, 'gold'),
      badge: 'الأكثر طلباً',
      price: '5 درهم',
      benefits: [
        'العروض والخصومات',
        `متاجر ${storeName}`,
        `${storeName} أماكن`,
        'فنادق و باقات للسفر',
        'خدمة إيجار السيارات اليومي',
        `${storeName} هيلث`,
        'إيجار السيارات طويل الامد',
      ],
    },
    {
      id: 'silver',
      name: 'الفضية',
      displayName: 'البطاقة الفضية',
      nameEn: 'Silver',
      description: 'خصومات وخدمات أساسية للاستخدام اليومي.',
      image: cardImg(brand, 'silver'),
      price: '5 درهم',
      benefits: [
        `${storeName} أماكن`,
        `متاجر ${storeName}`,
        'فنادق و باقات للسفر',
        'خدمة إيجار السيارات اليومي',
        `${storeName} هيلث`,
      ],
    },
    {
      id: 'discount',
      name: 'الخصومات',
      displayName: 'بطاقة الخصومات',
      nameEn: 'Discount',
      description: 'خصومات مختارة يومياً مجاناً.',
      image: cardImg(brand, 'discount'),
      price: '5 درهم',
      benefits: [
        `${storeName} هيلث`,
        `متاجر ${storeName}`,
        `${storeName} أماكن`,
        'فنادق و باقات للسفر',
      ],
    },
  ];
}

export const BRANDS: Record<BrandKey, BrandData> = {
  fazaa: {
    key: 'fazaa',
    name: 'فزعة',
    nameEn: 'FAZAA',
    color: '#c9a227',
    darkColor: '#7a6318',
    description: 'تابعة لوزارة الداخلية',
    eligibility: ['الموظفون الحكوميون', 'القطاع الخاص', 'الأسر'],
    cards: cardTypes('fazaa', 'فزعه'),
  },
  esaad: {
    key: 'esaad',
    name: 'إسعاد',
    nameEn: 'ESAAD',
    color: '#1e7a4a',
    darkColor: '#145233',
    description: 'تابعة لشرطة دبي',
    eligibility: ['موظفو حكومة دبي', 'المتقاعدون', 'حاملو الإقامة الذهبية'],
    cards: cardTypes('esaad', 'إسعاد').filter(c => c.id !== 'discount'),
  },
  homat: {
    key: 'homat',
    name: 'حماة الوطن',
    nameEn: 'HOMAT AL WATAN',
    color: '#3a5a2a',
    darkColor: '#253d1a',
    description: 'تابعة للقوات المسلحة',
    eligibility: ['العسكريون', 'المتقاعدون من الجيش'],
    cards: cardTypes('homat', 'حماة الوطن').filter(c => c.id !== 'discount'),
  },
  alsaada: {
    key: 'alsaada',
    name: 'السعادة',
    nameEn: 'AL SAADA',
    color: '#1a6b9a',
    darkColor: '#0f4a6b',
    description: 'تابعة لإدارة الإقامة وشؤون الأجانب بدبي',
    eligibility: ['السياح', 'الزوار', 'الأجانب المقيمون'],
    cards: cardTypes('alsaada', 'السعادة'),
  },
  absher: {
    key: 'absher',
    name: 'أبشر',
    nameEn: 'ABSHER',
    color: '#1a5a3a',
    darkColor: '#0f3d27',
    description: 'للمواطنين والمقيمين',
    eligibility: ['المواطنون', 'العاملون في القطاع الخاص'],
    cards: cardTypes('absher', 'أبشر').filter(c => c.id !== 'discount'),
  },
};

export const BRAND_KEYS: BrandKey[] = ['fazaa', 'esaad', 'homat', 'alsaada', 'absher'];
