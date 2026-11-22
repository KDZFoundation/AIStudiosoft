export interface CopyLintFinding {
  id: string;
  severity: 'error' | 'warning';
  term: string;
  reason: string;
}

export interface LintCopyOptions {
  reviewsGatePassed?: boolean;
  allowShippingPrices?: boolean;
}

interface RuleCheck {
  id: string;
  pattern: RegExp;
  label: string;
  severity: 'error' | 'warning';
  reason: string;
  requiresUnpassedReviewsGate?: boolean;
  skipWhenShippingPricesAllowed?: boolean;
  ignoreIfPrecededByNegation?: boolean;
}

export interface CopyLintRuleSummary {
  id: string;
  label: string;
  severity: 'error' | 'warning';
  reason: string;
}

const ANTYWZORCE_RULES: RuleCheck[] = [
  {
    id: 'ban-wizytowka',
    pattern: /\bwizytów[a-ząćęłńóśźż]*|\bwizytow[a-ząćęłńóśźż]*/i,
    label: 'Porównanie do „wizytówki”',
    severity: 'error',
    reason: 'Twardy zakaz marki: nigdy nie porównujemy Podróżówki do wizytówki ani wizytówki podróżnej.',
  },
  {
    id: 'ban-magnes',
    pattern: /\bmagnes[a-ząćęłńóśźż]*/i,
    label: 'Porównanie do „magnesu”',
    severity: 'error',
    reason: 'Twardy zakaz marki: nie zestawiamy Podróżówki z magnesami na lodówkę.',
  },
  {
    id: 'ban-upload',
    pattern:
      /\bwłasne\s+zdjęcie(?![a-ząćęłńóśźż])|\bwłasnych\s+zdjęć(?![a-ząćęłńóśźż])|\bwgraj\s+(?:własne\s+)?zdjęcie(?![a-ząćęłńóśźż])|\bwgryw[a-ząćęłńóśźż]*\s+własn[a-ząćęłńóśźż]*\s+zdjęc[a-ząćęłńóśźż]*|\bprześlij\s+(?:własne\s+)?zdjęcie(?![a-ząćęłńóśźż])/i,
    label: 'Obietnica wgrywania własnych zdjęć',
    severity: 'error',
    reason:
      'Podróżnicy NIGDY nie wgrywają własnych fotografii. W sklepie dostępne są gotowe wzory Podróżówki.',
  },
  {
    id: 'ban-rabat',
    pattern:
      /\brabat[a-ząćęłńóśźż]*\s+(?:ilościow|hurtow|progow)[a-ząćęłńóśźż]*|\bpakiet[a-ząćęłńóśźż]*\s+taniej(?![a-ząćęłńóśźż])|\bpróg\s+rabat[a-ząćęłńóśźż]*/i,
    label: 'Sugestia rabatów progowych',
    severity: 'error',
    reason: 'Cena jest stała (4,99 zł/szt.) niezależnie od liczby kartek, bez progów rabatowych.',
    ignoreIfPrecededByNegation: true,
  },
  {
    id: 'ban-qr-route',
    pattern:
      /\bkod(?:zie|u|em)?\s+qr[^.\n]{0,80}\b(?:tras[ayęą]|relacj[iąeę]\s+z\s+podróży|map[ayę]\s+podróży)(?![a-ząćęłńóśźż])|\b(?:tras[ayęą]\s+podróżnika|map[ayę]\s+trasy|relacj[ięą]\s+z\s+podróży)[^.\n]{0,60}\bqr(?![a-ząćęłńóśźż])|\bqr\s+(?:pokazuje|prowadzi\s+do|otwiera)\s+(?:twoj[ąa]\s+)?tras[ęey](?![a-ząćęłńóśźż])|\bwidzi\s+(?:twoj[ąa]\s+)?tras[ęey](?![a-ząćęłńóśźż])/i,
    label: 'Błędna funkcja kodu QR (pokazywanie trasy)',
    severity: 'error',
    reason: 'QR łączy Podróżnika z Obdarowanym, nie pokazuje trasy.',
  },
  {
    id: 'ban-front-no-text',
    pattern:
      /\b(?:bez|brak|zero)\s+(?:żadnego\s+|jakichkolwiek\s+)?(?:napis|podpis|tekst)[a-ząćęłńóśźż]*[^.\n]{0,55}(?:fron|przod|przód|awers)[a-ząćęłńóśźż]*|\b(?:fron|przód|przod|awers)[a-ząćęłńóśźż]*[^.\n]{0,55}\b(?:bez|nie\s+ma|brak|zero)\s+(?:żadnego\s+|jakiegokolwiek\s+)?(?:napis|podpis|tekst)[a-ząćęłńóśźż]*|\bczysty\s+(?:przód|awers|front)(?![a-ząćęłńóśźż])/i,
    label: 'Błędny opis przodu kartki (bez napisu)',
    severity: 'error',
    reason: 'Na froncie jest podziękowanie w języku kraju docelowego.',
  },
  {
    id: 'ban-arbitrary-language',
    pattern:
      /(?:\bwybier[a-ząćęłńóśźż]*|(?:^|[^a-ząćęłńóśźż])łącz[a-ząćęłńóśźż]*|\bmiesz[a-ząćęłńóśźż]*)\s+dowoln[a-ząćęłńóśźż]+\s+(?:z\s+\d+\+?\s+)?język[a-ząćęłńóśźż]*|\bdowolnie\s+(?:łącz[a-ząćęłńóśźż]*|miesz[a-ząćęłńóśźż]*|wybier[a-ząćęłńóśźż]*)[^.\n]{0,40}\bjęzyk[a-ząćęłńóśźż]*|\bdowolny\s+(?:wybór|miks)\s+(?:z\s+\d+\+?\s+)?język[a-ząćęłńóśźż]*/i,
    label: 'Sugestia dowolnego wyboru języka spoza kraju',
    severity: 'error',
    reason: 'Język wynika z kraju kartki; wybór tylko w krajach wielojęzycznych.',
  },
  {
    id: 'warn-odbiorca-nadawca',
    pattern:
      /\b(?:odbiorc[ayęąo]|odbiorców|odbiorcom|nadawc[ayęąo]|nadawców|nadawcom)(?![a-ząćęłńóśźż])/i,
    label: 'Słowa „odbiorca” / „nadawca”',
    severity: 'warning',
    reason:
      'Użyj słownictwa marki: „Obdarowany” zamiast „odbiorca” oraz „Podróżnik” zamiast „nadawca”.',
  },
  {
    id: 'warn-shipping-price',
    pattern:
      /\b15[,.]49\s*zł(?![a-ząćęłńóśźż])|\b(?:wysyłk[aęi]|dostaw[aęy]|orlen\s+paczk[a-ząćęłńóśźż]*|inpost[a-ząćęłńóśźż]*)[^.\n]{0,40}\b\d+(?:[,.]\d+)?\s*zł(?![a-ząćęłńóśźż])/i,
    label: 'Cena wysyłki w treści dla klientów',
    severity: 'warning',
    reason: 'W treściach dla klientów nie podajemy cen wysyłki (wystarczy informacja o wysyłce ORLEN Paczką i InPost).',
    skipWhenShippingPricesAllowed: true,
  },
  {
    id: 'ban-fake-reviews-stories',
    pattern:
      /\b(?:nasi\s+klienci\s+(?:piszą|mówią|chwalą)|recenzj[aeę]\s+klient[a-ząćęłńóśźż]*|prawdziw[a-ząćęłńóśźż]*\s+(?:histori[aeę]\s+z\s+drogi|przykład[a-ząćęłńóśźż]*\s+z\s+drogi)|opinie\s+(?:naszych\s+)?(?:klientów|podróżników)|zadowoleni\s+klienci|tysiące\s+(?:podróżników|klientów|osób|skanów)|100%\s+gwarancji)(?![a-ząćęłńóśźż])/i,
    label: 'Zmyślone opinie klientów lub historie z drogi',
    severity: 'error',
    reason:
      'Bramka „Pierwsze opinie klientów” nie jest zaliczona: nie wolno pisać zmyślonych recenzji, opinii ani historii z drogi przed odbyciem wyprawy.',
    requiresUnpassedReviewsGate: true,
  },
  {
    id: 'warn-pasja',
    pattern: /\bz\s+pasją(?![a-ząćęłńóśźż])|\bpasj[aąęi](?![a-ząćęłńóśźż])/i,
    label: 'Pusty frazes „pasja”',
    severity: 'warning',
    reason: 'Antywzorzec marki: zastąp konkretną sytuacją z wyjazdu lub gestem wręczenia.',
  },
  {
    id: 'warn-szyte',
    pattern:
      /\bszyt[aeey]\s+na\s+miarę(?![a-ząćęłńóśźż])|\bdedykowan[aey]\s+rozwiązani[ae](?![a-ząćęłńóśźż])|\bnajwyższ[aąe]\s+jakoś[ćc][a-ząćęłńóśźż]*|\bunikaln[aey]\s+doświadczeni[ae](?![a-ząćęłńóśźż])/i,
    label: 'Agencyjny żargon bez treści',
    severity: 'warning',
    reason:
      'Antywzorzec z Karty Głosu: zamień na konkret z sytuacji Podróżnika i Obdarowanego (podziękowanie w języku kraju docelowego, rejestracja QR na podrozowka.pl).',
  },
];

