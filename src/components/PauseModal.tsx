import { Play, RotateCcw, Shuffle } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRandomize: () => void;
  onReturnTitle: () => void;
}

export function PauseModal({
  onResume,
  onRandomize,
  onReturnTitle,
}: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10, 12, 17, 0.78)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/14 p-6 shadow-2xl"
        style={{ backgroundColor: '#151922' }}
      >
        <h2 className="font-display font-bold text-2xl text-stone-100 mb-1">
          Studio Paused
        </h2>
        <p className="text-sm text-stone-400 mb-6">
          Take a breather or swap in a fresh companion.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Resume Companion</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onRandomize();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#202634] hover:bg-[#2a3244] text-stone-100 border border-white/10 font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
            <span>Randomize Animal</span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full py-3 px-4 rounded-xl bg-transparent hover:bg-white/5 text-stone-300 border border-white/10 font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Back to Title</span>
          </button>
        </div>
      </div>
    </div>
  );
}
