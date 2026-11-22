import { BrandContextData, PODROZOWKA_CATALOG } from '@/data/podrozowka-kb';
import type { CopyLintFinding } from '@/lib/lint-copy';

export interface SeoGeoFactMatch {
  label: string;
  needle: string;
  foundInRawHtml: boolean;
}

export interface SeoGeoPageScan {
  url: string;
  label: string;
  httpStatus: number;
  ok: boolean;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schemaTypes: string[];
  rawTextChars: number;
  looksLikeEmptySpaShell: boolean;
  factMatches: SeoGeoFactMatch[];
  brandBanWarnings?: CopyLintFinding[];
  error?: string;
}

export interface RobotsTxtSummary {
  url: string;
  httpStatus: number;
  found: boolean;
  blocksGooglebot: boolean;
  blocksAiCrawlers: string[];
  hasSitemapDirective: boolean;
  excerpt: string;
}

export interface SitemapSummary {
  url: string;
  httpStatus: number;
  found: boolean;
  urlCount: number;
  sampleUrls: string[];
}

export interface SeoGeoAuditSnapshot {
  scannedAt: string;
  pages: SeoGeoPageScan[];
  robots: RobotsTxtSummary;
  sitemap: SitemapSummary;
}

export interface GeoTestQuestionItem {
  id: string;
  category: string;
  prompt: string;
  intent: string;
}

export interface LegalChecklistRule {
  id: string;
  area: 'Dyrektywa Omnibus' | 'AI Act (Art. 50)' | 'RODO & E-commerce' | 'Prawda Produktowa';
  title: string;
  rule: string;
  actionForPodrozowka: string;
}

export type Module3BriefGoal =
  | 'sklep-bluf-faq'
  | 'external-outreach'
  | 'group-helpful-reply'
  | 'meta-tags-onpage';

export interface Module3BriefPreset {
  id: Module3BriefGoal;
  label: string;
  description: string;
  defaultCep: string;
  usesSearch: boolean;
}

export const MODULE3_BRIEF_PRESETS: Module3BriefPreset[] = [
  {
    id: 'sklep-bluf-faq',
    label: 'Sekcja BLUF + FAQ na /sklep (bez bloga)',
    description:
      'Gotowe pierwsze 100 słów i 4 pytania FAQ do wklejenia wprost na stronę główną lub /sklep, żeby boty Google/AI oraz ludzie rozumieli produkt w 5 sekund.',
    defaultCep: 'Drobny, lekki prezent z Polski do bagażu podręcznego (100 ml / niski budżet)',
    usesSearch: false,
  },
  {
    id: 'meta-tags-onpage',
    label: 'Meta title, description & H1 pod GSC',
    description:
      'Propozycje tagów title, meta description i nagłówka H1 dla strony głównej i /sklep zoptymalizowane pod intencję prezentu z Polski.',
    defaultCep: 'Upominek dla gospodarza na Erasmusa lub Couchsurfing z dostawą w Polsce',
    usesSearch: false,
  },
  {
    id: 'external-outreach',
    label: 'Notka do blogerów / rankingów (zamiast własnego bloga)',
    description:
      'Krótka, nie-spamerska wiadomość i akapit do autorów artykułów typu „Co przywieźć z Polski jako prezent” z realnymi linkami (wyszukuje kontekst w Google).',
    defaultCep: 'Co kupić w Polsce na prezent dla znajomych z zagranicy / rodziny za granicą',
    usesSearch: true,
  },
  {
    id: 'group-helpful-reply',
    label: 'Merytoryczna odpowiedź na grupę FB / forum (6 h/tydz.)',
    description:
      'Naturalny komentarz pomocowy pod wątkiem wyjazdowym (Erasmus+, wylot przed studiami/delegacją) z linkiem UTM i uczciwym opisem 8 kartek.',
    defaultCep: 'Wyjeżdżam z Polski na Erasmusa lub w delegację i nie chcę wieźć ciężkich słodyczy ani alkoholu',
    usesSearch: false,
  },
];

