import type { SpeciesId } from '../game/companionTypes';
import { SPECIES_META } from '../game/companionLogic';
import { Shuffle, Sparkles } from 'lucide-react';

interface TitleOverlayProps {
  species: SpeciesId;
  onSelectSpecies: (species: SpeciesId) => void;
  onRandomize: () => void;
  onStart: () => void;
}

export function TitleOverlay({
  species,
  onSelectSpecies,
  onRandomize,
  onStart,
}: TitleOverlayProps) {
  return (
    <div
      data-testid="title-overlay"
      className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-12 pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, rgba(14,17,22,0.88) 0%, rgba(14,17,22,0.58) 42%, rgba(14,17,22,0.08) 78%, rgba(14,17,22,0.0) 100%)',
      }}
    >
      <div className="max-w-lg my-auto pointer-events-auto">
        {/* Bespoke inline SVG Title Lockup */}
        <svg
          viewBox="0 0 420 118"
          className="w-full max-w-[380px] h-auto mb-5"
          aria-label="ZooPals 3D Title Emblem"
        >
          <defs>
            <linearGradient id="zooAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          {/* Stylized Fox & Rabbit silhouette crest */}
          <g transform="translate(8, 12)">
            <path
              d="M28 52 C14 52 8 38 14 24 L10 4 L26 16 C30 14 36 14 40 16 L56 4 L52 24 C58 38 52 52 38 52 Z"
              fill="url(#zooAmber)"
              opacity="0.95"
            />
            <circle cx="25" cy="31" r="3" fill="#14171f" />
            <circle cx="41" cy="31" r="3" fill="#14171f" />
            <path d="M30 39 L36 39 L33 43 Z" fill="#14171f" />
          </g>
          <text
            x="84"
            y="56"
            fill="#fafaf9"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="46"
            letterSpacing="-1.2"
          >
            ZooPals 3D
          </text>
          <text
            x="86"
            y="84"
            fill="#d6d3d1"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="500"
            fontSize="15"
            letterSpacing="0.3"
          >
            Metropolis Companion Studio
          </text>
          <line
            x1="86"
            y1="98"
            x2="264"
            y2="98"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <p className="text-stone-300 text-base leading-relaxed max-w-md mb-6">
          Talk in your own voice, sculpt every facial detail from eyes to coat,
          and test their patience—ask the same question too many times and
          watch them lose their cool.
        </p>

        {/* Companion Starter Selector */}
        <div className="mb-7">
          <div className="text-xs font-medium text-stone-400 mb-2">
            Choose starting companion
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['fox', 'rabbit', 'red_panda', 'fennec'] as SpeciesId[]).map(
              (id) => {
                const active = species === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectSpecies(id)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 border ${
                      active
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-[#1a1e26] text-stone-200 border-white/10 hover:bg-[#242934]'
                    }`}
                  >
                    {SPECIES_META[id].label}
                  </button>
                );
              }
            )}
            <button
              type="button"
              onClick={onRandomize}
              className="px-3.5 py-2 rounded-lg text-sm font-medium bg-[#1a1e26] text-amber-300 border border-amber-500/30 hover:bg-[#242934] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              aria-label="Surprise random animal"
            >
              <Shuffle className="w-4 h-4" />
              <span>Surprise Me</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          data-start="true"
          onClick={onStart}
          className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-display font-bold text-base tracking-tight transition-all inline-flex items-center gap-2.5 shadow-lg shadow-amber-950/40"
        >
          <Sparkles className="w-4 h-4" />
          <span>Enter Loft</span>
        </button>
      </div>

      {/* Single flat control hint line */}
      <div className="text-xs text-stone-400 font-medium tracking-wide">
        Click Companion to Pet or Boop · Speak or Type to Chat · Esc Pause
      </div>
    </div>
  );
}
