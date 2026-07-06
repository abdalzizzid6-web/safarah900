import { BlockType } from '../../types';

export interface WidgetPermission {
  guests: boolean;
  members: boolean;
}

export interface WidgetVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
}

export interface WidgetAnimation {
  type: 'fade' | 'slide' | 'zoom' | 'none';
  duration: number;
  delay: number;
}

export interface WidgetScheduling {
  startDate?: string;
  endDate?: string;
  publishTime?: string;
  expireTime?: string;
}

export interface WidgetConditionalRendering {
  conditionType: 'live_matches_count' | 'always' | 'has_news';
  operator: 'gt' | 'eq' | 'lt';
  value: any;
  fallbackWidgetType?: string;
}

export interface WidgetDefinition {
  id: string;
  type: BlockType | string;
  title: string;
  status: 'active' | 'inactive';
  order: number;
  dataSource: 'firestore' | 'rss' | 'api' | 'ai' | 'manual' | 'mixed';
  layout: {
    width?: string; // e.g., 'full' | 'half' | 'third'
    spacing?: string;
    alignment?: 'start' | 'center' | 'end';
  };
  visibility: WidgetVisibility;
  permissions: WidgetPermission;
  responsiveSettings: {
    mobileColumns: number;
    tabletColumns: number;
    desktopColumns: number;
  };
  cacheSettings: {
    durationMinutes: number;
  };
  animation: WidgetAnimation;
  scheduling: WidgetScheduling;
  conditionalRendering?: WidgetConditionalRendering;
  dataConfig?: Record<string, any>;
}

export interface ColumnDefinition {
  id: string;
  width: string; // e.g., 'w-full', 'md:w-1/2', 'lg:w-1/3'
  widgets: WidgetDefinition[];
}

export interface RowDefinition {
  id: string;
  spacing: string; // gap size e.g. 'gap-6'
  alignment: string; // items alignment e.g. 'items-start'
  columns: ColumnDefinition[];
}

export interface LayoutDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  displayOrder: number;
  rows: RowDefinition[];
}

// ----------------------------------------------------
// HELPER: Create standard widgets with complete properties
// ----------------------------------------------------
export function createStandardWidget(
  id: string,
  type: BlockType | string,
  title: string,
  order: number,
  dataSource: WidgetDefinition['dataSource'] = 'api',
  dataConfig?: Record<string, any>,
  conditionalRendering?: WidgetConditionalRendering
): WidgetDefinition {
  return {
    id,
    type,
    title,
    status: 'active',
    order,
    dataSource,
    layout: { width: 'full', spacing: 'gap-4', alignment: 'center' },
    visibility: { desktop: true, tablet: true, mobile: true },
    permissions: { guests: true, members: true },
    responsiveSettings: { mobileColumns: 1, tabletColumns: 1, desktopColumns: 1 },
    cacheSettings: { durationMinutes: 5 },
    animation: { type: 'fade', duration: 0.5, delay: 0.05 * order },
    scheduling: {},
    conditionalRendering,
    dataConfig
  };
}

// ----------------------------------------------------
// TEMPLATES DEFINITIONS
// ----------------------------------------------------

