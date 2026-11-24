import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AnimationCue,
  CareAction,
  ChatMessage,
  CompanionState,
  EnvironmentId,
  FaceConfig,
  SpeciesId,
} from './game/companionTypes';
import {
  applyCareAction,
  clampFaceConfig,
  createInitialCompanionState,
  DEFAULT_PRESETS,
  evaluateInteractionTurn,
  randomizeFaceConfig,
  SPECIES_META,
} from './game/companionLogic';
import {
  CompanionViewport,
  type CameraFocus,
  type TouchZone,
} from './components/CompanionViewport';
import { TitleOverlay } from './components/TitleOverlay';
import { HudOverlay } from './components/HudOverlay';
import { BottomDock, type DockTab, type TalkMode } from './components/BottomDock';
import { PauseModal } from './components/PauseModal';
import { soundEngine } from './audio/soundEngine';

type GameState = 'title' | 'playing' | 'paused';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export default function App() {
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [gameState, setGameState] = useState<GameState>(
    initialAutostart ? 'playing' : 'title'
  );
  const [faceConfig, setFaceConfig] = useState<FaceConfig>(DEFAULT_PRESETS.fox);
  const [companionState, setCompanionState] = useState<CompanionState>(
    createInitialCompanionState
  );
  const [environment, setEnvironment] = useState<EnvironmentId>('golden_loft');
  const [activeTab, setActiveTab] = useState<DockTab>('talk');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [talkMode, setTalkMode] = useState<TalkMode>('smart');
  const [cameraFocus, setCameraFocus] = useState<CameraFocus>('overview');
  const [muted, setMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [latestReply, setLatestReply] = useState<string | null>(
    'Hey! Ready to hang out in the loft—say hi or customize my look!'
  );
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [actionCueSignal, setActionCueSignal] = useState<{
    cue: AnimationCue;
    seq: number;
  }>({ cue: 'idle', seq: 0 });
  const [particleBurstSignal, setParticleBurstSignal] = useState<{
    kind: 'heart' | 'anger' | 'crumb';
    seq: number;
  }>({ kind: 'heart', seq: 0 });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const triggerCue = useCallback((cue: AnimationCue) => {
    setActionCueSignal((prev) => ({ cue, seq: prev.seq + 1 }));
  }, []);

  const triggerBurst = useCallback((kind: 'heart' | 'anger' | 'crumb') => {
    setParticleBurstSignal((prev) => ({ kind, seq: prev.seq + 1 }));
  }, []);

  // Sync game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const startGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.dataset.state = 'playing';
    setGameState('playing');
    soundEngine.playUiClick();
    triggerCue('wave');
  }, [triggerCue]);

  // Global keyboard shortcuts (Enter/Space on title, Esc/P pause, M mute, H hide dock)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (gameState === 'title') {
        if ((e.key === 'Enter' || e.key === ' ') && !isTyping) {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.key === 'Escape' || (e.key.toLowerCase() === 'p' && !isTyping)) {
        e.preventDefault();
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (isTyping || gameState !== 'playing') return;

      if (e.key.toLowerCase() === 'm') {
        setMuted((prev) => {
          const next = !prev;
          soundEngine.setMuted(next);
          return next;
        });
      } else if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        setCameraFocus((prev) => (prev === 'face' ? 'overview' : 'face'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, startGame]);

  const speakCompanionLine = useCallback(
    async (text: string, mood: CompanionState['mood'], species: SpeciesId) => {
      if (muted) return;
      try {
        const ttsRes = await fetch('/api/companion/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceName: SPECIES_META[species].voiceName,
            mood,
          }),
        });
        if (ttsRes.ok) {
          const ttsData = (await ttsRes.json()) as { audioBase64?: string };
          if (ttsData.audioBase64) {
            setLastAudioBase64(ttsData.audioBase64);
            await soundEngine.playWavBase64(ttsData.audioBase64);
            return;
          }
        }
      } catch {
        // Fall through to browser Web Speech synthesis if TTS network call fails
      }
      await soundEngine.speakBrowserFallback(
        text,
        species === 'rabbit' || species === 'fennec' ? 1.16 : 0.96
      );
    },
    [muted]
  );

  const handleSendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isThinking) return;

      setErrorMessage(null);
      setIsThinking(true);

      const { nextState, isRepeat } = evaluateInteractionTurn(
        companionState,
        text
      );
      setCompanionState(nextState);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text,
        mood: nextState.mood,
        timestamp: Date.now(),
      };
      const updatedHistory = [...history, userMsg].slice(-8);
      setHistory(updatedHistory);

      if (nextState.mood === 'angry' || (isRepeat && nextState.consecutiveRepeats >= 2)) {
        soundEngine.playAngryGrowl();
        triggerCue('angry_stomp');
        triggerBurst('anger');
      }

      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 25000);
        const res = await fetch('/api/companion/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            species: faceConfig.species,
            name: faceConfig.name,
            mood: nextState.mood,
            patience: nextState.patience,
            consecutiveRepeats: nextState.consecutiveRepeats,
            recentHistory: updatedHistory,
          }),
        });
        window.clearTimeout(timeoutId);

        const data = (await res.json()) as {
          reply?: string;
          actionCue?: AnimationCue;
          error?: string;
        };

        if (!res.ok || !data.reply) {
          throw new Error(data.error || 'Companion could not reply right now.');
        }

        setLatestReply(data.reply);
        setHistory((prev) =>
          [
            ...prev,
            {
              id: `c-${Date.now()}`,
              sender: 'companion' as const,
              text: data.reply!,
              mood: nextState.mood,
              timestamp: Date.now(),
            },
          ].slice(-8)
        );

        const cue: AnimationCue =
          nextState.mood === 'angry'
            ? 'angry_stomp'
            : data.actionCue || 'talk';
        triggerCue(cue);
        setIsThinking(false);

        await speakCompanionLine(
          data.reply,
          nextState.mood,
          faceConfig.species
        );
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        const msg = isAbort
          ? `${faceConfig.name} took too long to respond—please try again.`
          : err instanceof Error
            ? err.message
            : 'Unable to reach companion brain.';
        setErrorMessage(msg);
        setIsThinking(false);
      }
    },
    [
      companionState,
      faceConfig.name,
      faceConfig.species,
      history,
      isThinking,
      speakCompanionLine,
      triggerBurst,
      triggerCue,
    ]
  );

  const handleToggleMic = useCallback(async () => {
    setErrorMessage(null);

    if (isListening) {
      recognitionRef.current?.stop();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (talkMode === 'echo') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setIsListening(false);
          if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: recorder.mimeType });
            setLatestReply(`*${faceConfig.name} mimics your voice!*`);
            triggerCue('giggle');
            await soundEngine.playEchoRecording(
              blob,
              faceConfig.species === 'rabbit' ? 1.45 : 1.32
            );
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
      } catch {
        setErrorMessage(
          'Microphone permission is unavailable in this browser—type below to talk!'
        );
      }
      return;
    }

    // Smart AI Speech Recognition
    const SpeechRecCtor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }
    ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      setErrorMessage(
        'Live voice recognition is unsupported here—please type in the chat bar.'
      );
      return;
    }

    try {
      const rec = new SpeechRecCtor();
      rec.lang = 'en-IN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript?.trim();
        setIsListening(false);
        if (transcript) {
          void handleSendMessage(transcript);
        }
      };
      rec.onerror = (ev) => {
        setIsListening(false);
        if (ev.error !== 'aborted') {
          setErrorMessage(
            `Mic error (${ev.error}). You can also type directly below.`
          );
        }
      };
      rec.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setErrorMessage('Could not start microphone.');
    }
  }, [faceConfig.name, faceConfig.species, handleSendMessage, isListening, talkMode, triggerCue]);

  const handleSelectSpecies = useCallback(
    (species: SpeciesId) => {
      soundEngine.playUiClick();
      setFaceConfig(DEFAULT_PRESETS[species]);
      setCompanionState(createInitialCompanionState());
      setLatestReply(
        `Hi! I'm ${DEFAULT_PRESETS[species].name} the ${SPECIES_META[species].label}. Ask me anything!`
      );
      triggerCue('wave');
    },
    [triggerCue]
  );

  const handleRandomize = useCallback(() => {
    soundEngine.playUiClick();
    const next = randomizeFaceConfig();
    setFaceConfig(next);
    setCompanionState(createInitialCompanionState());
    setLatestReply(
      `Surprise! Meet ${next.name} the ${SPECIES_META[next.species].label}.`
    );
    triggerCue('happy_hop');
    triggerBurst('heart');
  }, [triggerBurst, triggerCue]);

  const handleUpdateFace = useCallback((patch: Partial<FaceConfig>) => {
    setFaceConfig((prev) => clampFaceConfig({ ...prev, ...patch }));
  }, []);

  const handleCareAction = useCallback(
    (action: CareAction) => {
      const next = applyCareAction(companionState, action);
      setCompanionState(next);

      if (action === 'pet') {
        soundEngine.playPurr();
        triggerCue('happy_hop');
        triggerBurst('heart');
        setLatestReply('Mmm, that feels so cozy! Thanks, friend.');
      } else if (action === 'boop') {
        soundEngine.playBoop();
        if (next.mood === 'angry') {
          soundEngine.playAngryGrowl();
          triggerCue('angry_stomp');
          triggerBurst('anger');
          setLatestReply("Hey! Don't boop my nose when I'm already mad!");
        } else {
          triggerCue('boop_sneeze');
          setLatestReply('Achoo! Hey, watch the wet nose!');
        }
      } else if (action === 'tickle') {
        soundEngine.playGiggle();
        triggerCue('giggle');
        triggerBurst('heart');
        setLatestReply('Hahaha! Stop, that tickles!');
      } else if (action === 'apologize') {
        soundEngine.playPurr();
        triggerCue('wave');
        triggerBurst('heart');
        setLatestReply("Alright, alright... I forgive you. Just don't nag me again!");
      } else {
        soundEngine.playCrunch();
        triggerCue('eat_treat');
        triggerBurst('crumb');
        const treatLabel =
          action === 'carrot'
            ? 'crunchy carrot'
            : action === 'pawpsicle'
              ? 'cherry pawpsicle'
              : 'wild berry shake';
        setLatestReply(`Delicious ${treatLabel}! Now my mood is way better.`);
      }
    },
    [companionState, triggerBurst, triggerCue]
  );

  const handleTouchZone = useCallback(
    (zone: TouchZone) => {
      if (zone === 'head' || zone === 'ear') handleCareAction('pet');
      else if (zone === 'nose') handleCareAction('boop');
      else handleCareAction('tickle');
    },
    [handleCareAction]
  );

  const handleChangeTab = useCallback((tab: DockTab) => {
    soundEngine.playUiClick();
    setActiveTab(tab);
    setDockCollapsed(false);
    if (tab === 'customize') {
      setCameraFocus('face');
    } else if (tab === 'care') {
      setCameraFocus('overview');
    }
  }, []);

  const handleReplayVoice = useCallback(() => {
    if (lastAudioBase64) {
      void soundEngine.playWavBase64(lastAudioBase64);
    } else if (latestReply) {
      void soundEngine.speakBrowserFallback(latestReply);
    }
  }, [lastAudioBase64, latestReply]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0e1116]">
      <CompanionViewport
        gameState={gameState}
        faceConfig={faceConfig}
        mood={companionState.mood}
        environment={environment}
        cameraFocus={cameraFocus}
        actionCueSignal={actionCueSignal}
        particleBurstSignal={particleBurstSignal}
        onTouchZone={handleTouchZone}
      />

      {gameState === 'title' && (
        <TitleOverlay
          species={faceConfig.species}
          onSelectSpecies={handleSelectSpecies}
          onRandomize={handleRandomize}
          onStart={startGame}
        />
      )}

      {gameState !== 'title' && (
        <>
          <HudOverlay
            faceConfig={faceConfig}
            companionState={companionState}
            muted={muted}
            cameraFocus={cameraFocus}
            onToggleMute={() => {
              const next = !muted;
              setMuted(next);
              soundEngine.setMuted(next);
            }}
            onToggleCameraFocus={() =>
              setCameraFocus((prev) => (prev === 'face' ? 'overview' : 'face'))
            }
            onPause={() => setGameState('paused')}
          />

          <BottomDock
            activeTab={activeTab}
            collapsed={dockCollapsed}
            talkMode={talkMode}
            isListening={isListening}
            isThinking={isThinking}
            latestReply={latestReply}
            errorMessage={errorMessage}
            faceConfig={faceConfig}
            environment={environment}
            onChangeTab={handleChangeTab}
            onToggleCollapsed={() => setDockCollapsed((prev) => !prev)}
            onChangeTalkMode={setTalkMode}
            onToggleMic={handleToggleMic}
            onSendMessage={handleSendMessage}
            onReplayVoice={handleReplayVoice}
            onUpdateFace={handleUpdateFace}
            onSelectSpecies={handleSelectSpecies}
            onRandomize={handleRandomize}
            onCareAction={handleCareAction}
            onSelectEnvironment={(env) => {
              soundEngine.playUiClick();
              setEnvironment(env);
            }}
          />
        </>
      )}

      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRandomize={handleRandomize}
          onReturnTitle={() => {
            soundEngine.stopSpeech();
            setGameState('title');
          }}
        />
      )}
    </main>
  );
}
