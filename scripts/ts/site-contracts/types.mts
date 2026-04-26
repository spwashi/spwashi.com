export const REQUIRED_BODY_DATA_KEYS = Object.freeze([
  'spwSurface',
  'spwFeatures',
  'spwRouteFamily',
  'spwContext',
  'spwWonder',
  'spwPageFamily',
  'spwPageModes',
  'spwPageRole',
] as const);

export const EXPECTED_STYLESHEET_PREFIX = '/public/css/style.css';
export const EXPECTED_SITE_SCRIPT_PREFIX = '/public/js/site.js';

export type RuntimeDefinition = {
  id: string;
  importPath: string | null;
  layer: string;
  rootMode: string | null;
  route: string[];
  selector: string | null;
  when: string;
};

export type SvgHost = {
  class: string | null;
  companion: string | null;
  hasDesc: boolean;
  hasFigureContract: boolean;
  hasSurfaceClass: boolean;
  hasTitle: boolean;
  hostId: string | null;
  kind: string | null;
  motion: string | null;
  role: string | null;
  scale: string | null;
  surfaceVariant: string | null;
  viewBox: string | null;
};

export type SvgHostWithRoute = SvgHost & {
  route: string;
  surface: string | null;
};

export type RouteSpecSummary = {
  gridCount: number;
  kickerCount: number;
  pillCount: number;
  route: string;
  stripCount: number;
  surface: string | null;
  title: string;
};

export type SvgRouteSummary = {
  featureEnabled: boolean;
  figureCount: number;
  hostCount: number;
  inlineCount: number;
  route: string;
  surface: string | null;
  surfaceCount: number;
  title: string;
};

export type ManifestRoute = {
  assets: {
    icons: string[];
    manifest: string | null;
    moduleScripts: string[];
    stylesheets: string[];
  };
  context: string | null;
  errors: string[];
  features: string[];
  file: string;
  layout: string | null;
  pageFamily: string | null;
  pageModes: string[];
  pageRole: string | null;
  pageSeed: string | null;
  relatedRoutes: string[];
  route: string;
  routeFamily: string | null;
  runtime?: {
    coreModules: string[];
    enhancementModules: string[];
    featureModules: RuntimeDefinition[];
    regionModules: string[];
  };
  spec: {
    featureEnabled: boolean;
    gridCount: number;
    kickerCount: number;
    pillCount: number;
    stripCount: number;
  };
  surface: string | null;
  title: string;
  warnings: string[];
  wonder: string[];
  svg: {
    featureEnabled: boolean;
    figureCount: number;
    hosts: SvgHost[];
    inlineCount: number;
    surfaceCount: number;
  };
};

export type RouteRuntimeManifest = {
  generatedAt: string;
  maps: {
    specRoutes: RouteSpecSummary[];
    svgAssets: string[];
    svgHosts: SvgHostWithRoute[];
    svgRoutes: SvgRouteSummary[];
  };
  repoRoot: string;
  routeCount: number;
  routes: ManifestRoute[];
  runtimeDefinitions: {
    coreModules: RuntimeDefinition[];
    enhancementModules: RuntimeDefinition[];
    featureModules: RuntimeDefinition[];
    regionModules: RuntimeDefinition[];
  };
  surfaces: Record<string, number>;
};