// 1. Default Homepage Template
export const DEFAULT_HOMEPAGE_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-1-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-hero', BlockType.HERO, 'أبرز مباريات القمة المتاحة حالياً', 10, 'firestore', undefined, {
            conditionType: 'live_matches_count',
            operator: 'eq',
            value: 0,
            fallbackWidgetType: BlockType.TODAY_MATCHES
          })
        ]
      }
    ]
  },
  {
    id: 'row-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-2-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-bento', BlockType.BENTO_ACTIONS, 'الوصول السريع والخيارات المتقدمة', 20, 'manual')
        ]
      }
    ]
  },
  {
    id: 'row-3',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-3-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-live', BlockType.LIVE_MATCHES, 'المباريات المباشرة الآن', 30, 'api', undefined, {
            conditionType: 'live_matches_count',
            operator: 'gt',
            value: 0,
            fallbackWidgetType: BlockType.HERO
          })
        ]
      }
    ]
  },
  {
    id: 'row-4',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-4-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-wc', BlockType.BREAKING_NEWS, 'تغطية كأس العالم ٢٠٢٦', 40, 'ai')
        ]
      }
    ]
  },
  {
    id: 'row-5',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-5-1',
        width: 'w-full md:w-1/2',
        widgets: [
          createStandardWidget('widget-standings', BlockType.LEAGUE_STANDINGS, 'جدول ترتيب الدوري الإنجليزي الممتاز', 50, 'api', { leagueId: '39', leagueName: 'الدوري الإنجليزي' })
        ]
      },
      {
        id: 'col-5-2',
        width: 'w-full md:w-1/2',
        widgets: [
          createStandardWidget('widget-news', BlockType.LATEST_NEWS, 'آخر الأخبار الرياضية الحصرية', 60, 'rss')
        ]
      }
    ]
  },
  {
    id: 'row-6',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-6-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-today', BlockType.TODAY_MATCHES, 'جدول مباريات اليوم', 70, 'api')
        ]
      }
    ]
  }
];

// 2. World Cup Template
export const WORLD_CUP_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-wc-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-wc-1-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-wc-breaking', BlockType.BREAKING_NEWS, 'تغطية وبث كأس العالم ٢٠٢٦ المباشر', 10, 'ai')
        ]
      }
    ]
  },
  {
    id: 'row-wc-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-wc-2-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-wc-live', BlockType.LIVE_MATCHES, 'مباريات كاس العالم الجارية الآن', 20, 'api')
        ]
      }
    ]
  },
  {
    id: 'row-wc-3',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-wc-3-1',
        width: 'w-full md:w-2/3',
        widgets: [
          createStandardWidget('widget-wc-hero', BlockType.HERO, 'مباراة القمة الكبرى اليوم', 30, 'firestore')
        ]
      },
      {
        id: 'col-wc-3-2',
        width: 'w-full md:w-1/3',
        widgets: [
          createStandardWidget('widget-wc-bento', BlockType.BENTO_ACTIONS, 'خيارات سريعة', 40, 'manual')
        ]
      }
    ]
  },
  {
    id: 'row-wc-4',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-wc-4-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-wc-news', BlockType.LATEST_NEWS, 'أخبار ومستجدات كأس العالم', 50, 'rss')
        ]
      }
    ]
  }
];

// 3. League Template
export const LEAGUE_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-league-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-league-1-1',
        width: 'w-full md:w-1/2',
        widgets: [
          createStandardWidget('widget-league-standings-eng', BlockType.LEAGUE_STANDINGS, 'ترتيب الدوري الإنجليزي', 10, 'api', { leagueId: '39', leagueName: 'الدوري الإنجليزي' })
        ]
      },
      {
        id: 'col-league-1-2',
        width: 'w-full md:w-1/2',
        widgets: [
          createStandardWidget('widget-league-standings-spa', BlockType.LEAGUE_STANDINGS, 'ترتيب الدوري الإسباني', 20, 'api', { leagueId: '140', leagueName: 'الدوري الإسباني' })
        ]
      }
    ]
  },
  {
    id: 'row-league-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-league-2-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-league-fixtures', BlockType.TODAY_MATCHES, 'أبرز مباريات الدوري اليوم', 30, 'api')
        ]
      }
    ]
  },
  {
    id: 'row-league-3',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-league-3-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-league-news', BlockType.LATEST_NEWS, 'مستجدات الدوريات العالمية والمحلية', 40, 'rss')
        ]
      }
    ]
  }
];

// 4. Breaking News Template
export const BREAKING_NEWS_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-bn-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-bn-1-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-bn-breaking', BlockType.LATEST_NEWS, 'أخبار عاجلة وحصرية الآن', 10, 'rss')
        ]
      }
    ]
  },
  {
    id: 'row-bn-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-bn-2-1',
        width: 'w-full md:w-2/3',
        widgets: [
          createStandardWidget('widget-bn-hero', BlockType.HERO, 'مباراة الحدث البارزة', 20, 'firestore')
        ]
      },
      {
        id: 'col-bn-2-2',
        width: 'w-full md:w-1/3',
        widgets: [
          createStandardWidget('widget-bn-wc', BlockType.BREAKING_NEWS, 'تحليل عاجل من الذكاء الاصطناعي', 30, 'ai')
        ]
      }
    ]
  }
];

