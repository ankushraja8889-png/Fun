import { useState, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Mic,
  MicOff,
  Palette,
  Send,
  Shuffle,
  Sliders,
  Volume2,
} from 'lucide-react';
import type {
  AccessoryId,
  CareAction,
  CoatPattern,
  EnvironmentId,
  EyeShapeStyle,
  FaceConfig,
  SpeciesId,
} from '../game/companionTypes';
import {
  REALISTIC_EYE_SWATCHES,
  REALISTIC_FUR_SWATCHES,
  SPECIES_META,
} from '../game/companionLogic';
import { ENVIRONMENT_META } from '../three/buildEnvironment';

export type DockTab = 'talk' | 'customize' | 'care';
export type TalkMode = 'smart' | 'echo';

interface BottomDockProps {
  activeTab: DockTab;
  collapsed: boolean;
  talkMode: TalkMode;
  isListening: boolean;
  isThinking: boolean;
  latestReply: string | null;
  errorMessage: string | null;
  faceConfig: FaceConfig;
  environment: EnvironmentId;
  onChangeTab: (tab: DockTab) => void;
  onToggleCollapsed: () => void;
  onChangeTalkMode: (mode: TalkMode) => void;
  onToggleMic: () => void;
  onSendMessage: (text: string) => void;
  onReplayVoice: () => void;
  onUpdateFace: (patch: Partial<FaceConfig>) => void;
  onSelectSpecies: (species: SpeciesId) => void;
  onRandomize: () => void;
  onCareAction: (action: CareAction) => void;
  onSelectEnvironment: (env: EnvironmentId) => void;
}

type CustomSubTab = 'species' | 'eyes' | 'sculpt' | 'coat';

