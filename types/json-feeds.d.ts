/**
 * Shared JSON feed contracts for public/data/*.json surfaces.
 * Runtime modules and check scripts should agree on these shapes.
 */

export type LocaleCode = string;

export type LocalizationMeta = {
  copyUnit?: string;
  notes?: string;
  prepared?: boolean;
};

export type PromoPresentation = 'toast' | 'popup' | 'modal' | 'credits' | 'inline';

export type PromotionKind =
  | 'event'
  | 'deal'
  | 'discount'
  | 'service'
  | 'support'
  | 'release'
  | 'learning';

export type PromotionDetails = {
  kind?: PromotionKind | string;
  audience?: string;
  offer?: string;
  proof?: string;
  objection?: string;
  urgency?: string;
  tone?: string;
  theme?: string;
  handles?: string[];
  ctaStyle?: string;
  presentation?: PromoPresentation | string;
  cadenceDay?: string;
  cadenceMotion?: string;
  rewardKind?: string;
  productionSeed?: string;
};

export type PromotionPlaybookEntry = {
  goal?: string;
  psychology?: string;
  structure?: string;
  presentation?: PromoPresentation | string;
  ctaPattern?: string;
  proof?: string;
  riskReversal?: string;
};

export type PromotionPlaybook = {
  purpose?: string;
  note?: string;
  kinds?: Record<string, PromotionPlaybookEntry>;
};

export type PromoWonderCard = {
  copyUnit?: string;
  label?: string;
  locale?: LocaleCode;
  operator?: string;
  title?: string;
  summary?: string;
  href?: string;
  cta?: string;
  why?: string;
  presentation?: PromoPresentation | string;
  promotion?: PromotionDetails;
  cadenceDay?: string;
  cadenceMotion?: string;
  rewardKind?: string;
  productionSeed?: string;
};

export type PromoWonderPair = {
  promo: PromoWonderCard;
  wonder: PromoWonderCard;
};

export type PromoWonderFeed = {
  sourceLocale?: LocaleCode;
  localization?: LocalizationMeta;
  promotionPlaybook?: PromotionPlaybook;
  daily?: PromoWonderPair[];
  weekly?: PromoWonderPair[];
};

export type MediaItem = {
  copyUnit?: string;
  cta?: string;
  href?: string;
  label?: string;
  locale?: LocaleCode;
  operator?: string;
  summary?: string;
  tag?: string;
  title?: string;
  why?: string;
};

export type MediaPublishingConfig = {
  sourceLocale?: LocaleCode;
  localization?: LocalizationMeta;
  updated?: string;
  weekly?: MediaItem;
  daily?: Partial<Record<
    'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday',
    MediaItem
  >>;
  featuredPages?: MediaItem[];
  featuredTopics?: MediaItem[];
  featuredComponents?: MediaItem[];
  [key: string]:
    | LocaleCode
    | string
    | MediaItem
    | MediaItem[]
    | Partial<Record<string, MediaItem>>
    | LocalizationMeta
    | undefined;
};

export type JsonValidationIssue = {
  path: string;
  message: string;
};

export type JsonValidationResult<T> = {
  ok: boolean;
  value: T | null;
  issues: JsonValidationIssue[];
};