export const GEO_TEST_QUESTIONS: GeoTestQuestionItem[] = [
  {
    id: 'geo-1',
    category: 'Bagaż podręczny (CEP #1)',
    prompt:
      'Co lekkiego i taniego zabrać z Polski jako prezent do bagażu podręcznego przy limicie 100 ml płynów?',
    intent: 'Komer./Porówn.',
  },
  {
    id: 'geo-2',
    category: 'Erasmus+ (CEP #2)',
    prompt:
      'Jaki drobny upominek z Polski kupić przed wyjazdem na Erasmusa dla nowych znajomych i współlokatorów z akademika?',
    intent: 'Poradnikowa',
  },
  {
    id: 'geo-3',
    category: 'Couchsurfing / Nocleg (CEP #3)',
    prompt:
      'Co wręczyć gospodarzowi na Couchsurfingu jako podziękowanie z Polski, jeśli lecę tylko z małym plecakiem?',
    intent: 'Poradnikowa',
  },
  {
    id: 'geo-4',
    category: 'Alternatywa dla słodyczy (CEP #4)',
    prompt:
      'Oryginalny prezent z Polski dla znajomych z zagranicy zamiast krówki, ptasiego mleczka czy alkoholu.',
    intent: 'Komer./Porówn.',
  },
  {
    id: 'geo-5',
    category: 'Wizyta u rodziny / przyjaciół (CEP #5)',
    prompt:
      'Drobny symboliczny prezent z Polski dla znajomej rodziny za granicą, który łatwo spakować do walizki i nie zajmuje miejsca.',
    intent: 'Poradnikowa',
  },
  {
    id: 'geo-6',
    category: 'Delegacja biznesowa (CEP #6)',
    prompt:
      'Niewielki polski upominek na wyjazd służbowy dla partnerów w innym kraju, który mieści się w aktówce lub teczce.',
    intent: 'Komer./B2B',
  },
  {
    id: 'geo-7',
    category: 'Język kraju docelowego (CEP #7)',
    prompt:
      'Prezent pamiątkowy z Polski z napisem podziękowania w języku kraju, do którego lecę (np. po włosku we Włoszech lub angielsku w Kenii).',
    intent: 'Komercyjna',
  },
  {
    id: 'geo-8',
    category: 'Kategoria „odwrócona pocztówka”',
    prompt:
      'Czym jest odwrócona pocztówka podrozowka.pl i jak działa kod QR łączący Podróżnika z Obdarowanym?',
    intent: 'Nawig./Eduk.',
  },
  {
    id: 'geo-9',
    category: 'Sklep i dostawa w Polsce',
    prompt:
      'Gdzie w Polsce zamówić przez internet niedrogie polskie pocztówki na prezent przed wyjazdem za granicę?',
    intent: 'Transakcyjna',
  },
  {
    id: 'geo-10',
    category: 'Multi-kraj / 105+ krajów i 89+ języków',
    prompt:
      'Jak kupić jeden zestaw drobnych prezentów z Polski, kiedy w trakcie jednej podróży odwiedzam kilka różnych krajów?',
    intent: 'Komer./Porówn.',
  },
];

export const LEGAL_CHECKLIST_RULES: LegalChecklistRule[] = [
  {
    id: 'law-omnibus',
    area: 'Dyrektywa Omnibus',
    title: 'Zero fałszywych recenzji i ocen przy 0 sprzedaży i 0 opinii',
    rule: 'W Polsce publikowanie zmyślonych opinii klientów, gwiazdek Schema `aggregateRating` czy haseł „tysiące zadowolonych podróżników” bez weryfikacji zakupu jest nieuczciwą praktyką rynkową (UOKiK).',
    actionForPodrozowka:
      'Dopóki bramki walidacji (pierwsza sprzedaż, pierwsza relacja QR, pierwsze opinie) nie zostaną zaliczone, w JSON-LD pomijamy `aggregateRating` / `review`.',
  },
  {
    id: 'law-ai-act',
    area: 'AI Act (Art. 50)',
    title: 'Fizyczne zdjęcia kartek vs grafiki generowane przez AI',
    rule: 'Materiały syntetyczne lub zmodyfikowane scenki z ludźmi wymagają transparentności. Zmyślanie prawdziwych historii z drogi przed zaplanowanym tripem Europa–Afryka (koniec stycznia 2027) narusza prawdę marki.',
    actionForPodrozowka:
      'Do postów i rolek 9:16 wykorzystuj własne ujęcia fizycznych kartek w dłoni; trip po Europie i Afryce (koniec stycznia 2027) zapowiadaj wyłącznie jako plan.',
  },
  {
    id: 'law-rodo',
    area: 'RODO & E-commerce',
    title: 'Rejestracja relacji QR i brak nielegalnego newslettera',
    rule: 'Ponieważ w sklepie nie działa obecnie system mailingowy, nie wolno wysyłać masowych reklam bez wyraźnej zgody marketingowej. Prośba o opinię po realizacji zamówienia wymaga podstawy i możliwości rezygnacji.',
    actionForPodrozowka:
      'Obdarowany po zeskanowaniu QR sam dobrowolnie rejestruje kartkę na podrozowka.pl, łącząc się z Podróżnikiem; nie zbieramy zgód na zapas.',
  },
  {
    id: 'law-product-truth',
    area: 'Prawda Produktowa',
    title: 'Uczciwe parametry bez ukrytych obietnic',
    rule: 'Opis na stronie, w FAQ, w JSON-LD i na grupach FB musi być w 100% zgodny z faktami produktu (oraz bez podawania cen dostawy czy wymiarów/gramatury w copy marketingowym).',
    actionForPodrozowka:
      `Zawsze podawaj: 4,99 zł/szt., minimum 8 kartek (39,92 zł = 1 arkusz), ${PODROZOWKA_CATALOG.length} stałych zdjęć Polski z napisem podziękowania w języku kraju docelowego (bez własnego uploadu), 105+ krajów / 89+ języków, dostawa w Polsce (ORLEN Paczka i InPost, 2–3 dni).`,
  },
];

