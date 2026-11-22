import { NextRequest, NextResponse } from 'next/server';
import { AGENTS, BrandContextData, DEFAULT_BRAND_CONTEXT } from '@/data/podrozowka-kb';
import { DEFAULT_VALIDATION_GATES, type ValidationGate } from '@/data/marketing-plan';
import {
  buildBrandContextBlock,
  getPendingValidationGates,
} from '@/lib/brand-context';
import {
  formatGeminiError,
  generateWithGemini,
  generateWithGoogleSearch,
} from '@/lib/gemini';
import { lintPodrozowkaCopy } from '@/lib/lint-copy';
import { HUMANIZER_EMBEDDED_DIRECTIVE, scanHumanizerTells } from '@/lib/humanizer';

interface AgentRunBody {
  agentId?: string;
  prompt?: string;
  brandContext?: BrandContextData;
  validationGates?: ValidationGate[];
  ga4Summary?: string;
  googleAdsSummary?: string;
  deepResearchSummary?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentRunBody;
    const agent = AGENTS.find((a) => a.id === body.agentId);

    if (!agent) {
      return NextResponse.json(
        { error: 'Nie znaleziono wybranego agenta marketingowego.' },
        { status: 400 }
      );
    }

    const userPrompt = (body.prompt || '').trim();
    if (!userPrompt) {
      return NextResponse.json(
        { error: 'Wpisz zadanie lub wybierz gotowy preset dla agenta.' },
        { status: 400 }
      );
    }

    const brand = { ...DEFAULT_BRAND_CONTEXT, ...(body.brandContext ?? {}) };
    const gates =
      Array.isArray(body.validationGates) && body.validationGates.length > 0
        ? body.validationGates
        : DEFAULT_VALIDATION_GATES;
    const pendingGates = getPendingValidationGates(gates);
    const reviewsGatePassed =
      gates.find((g) => g.id === 'gate-first-reviews')?.status === 'zaliczona';

    const brandBlock = buildBrandContextBlock(brand, { validationGates: gates });

    const deepResearchBlock = body.deepResearchSummary?.trim()
      ? `\n\n=== ŹRÓDŁO 2: RAPORT BADACZA RYNKU (DEEP RESEARCH) ===\n${body.deepResearchSummary.trim()}`
      : '';

    const ga4Block = body.ga4Summary?.trim()
      ? `\n\n=== ŹRÓDŁO 3: DANE GOOGLE ANALYTICS 4 (PODROZOWKA-PRODUCTION) ===\n${body.ga4Summary.trim()}`
      : '';

    const googleAdsBlock = body.googleAdsSummary?.trim()
      ? `\n\n=== ŹRÓDŁO 4: RAPORT GOOGLE ADS NA ŻYWO (API v26) ===\n${body.googleAdsSummary.trim()}`
      : '';

    const systemInstruction = `${agent.systemPrompt}\n\n${HUMANIZER_EMBEDDED_DIRECTIVE}\n\n${brandBlock}`;
    const fullUserPrompt = `${userPrompt}${deepResearchBlock}${ga4Block}${googleAdsBlock}`;

    const result = agent.useGoogleSearch
      ? await generateWithGoogleSearch({
          systemInstruction,
          userPrompt: fullUserPrompt,
        })
      : await generateWithGemini({
          systemInstruction,
          userPrompt: fullUserPrompt,
        });

    let outputText = (result.text || '').trim();
    if (
      pendingGates.length > 0 &&
      !/hipoteza\s*[–-]\s*czeka na walidację/i.test(outputText)
    ) {
      outputText = `**HIPOTEZA – czeka na walidację** (${pendingGates
        .map((g) => g.label)
        .join(', ')})\n\n${outputText}`;
    }

    const lintFindings = lintPodrozowkaCopy(outputText, { reviewsGatePassed });
    const humanizerFindings = scanHumanizerTells(outputText);

    return NextResponse.json({
      agentId: agent.id,
      agentName: agent.name,
      output: outputText,
      sources: result.sources,
      lintFindings,
      humanizerFindings,
      pendingValidationGates: pendingGates.map((g) => g.label),
      usedLiveGa4: Boolean(body.ga4Summary?.trim()),
      createdAt: new Date().toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  } catch (err: unknown) {
    const formatted = formatGeminiError(err);
    return NextResponse.json({ error: formatted.message }, { status: formatted.status });
  }
}