export function BottomDock({
  activeTab,
  collapsed,
  talkMode,
  isListening,
  isThinking,
  latestReply,
  errorMessage,
  faceConfig,
  environment,
  onChangeTab,
  onToggleCollapsed,
  onChangeTalkMode,
  onToggleMic,
  onSendMessage,
  onReplayVoice,
  onUpdateFace,
  onSelectSpecies,
  onRandomize,
  onCareAction,
  onSelectEnvironment,
}: BottomDockProps) {
  const [draft, setDraft] = useState('');
  const [customSubTab, setCustomSubTab] = useState<CustomSubTab>('eyes');
  const [heterochromia, setHeterochromia] = useState(
    faceConfig.eyeColorLeft !== faceConfig.eyeColorRight
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isThinking) return;
    setDraft('');
    onSendMessage(trimmed);
  };

  return (
    <div
      className="fixed bottom-3 left-1/2 z-20 w-[min(900px,95vw)] flex flex-col items-center pointer-events-none transition-transform duration-200"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 34px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Error & Reply Banner stacked cleanly above Collapse Handle */}
      {errorMessage && (
        <div
          role="alert"
          className="pointer-events-auto mb-2 max-w-md px-4 py-2 rounded-lg border border-red-500/40 text-red-200 text-xs font-medium"
          style={{ backgroundColor: 'rgba(42, 16, 18, 0.94)' }}
        >
          {errorMessage}
        </div>
      )}

      {(isThinking || latestReply) && (
        <div
          data-testid="companion-reply-bubble"
          className="pointer-events-auto mb-2 max-w-xl px-4 py-2 rounded-xl border border-white/15 shadow-lg flex items-center gap-3"
          style={{ backgroundColor: 'rgba(16, 19, 25, 0.92)' }}
        >
          <p className="text-sm text-stone-100 leading-snug">
            {isThinking ? `${faceConfig.name} is listening & thinking...` : latestReply}
          </p>
          {!isThinking && latestReply && (
            <button
              type="button"
              onClick={onReplayVoice}
              className="p-1.5 rounded-md text-amber-400 hover:bg-white/10 transition-colors shrink-0"
              aria-label="Replay companion voice"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Collapse / Expand Handle */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="pointer-events-auto px-4 py-1.5 rounded-t-xl border border-b-0 border-white/14 text-xs font-medium text-stone-300 hover:text-white inline-flex items-center gap-1.5 transition-colors"
        style={{ backgroundColor: 'rgba(18, 21, 28, 0.94)' }}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      <div
        className="pointer-events-auto w-full rounded-2xl border border-white/14 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'rgba(16, 19, 25, 0.94)' }}
      >
        {/* Top Dock Navigation Tabs */}
        <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-2 border-b border-white/10">
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Studio Controls">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'talk'}
              onClick={() => onChangeTab('talk')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'talk'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:bg-white/8'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Talk</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'customize'}
              onClick={() => onChangeTab('customize')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'customize'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:bg-white/8'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="sm:hidden">Face</span>
              <span className="hidden sm:inline">Customize Face</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'care'}
              onClick={() => onChangeTab('care')}
              className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'care'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-300 hover:bg-white/8'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="sm:hidden">Care</span>
              <span className="hidden sm:inline">Care & World</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onRandomize}
            className="px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-white/8 border border-amber-500/25 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            aria-label="Randomize animal"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Randomize</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3 md:p-4">
          {activeTab === 'talk' && (
            <div className="space-y-2.5">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleMic}
                  className={`h-11 px-3.5 rounded-xl font-semibold text-xs inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 border ${
                    isListening
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-[#232834] text-stone-100 border-white/12 hover:bg-[#2d3444]'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Speak into microphone'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {isListening
                      ? talkMode === 'echo'
                        ? 'Recording...'
                        : 'Listening...'
                      : talkMode === 'echo'
                        ? 'Echo Mic'
                        : 'Voice Mic'}
                  </span>
                </button>

                <label htmlFor="companion-chat-input" className="sr-only">
                  Say something to your companion
                </label>
                <input
                  id="companion-chat-input"
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Say anything in English or Hinglish... (ask twice to test anger!)"
                  className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-[#0e1117] border border-white/12 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() || isThinking}
                  className="h-11 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-stone-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    'Hey, what is your name?',
                    'Kaise ho aaj?',
                    'Tell me a Zootopia secret!',
                    'Sorry yaar, calm down!',
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      disabled={isThinking}
                      onClick={() => onSendMessage(promptText)}
                      className="px-2.5 py-1 rounded-md bg-[#202530] hover:bg-[#2a3140] text-[11px] text-stone-300 border border-white/8 transition-colors whitespace-nowrap shrink-0"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                {/* Smart AI vs Classic Echo Mode */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0e1117] border border-white/10">
                  <button
                    type="button"
                    onClick={() => onChangeTalkMode('smart')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      talkMode === 'smart'
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Smart AI
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeTalkMode('echo')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      talkMode === 'echo'
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Echo Mimic
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-3">
              {/* Sub-navigation */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    ['species', 'Species & Name'],
                    ['eyes', 'Eyes & Gaze'],
                    ['sculpt', 'Face & Ears'],
                    ['coat', 'Fur & Outfit'],
                  ] as Array<[CustomSubTab, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCustomSubTab(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      customSubTab === key
                        ? 'bg-white/16 text-white'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {customSubTab === 'species' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-stone-400 mb-1.5">Animal Species</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(['fox', 'rabbit', 'red_panda', 'fennec'] as SpeciesId[]).map(
                        (sp) => (
                          <button
                            key={sp}
                            type="button"
                            onClick={() => onSelectSpecies(sp)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                              faceConfig.species === sp
                                ? 'bg-amber-500 text-stone-950 border-amber-400'
                                : 'bg-[#202530] text-stone-200 border-white/10 hover:bg-[#2a3140]'
                            }`}
                          >
                            {SPECIES_META[sp].label}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="companion-name-input"
                      className="block text-[11px] text-stone-400 mb-1.5"
                    >
                      Companion Name
                    </label>
                    <input
                      id="companion-name-input"
                      type="text"
                      maxLength={20}
                      value={faceConfig.name}
                      onChange={(e) => onUpdateFace({ name: e.target.value })}
                      className="w-full h-9 px-3 rounded-lg bg-[#0e1117] border border-white/12 text-sm text-stone-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {customSubTab === 'eyes' && (
                <div className="space-y-3 max-h-[168px] overflow-y-auto studio-scroll pr-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-stone-400">Eye Color</span>
                      {REALISTIC_EYE_SWATCHES.map((sw) => {
                        const active = faceConfig.eyeColorLeft === sw.hex;
                        return (
                          <button
                            key={sw.hex}
                            type="button"
                            onClick={() =>
                              onUpdateFace(
                                heterochromia
                                  ? { eyeColorLeft: sw.hex }
                                  : { eyeColorLeft: sw.hex, eyeColorRight: sw.hex }
                              )
                            }
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              active
                                ? 'border-amber-400 scale-110'
                                : 'border-white/25 hover:scale-105'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                            aria-label={`Set eye color ${sw.label}`}
                            title={sw.label}
                          />
                        );
                      })}
                    </div>

                    <label className="inline-flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heterochromia}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setHeterochromia(next);
                          if (!next) {
                            onUpdateFace({ eyeColorRight: faceConfig.eyeColorLeft });
                          }
                        }}
                        className="accent-amber-500"
                      />
                      <span>Dual Eye Color</span>
                    </label>
                  </div>

                  {heterochromia && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-stone-400">Right Eye</span>
                      {REALISTIC_EYE_SWATCHES.map((sw) => (
                        <button
                          key={`r-${sw.hex}`}
                          type="button"
                          onClick={() => onUpdateFace({ eyeColorRight: sw.hex })}
                          className={`w-5 h-5 rounded-full border-2 ${
                            faceConfig.eyeColorRight === sw.hex
                              ? 'border-amber-400 scale-110'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                          aria-label={`Set right eye color ${sw.label}`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-stone-400 mr-1">Eyelid Style</span>
                    {(['alert', 'slick', 'wide', 'sharp'] as EyeShapeStyle[]).map(
                      (style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => onUpdateFace({ eyeStyle: style })}
                          className={`px-2.5 py-1 rounded-md text-xs capitalize border transition-colors ${
                            faceConfig.eyeStyle === style
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                              : 'bg-[#202530] text-stone-300 border-white/10'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SliderControl
                      label="Eye Size"
                      value={faceConfig.eyeScale}
                      min={0.78}
                      max={1.25}
                      step={0.01}
                      onChange={(v) => onUpdateFace({ eyeScale: v })}
                    />
                    <SliderControl
                      label="Eye Spacing"
                      value={faceConfig.eyeSpacing}
                      min={0.85}
                      max={1.2}
                      step={0.01}
                      onChange={(v) => onUpdateFace({ eyeSpacing: v })}
                    />
                    <SliderControl
                      label="Pupil Dilation"
                      value={faceConfig.pupilSize}
                      min={0.25}
                      max={0.62}
                      step={0.01}
                      onChange={(v) => onUpdateFace({ pupilSize: v })}
                    />
                  </div>
                </div>
              )}

              {customSubTab === 'sculpt' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[168px] overflow-y-auto studio-scroll pr-1">
                  <SliderControl
                    label="Snout Length"
                    value={faceConfig.snoutLength}
                    min={0.75}
                    max={1.3}
                    step={0.01}
                    onChange={(v) => onUpdateFace({ snoutLength: v })}
                  />
                  <SliderControl
                    label="Cheek Plumpness"
                    value={faceConfig.cheekPlumpness}
                    min={0.8}
                    max={1.28}
                    step={0.01}
                    onChange={(v) => onUpdateFace({ cheekPlumpness: v })}
                  />
                  <SliderControl
                    label="Ear Length"
                    value={faceConfig.earLength}
                    min={0.75}
                    max={1.35}
                    step={0.01}
                    onChange={(v) => onUpdateFace({ earLength: v })}
                  />
                  <SliderControl
                    label="Ear Droop"
                    value={faceConfig.earDroop}
                    min={-0.25}
                    max={0.55}
                    step={0.01}
                    onChange={(v) => onUpdateFace({ earDroop: v })}
                  />
                  <SliderControl
                    label="Brow Thickness"
                    value={faceConfig.browThickness}
                    min={0.6}
                    max={1.4}
                    step={0.02}
                    onChange={(v) => onUpdateFace({ browThickness: v })}
                  />
                  <SliderControl
                    label="Whiskers"
                    value={faceConfig.whiskerDensity}
                    min={0}
                    max={1}
                    step={0.5}
                    onChange={(v) => onUpdateFace({ whiskerDensity: v })}
                  />
                </div>
              )}

              {customSubTab === 'coat' && (
                <div className="space-y-3 max-h-[168px] overflow-y-auto studio-scroll pr-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-stone-400 inline-flex items-center gap-1">
                      <Palette className="w-3 h-3" /> Fur Coat
                    </span>
                    {REALISTIC_FUR_SWATCHES.map((sw) => {
                      const active = faceConfig.primaryFur === sw.primary;
                      return (
                        <button
                          key={sw.label}
                          type="button"
                          onClick={() =>
                            onUpdateFace({
                              primaryFur: sw.primary,
                              secondaryFur: sw.secondary,
                            })
                          }
                          className={`px-2.5 py-1 rounded-md text-[11px] border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            active
                              ? 'border-amber-400 bg-white/12 text-white'
                              : 'border-white/10 bg-[#202530] text-stone-300'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-white/25"
                            style={{ backgroundColor: sw.primary }}
                          />
                          <span>{sw.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-400">Pattern</span>
                      {(['solid', 'freckled', 'tabby', 'tuxedo'] as CoatPattern[]).map(
                        (pat) => (
                          <button
                            key={pat}
                            type="button"
                            onClick={() => onUpdateFace({ coatPattern: pat })}
                            className={`px-2 py-1 rounded text-[11px] capitalize border ${
                              faceConfig.coatPattern === pat
                                ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                                : 'bg-[#202530] text-stone-300 border-white/10'
                            }`}
                          >
                            {pat}
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-stone-400">Outfit</span>
                      {(
                        [
                          ['none', 'Classic'],
                          ['police_vest', 'Ranger Vest'],
                          ['floral_tie', 'Silk Tie'],
                          ['knit_scarf', 'Scarf'],
                          ['aviators', 'Aviators'],
                        ] as Array<[AccessoryId, string]>
                      ).map(([accId, label]) => (
                        <button
                          key={accId}
                          type="button"
                          onClick={() => onUpdateFace({ accessory: accId })}
                          className={`px-2 py-1 rounded text-[11px] border whitespace-nowrap shrink-0 ${
                            faceConfig.accessory === accId
                              ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                              : 'bg-[#202530] text-stone-300 border-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-stone-400 mb-1.5">
                  Play, Feed & Calm Down
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['pet', 'Pet Head'],
                      ['boop', 'Boop Nose'],
                      ['tickle', 'Tickle'],
                      ['carrot', 'Feed Carrot'],
                      ['pawpsicle', 'Pawpsicle'],
                      ['berry', 'Berry Shake'],
                      ['apologize', 'Say Sorry'],
                    ] as Array<[CareAction, string]>
                  ).map(([action, label]) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => onCareAction(action)}
                      className="px-3.5 py-2 rounded-lg bg-[#202530] hover:bg-[#2a3142] text-stone-100 border border-white/10 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-stone-400 mb-1.5">
                  Metropolis Backdrop
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ENVIRONMENT_META) as EnvironmentId[]).map((envId) => (
                    <button
                      key={envId}
                      type="button"
                      onClick={() => onSelectEnvironment(envId)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                        environment === envId
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-semibold'
                          : 'bg-[#202530] text-stone-300 border-white/10 hover:bg-[#2a3142]'
                      }`}
                    >
                      {ENVIRONMENT_META[envId].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px] text-stone-300 mb-1">
        <span>{label}</span>
        <span className="font-mono-num text-stone-400">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full studio-slider"
      />
    </label>
  );
}
