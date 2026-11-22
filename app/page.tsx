import { promises as fs } from 'fs';
import { BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import {
  createDefaultMarketingPlanState,
  MarketingPlanState,
  mergeMarketingPlanState,
} from '@/data/marketing-plan';
import WorkspaceShell from '@/components/WorkspaceShell';

export const dynamic = 'force-dynamic';

async function loadInitialBrandContext(): Promise<BrandContextData> {
  try {
    const raw = await fs.readFile('/tmp/podrozowka-brand-context.json', 'utf8');
    const parsed = JSON.parse(raw) as Partial<BrandContextData>;
    return { ...DEFAULT_BRAND_CONTEXT, ...parsed };
  } catch {
    return DEFAULT_BRAND_CONTEXT;
  }
}

async function loadInitialMarketingPlan(): Promise<MarketingPlanState> {
  try {
    const raw = await fs.readFile('/tmp/podrozowka-marketing-plan.json', 'utf8');
    const parsed = JSON.parse(raw) as Partial<MarketingPlanState>;
    return mergeMarketingPlanState(parsed);
  } catch {
    return createDefaultMarketingPlanState();
  }
}

export default async function HomePage() {
  const [brandContext, marketingPlan] = await Promise.all([
    loadInitialBrandContext(),
    loadInitialMarketingPlan(),
  ]);
  return (
    <WorkspaceShell
      initialBrandContext={brandContext}
      initialMarketingPlan={marketingPlan}
    />
  );
}
