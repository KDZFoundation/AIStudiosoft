import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import {
  createDefaultMarketingPlanState,
  MarketingPlanState,
  mergeMarketingPlanState,
} from '@/data/marketing-plan';

const PLAN_FILE = '/tmp/podrozowka-marketing-plan.json';

let writeQueue: Promise<void> = Promise.resolve();

async function readSavedPlan(): Promise<MarketingPlanState> {
  try {
    const raw = await fs.readFile(PLAN_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MarketingPlanState>;
    return mergeMarketingPlanState(parsed);
  } catch {
    return createDefaultMarketingPlanState();
  }
}

async function writeSavedPlanAtomic(plan: MarketingPlanState): Promise<void> {
  const runWrite = async () => {
    const tempFile = `${PLAN_FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(plan, null, 2), 'utf8');
    await fs.rename(tempFile, PLAN_FILE);
  };
  const next = writeQueue.then(runWrite, runWrite);
  writeQueue = next.catch(() => undefined);
  await next;
}

export async function GET() {
  const plan = await readSavedPlan();
  return NextResponse.json({ plan });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as
      | { plan?: Partial<MarketingPlanState> }
      | Partial<MarketingPlanState>;
    const rawPlan =
      body && typeof body === 'object' && 'plan' in body && body.plan
        ? body.plan
        : (body as Partial<MarketingPlanState>);
    const normalized = mergeMarketingPlanState({
      ...rawPlan,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    await writeSavedPlanAtomic(normalized);
    return NextResponse.json({ plan: normalized });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd zapisu planu marketingowego';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const fresh = createDefaultMarketingPlanState();
  const runDelete = async () => {
    try {
      await fs.unlink(PLAN_FILE);
    } catch {
      // File may not exist yet
    }
  };
  const next = writeQueue.then(runDelete, runDelete);
  writeQueue = next.catch(() => undefined);
  await next;
  return NextResponse.json({ plan: fresh });
}