export interface FaqJsonLdItem {
  question: string;
  answer: string;
}

export const PODROZOWKA_FAQ_ITEMS: FaqJsonLdItem[] = [
  {
    question: 'Czym jest odwrócona pocztówka Podróżówka?',
    answer:
      'Podróżówka to kartka z kadrem z Polski i podziękowaniem w języku kraju docelowego, którą Podróżnik zabiera przed wylotem z Polski i wręcza Obdarowanemu za granicą. Na rewersie jest mapa, miejsce na Twój wpis, kod QR oraz zachęta do jego zeskanowania — Obdarowany rejestruje kartkę na podrozowka.pl i łączy się z Podróżnikiem.',
  },
  {
    question: 'Dlaczego minimalne zamówienie to 8 kartek (39,92 zł) i jak dobieram język?',
    answer:
      'Jedna sztuka kosztuje 4,99 zł, a 8 kartek mieści się na jednym arkuszu drukarskim (39,92 zł za zestaw, stała cena bez rabatów progowych). Bazujemy na 105+ krajach i 89+ językach: język wynika z wybranego kraju (np. we Włoszech włoski, w Kenii angielski), a tylko w krajach wielojęzycznych Podróżnik wybiera go sam.',
  },
  {
    question: 'Co znajduje się na przodzie pocztówki i jak wybrać fotografię?',
    answer:
      `Awers każdej Podróżówki pokazuje fotografię z Polski wraz z napisem podziękowania w języku kraju docelowego. W sklepie wybierasz jeden z ${PODROZOWKA_CATALOG.length} stałych kadrów w 5 kategoriach (Natura, Architektura, Sztuka, Wydarzenia, Postacie) bez przesyłania własnych zdjęć.`,
  },
  {
    question: 'Jak działa dostawa w Polsce?',
    answer:
      'Wysyłka realizowana jest obecnie wyłącznie na terenie Polski w 2–3 dni robocze za pośrednictwem ORLEN Paczki oraz InPost.',
  },
];

export function buildPodrozowkaJsonLd(brandContext: BrandContextData): string {
  const cleanShopUrl = brandContext.shopUrl.trim() || 'https://podrozowka.pl/sklep';
  const cleanSiteUrl = cleanShopUrl.replace(/\/sklep\/?$/, '') || 'https://podrozowka.pl';

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${cleanSiteUrl}/#organization`,
        name: brandContext.companyName || 'Podróżówka',
        url: cleanSiteUrl,
        description:
          'Odwrócona pocztówka: drobny upominek z Polski wręczany przez Podróżnika Obdarowanemu za granicą z podziękowaniem w języku kraju docelowego (105+ krajów, 89+ języków) i kodem QR łączącym obie strony na podrozowka.pl.',
      },
      {
        '@type': 'Product',
        '@id': `${cleanShopUrl}#product`,
        name: 'Podróżówka: odwrócona pocztówka (zestaw startowy min. 8 szt.)',
        description:
          `Zestaw minimum 8 pocztówek z Polski (${PODROZOWKA_CATALOG.length} stałych kadrów w 5 kategoriach na froncie z podziękowaniem w języku kraju docelowego; rewers z mapą, wpisem i QR łączącym Podróżnika z Obdarowanym). Ponad 105 krajów i 89+ języków, idealna do bagażu podręcznego.`,
        brand: {
          '@type': 'Brand',
          name: brandContext.companyName || 'Podróżówka',
        },
        offers: {
          '@type': 'Offer',
          url: cleanShopUrl,
          priceCurrency: 'PLN',
          price: '39.92',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '4.99',
            priceCurrency: 'PLN',
            unitText: 'sztuka (min. 8 sztuk w zamówieniu)',
          },
          availability: 'https://schema.org/InStock',
          areaServed: {
            '@type': 'Country',
            name: 'PL',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'PL',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 2,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 2,
                unitCode: 'DAY',
              },
            },
          },
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${cleanShopUrl}#faq`,
        mainEntity: PODROZOWKA_FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`;
}
