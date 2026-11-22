'use client';

import { AI_MARKETERS_MODULES } from '@/data/podrozowka-kb';

export default function TrainingBasePanel() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E8E1D3] rounded-2xl p-6">
        <h2 className="text-xl font-bold text-[#121926]">
          Baza Wiedzy ze Szkolenia
        </h2>
        <p className="text-sm text-[#414751] mt-1">
          Zestawienie frameworków, narzędzi oraz konkretnego sposobu wdrożenia ich w systemie agentów podrozowka.pl.
        </p>
      </div>

      <div className="space-y-4">
        {AI_MARKETERS_MODULES.map((mod) => (
          <section
            key={mod.id}
            className="bg-white border border-[#E8E1D3] rounded-2xl p-6 space-y-4"
          >
            <div className="border-b border-[#F1ECE1] pb-3">
              <p className="text-xs font-semibold text-[#5B2182]">{mod.moduleNumber}</p>
              <h3 className="text-lg font-bold text-[#121926] mt-0.5">{mod.title}</h3>
              <p className="text-sm text-[#414751] mt-1">{mod.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-[#121926]">Użyte frameworki i metody</p>
                <ul className="space-y-1.5 text-[#414751]">
                  {mod.frameworks.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-[#121926]">Artefakty i wdrożenie w aplikacji</p>
                <ul className="space-y-1.5 text-[#414751]">
                  {mod.deliverables.map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                </ul>
                <p className="pt-2 font-semibold text-[#5B2182]">
                  Wdrożenie w systemie: {mod.appliedInApp}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
