import { Eye, Pause, Volume2, VolumeX } from 'lucide-react';
import type { CompanionState, FaceConfig, MoodState } from '../game/companionTypes';
import { SPECIES_META } from '../game/companionLogic';
import type { CameraFocus } from './CompanionViewport';

interface HudOverlayProps {
  faceConfig: FaceConfig;
  companionState: CompanionState;
  muted: boolean;
  cameraFocus: CameraFocus;
  onToggleMute: () => void;
  onToggleCameraFocus: () => void;
  onPause: () => void;
}

const MOOD_LABEL: Record<MoodState, { text: string; barColor: string; textColor: string }> = {
  happy: { text: 'Happy & Warm', barColor: '#10b981', textColor: '#6ee7b7' },
  curious: { text: 'Curious', barColor: '#38bdf8', textColor: '#7dd3fc' },
  teasing: { text: 'Playfully Teasing', barColor: '#f59e0b', textColor: '#fcd34d' },
  annoyed: { text: 'Getting Annoyed', barColor: '#f97316', textColor: '#fdba74' },
  angry: { text: 'Furious!', barColor: '#ef4444', textColor: '#fca5a5' },
};

export function HudOverlay({
  faceConfig,
  companionState,
  muted,
  cameraFocus,
  onToggleMute,
  onToggleCameraFocus,
  onPause,
}: HudOverlayProps) {
  const moodInfo = MOOD_LABEL[companionState.mood];

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Character & Mood Status Cluster */}
        <div
          data-testid="mood-panel"
          className="pointer-events-auto rounded-xl px-4 py-3 border border-white/12 shadow-xl max-w-[270px]"
          style={{ backgroundColor: 'rgba(16, 19, 25, 0.88)' }}
        >
          <div className="flex items-baseline gap-2">
            <h2 className="font-display font-bold text-lg text-stone-100 leading-tight truncate">
              {faceConfig.name}
            </h2>
            <span className="text-xs text-stone-400 whitespace-nowrap">
              · {SPECIES_META[faceConfig.species].label}
            </span>
          </div>

          <div
            data-testid="mood-label"
            className="text-xs font-semibold mt-0.5 mb-2.5"
            style={{ color: moodInfo.textColor }}
          >
            {moodInfo.text}
          </div>

          {/* Patience & Bond Meters */}
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
                <span>Patience</span>
                <span data-testid="patience-value" className="font-mono-num text-stone-200">
                  {Math.round(companionState.patience)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.round(companionState.patience)}%`,
                    backgroundColor: moodInfo.barColor,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
                <span>Friendship</span>
                <span className="font-mono-num text-stone-200">
                  {Math.round(companionState.affinity)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${Math.round(companionState.affinity)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Utility Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleCameraFocus();
            }}
            className={`h-10 px-3 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              cameraFocus === 'face'
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'text-stone-200 border-white/12 hover:bg-[#232833]'
            }`}
            style={
              cameraFocus === 'face'
                ? undefined
                : { backgroundColor: 'rgba(16, 19, 25, 0.88)' }
            }
            aria-label="Toggle face closeup camera"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">
              {cameraFocus === 'face' ? 'Full View' : 'Face Zoom'}
            </span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-10 h-10 rounded-lg border border-white/12 text-stone-200 hover:bg-[#232833] inline-flex items-center justify-center transition-colors shrink-0"
            style={{ backgroundColor: 'rgba(16, 19, 25, 0.88)' }}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-10 h-10 rounded-lg border border-white/12 text-stone-200 hover:bg-[#232833] inline-flex items-center justify-center transition-colors shrink-0"
            style={{ backgroundColor: 'rgba(16, 19, 25, 0.88)' }}
            aria-label="Pause game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