// 5. Minimal Template
export const MINIMAL_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-min-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-min-1-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-min-hero', BlockType.HERO, 'المباراة الرئيسية', 10, 'firestore')
        ]
      }
    ]
  },
  {
    id: 'row-min-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-min-2-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-min-live', BlockType.LIVE_MATCHES, 'البث المباشر المتاح', 20, 'api')
        ]
      }
    ]
  },
  {
    id: 'row-min-3',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-min-3-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-min-fixtures', BlockType.TODAY_MATCHES, 'جدول المباريات المبسط', 30, 'api')
        ]
      }
    ]
  }
];

// 6. Magazine Template
export const MAGAZINE_TEMPLATE: RowDefinition[] = [
  {
    id: 'row-mag-1',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-mag-1-1',
        width: 'w-full md:w-2/3',
        widgets: [
          createStandardWidget('widget-mag-news', BlockType.LATEST_NEWS, 'المجلة الرياضية اليومية للأخبار والتحليلات الفنية', 10, 'mixed')
        ]
      },
      {
        id: 'col-mag-1-2',
        width: 'w-full md:w-1/3',
        widgets: [
          createStandardWidget('widget-mag-bento', BlockType.BENTO_ACTIONS, 'روابط تفاعلية وسريعة', 20, 'manual'),
          createStandardWidget('widget-mag-standings', BlockType.LEAGUE_STANDINGS, 'جدول الدوري الإنجليزي الممتاز', 30, 'api', { leagueId: '39', leagueName: 'الدوري الإنجليزي' })
        ]
      }
    ]
  },
  {
    id: 'row-mag-2',
    spacing: 'gap-6',
    alignment: 'items-start',
    columns: [
      {
        id: 'col-mag-2-1',
        width: 'w-full',
        widgets: [
          createStandardWidget('widget-mag-hero', BlockType.HERO, 'اللقاء المرتقب', 40, 'firestore')
        ]
      }
    ]
  }
];

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  rows: RowDefinition[];
}

export const HOMEPAGE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'default',
    name: 'الافتراضية الشاملة',
    description: 'تخطيط رسمي متكامل يحتوي على المباراة المميزة، المباريات الجارية، أخبار كأس العالم، الترتيب وجدول مباريات اليوم.',
    rows: DEFAULT_HOMEPAGE_TEMPLATE
  },
  {
    id: 'world_cup',
    name: 'تغطية كأس العالم ٢٠٢٦',
    description: 'تخطيط مخصص للتركيز على حدث كأس العالم ٢٠٢٦ عبر تقديم البث المباشر والتحليلات والعد التنازلي أولاً.',
    rows: WORLD_CUP_TEMPLATE
  },
  {
    id: 'league',
    name: 'تغطية الدوريات الكبرى',
    description: 'تخطيط مخصص يضع جداول الترتيب لعدة دوريات شهيرة متجاورة مع مباريات اليوم وأخبار الفرق.',
    rows: LEAGUE_TEMPLATE
  },
  {
    id: 'breaking_news',
    name: 'الأخبار العاجلة والتحليلات',
    description: 'تصميم يركز بالكامل على تغذية الأخبار العاجلة والأقسام التحريرية لمواكبة الأحداث الرياضية الساخنة.',
    rows: BREAKING_NEWS_TEMPLATE
  },
  {
    id: 'minimal',
    name: 'مبسط وسريع (Minimal)',
    description: 'واجهة خفيفة تقتصر على عرض المباراة الحالية والمباريات الحية وجدول اليوم، مثالية للأداء فائق السرعة.',
    rows: MINIMAL_TEMPLATE
  },
  {
    id: 'magazine',
    name: 'نمط المجلة الفاخرة (Magazine)',
    description: 'عرض شبكي متداخل يعطي المساحة الأكبر للأخبار والتحليلات التحريرية مع نوافذ جانبية تفاعلية.',
    rows: MAGAZINE_TEMPLATE
  }
];
