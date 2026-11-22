import { GoogleGenAI } from '@google/genai';

export interface GroundingSourceItem {
  title: string;
  uri: string;
}

export interface GeminiResult {
  text: string;
  sources: GroundingSourceItem[];
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Brak skonfigurowanego klucza GEMINI_API_KEY po stronie serwera. Sprawdź panel Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function formatGeminiError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err ?? 'Nieznany błąd modelu Gemini');
  const lower = raw.toLowerCase();

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        'Przekroczono chwilowy limit zapytań lub kwotę klucza Gemini API (429 RESOURCE_EXHAUSTED). Odczekaj chwilę lub podłącz klucz z wyższym limitem w panelu Settings > Secrets.',
    };
  }
  if (lower.includes('403') || lower.includes('permission_denied')) {
    return {
      status: 403,
      message:
        'Brak uprawnień dla klucza Gemini API (403 PERMISSION_DENIED). Zweryfikuj klucz w panelu Settings > Secrets.',
    };
  }
  if (lower.includes('400') || lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
    return {
      status: 400,
      message:
        'Nieprawidłowy klucz Gemini API (400 API_KEY_INVALID). Zaktualizuj GEMINI_API_KEY w panelu Settings > Secrets.',
    };
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return {
      status: 503,
      message:
        'Model Gemini jest chwilowo bardzo obciążony (503 UNAVAILABLE). Odczekaj kilka sekund i spróbuj ponownie.',
    };
  }
  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 404,
      message:
        'Wybrany model AI nie jest dostępny dla tego klucza (404). Skontaktuj się z administratorem lub sprawdź konfigurację w Settings > Secrets.',
    };
  }

  return { status: 500, message: raw };
}

function isTransientDemandError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('temporarily')
  );
}

async function generateWithFallback(params: {
  systemInstruction: string;
  userPrompt: string;
  useSearch?: boolean;
}) {
  const ai = getGeminiClient();
  const attempt = async (model: string) =>
    ai.models.generateContent({
      model,
      contents: params.userPrompt,
      config: {
        systemInstruction: params.systemInstruction,
        ...(params.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });

  try {
    return await attempt('gemini-4-hydrogen');
  } catch (err) {
    if (!isTransientDemandError(err)) throw err;
    await new Promise((r) => setTimeout(r, 900));
    try {
      return await attempt('gemini-4-hydrogen');
    } catch (err2) {
      if (!isTransientDemandError(err2)) throw err2;
      return await attempt('gemini-3.1-flash-lite');
    }
  }
}

export async function generateWithGemini(params: {
  systemInstruction: string;
  userPrompt: string;
}): Promise<GeminiResult> {
  const response = await generateWithFallback({
    systemInstruction: params.systemInstruction,
    userPrompt: params.userPrompt,
    useSearch: false,
  });

  return {
    text: (response.text ?? '').trim(),
    sources: [],
  };
}

export async function generateWithGoogleSearch(params: {
  systemInstruction: string;
  userPrompt: string;
}): Promise<GeminiResult> {
  const response = await generateWithFallback({
    systemInstruction: params.systemInstruction,
    userPrompt: params.userPrompt,
    useSearch: true,
  });

  const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: GroundingSourceItem[] = [];

  for (const chunk of rawChunks) {
    const uri = chunk.web?.uri?.trim();
    const title = chunk.web?.title?.trim() || uri || 'Źródło internetowe';
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ title, uri });
    }
  }

  return {
    text: (response.text ?? '').trim(),
    sources,
  };
}

export async function generateStructuredWithGemini<T>(params: {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
}): Promise<T> {
  const ai = getGeminiClient();
  const attempt = async (model: string) =>
    ai.models.generateContent({
      model,
      contents: params.userPrompt,
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: params.responseSchema,
      },
    });

  let response;
  try {
    response = await attempt('gemini-4-hydrogen');
  } catch (err) {
    if (!isTransientDemandError(err)) throw err;
    await new Promise((r) => setTimeout(r, 900));
    try {
      response = await attempt('gemini-4-hydrogen');
    } catch (err2) {
      if (!isTransientDemandError(err2)) throw err2;
      response = await attempt('gemini-3.1-flash-lite');
    }
  }

  const raw = (response.text ?? '{}').trim();
  return JSON.parse(raw) as T;
}