export function lintPodrozowkaCopy(
  text: string = '',
  options?: LintCopyOptions
): CopyLintFinding[] {
  const source = (text ?? '').trim();
  if (!source) return [];

  const findings: CopyLintFinding[] = [];
  for (const rule of ANTYWZORCE_RULES) {
    if (rule.requiresUnpassedReviewsGate && options?.reviewsGatePassed) {
      continue;
    }
    if (rule.skipWhenShippingPricesAllowed && options?.allowShippingPrices) {
      continue;
    }
    if (rule.ignoreIfPrecededByNegation) {
      const globalPattern = new RegExp(rule.pattern.source, 'gi');
      let execMatch: RegExpExecArray | null;
      while ((execMatch = globalPattern.exec(source)) !== null) {
        const prefix = source.slice(Math.max(0, execMatch.index - 28), execMatch.index);
        if (
          /(?:\bbez|\bbrak|\bzero|\bżadnych|\bnie\s+(?:ma|oferujemy|dajemy|stosujemy))\s+$/i.test(
            prefix
          )
        ) {
          continue;
        }
        findings.push({
          id: rule.id,
          severity: rule.severity,
          term: `${rule.label} („${execMatch[0].trim()}”)`,
          reason: rule.reason,
        });
        break;
      }
      continue;
    }
    const match = source.match(rule.pattern);
    if (match) {
      findings.push({
        id: rule.id,
        severity: rule.severity,
        term: `${rule.label} („${match[0].trim()}”)`,
        reason: rule.reason,
      });
    }
  }
  return findings;
}

export function getAntywzorceRulesSpec(): CopyLintRuleSummary[] {
  return ANTYWZORCE_RULES.map(({ id, label, severity, reason }) => ({
    id,
    label,
    severity,
    reason,
  }));
}
