// =============================================================================
// useAudio — expo-av audio hook for devotional audio playback
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioState {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  speed: number;
  error: string | null;
}

interface UseAudioPlayerReturn {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether audio is buffering */
  isBuffering: boolean;
  /** Whether audio has been loaded */
  isLoaded: boolean;
  /** Current playback position in milliseconds */
  position: number;
  /** Total duration in milliseconds */
  duration: number;
  /** Current playback speed */
  speed: number;
  /** Error message if any */
  error: string | null;
  /** Load and play audio from URL */
  loadAndPlay: (url: string, startPosition?: number) => Promise<void>;
  /** Toggle play/pause */
  togglePlayPause: () => Promise<void>;
  /** Seek to position in milliseconds */
  seekTo: (ms: number) => Promise<void>;
  /** Skip backward (default 15s) */
  skipBack: (seconds?: number) => Promise<void>;
  /** Skip forward (default 30s) */
  skipForward: (seconds?: number) => Promise<void>;
  /** Change playback speed */
  setSpeed: (speed: number) => Promise<void>;
  /** Stop and unload */
  unload: () => Promise<void>;
}

export function useAudioPlayer(audioUrl?: string): UseAudioPlayerReturn {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isBuffering: false,
    isLoaded: false,
    position: 0,
    duration: 0,
    speed: 1.0,
    error: null,
  });

  const soundRef = useRef<{
    playAsync: () => Promise<void>;
    pauseAsync: () => Promise<void>;
    setPositionAsync: (ms: number) => Promise<void>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean) => Promise<void>;
    getStatusAsync: () => Promise<{
      isLoaded: boolean;
      isPlaying: boolean;
      isBuffering: boolean;
      positionMillis: number;
      durationMillis: number;
      rate: number;
      error?: string;
    }>;
    unloadAsync: () => Promise<void>;
  } | null>(null);

  const SoundConstructorRef = useRef<{
    createAsync: (
      source: { uri: string },
      initialStatus: Record<string, unknown>,
      onPlaybackStatusUpdate: (status: Record<string, unknown>) => void,
    ) => Promise<typeof soundRef.current>;
  } | null>(null);

  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Lazy-load expo-av ──────────────────────────────────────────────────────

  const ensureAv = useCallback(async (): Promise<boolean> => {
    if (SoundConstructorRef.current) return true;
    try {
      const expoAv = await import('expo-av');
      SoundConstructorRef.current = expoAv.Audio.Sound;
      return true;
    } catch {
      setState((prev) => ({
        ...prev,
        error: 'Audio playback is not available on this device.',
      }));
      return false;
    }
  }, []);

  // ── Clear update interval on unmount ──────────────────────────────────────

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      // Unload sound on unmount
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // ── Status update poller ──────────────────────────────────────────────────

  const startStatusUpdates = useCallback(() => {
    if (updateIntervalRef.current) return;
    updateIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) return;
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          setState((prev) => ({
            ...prev,
            isLoaded: true,
            isPlaying: status.isPlaying,
            isBuffering: status.isBuffering,
            position: status.positionMillis,
            duration: status.durationMillis,
            speed: status.rate,
          }));
        }
      } catch {
        // Sound may have been unloaded between interval ticks
      }
    }, 250);
  }, []);

  const stopStatusUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // ── Load and play ──────────────────────────────────────────────────────────

  const loadAndPlay = useCallback(
    async (url: string, startPosition = 0): Promise<void> => {
      const available = await ensureAv();
      if (!available || !SoundConstructorRef.current) return;

      setState((prev) => ({ ...prev, isBuffering: true, error: null }));

      try {
        // Unload any existing sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await SoundConstructorRef.current.createAsync(
          { uri: url },
          {
            shouldPlay: true,
            positionMillis: startPosition,
            rate: state.speed,
            shouldCorrectPitch: true,
            progressUpdateIntervalMillis: 250,
          },
          () => {
            // onPlaybackStatusUpdate is handled by our interval poller
          },
        );

        soundRef.current = sound;

        const status = await sound.getStatusAsync();
        setState({
          isPlaying: status.isPlaying,
          isBuffering: false,
          isLoaded: true,
          position: status.positionMillis,
          duration: status.durationMillis,
          speed: state.speed,
          error: null,
        });

        startStatusUpdates();
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isBuffering: false,
          isLoaded: false,
          error:
            err instanceof Error
              ? err.message
              : 'Could not load audio. Please try again.',
        }));
      }
    },
    [ensureAv, state.speed, startStatusUpdates],
  );

  // ── Toggle play/pause ─────────────────────────────────────────────────────

  const togglePlayPause = useCallback(async (): Promise<void> => {
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        stopStatusUpdates();
        setState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        await soundRef.current.playAsync();
        startStatusUpdates();
        setState((prev) => ({ ...prev, isPlaying: true }));
      }
    } catch {
      // Ignore playback state toggle errors
    }
  }, [startStatusUpdates, stopStatusUpdates]);

  // ── Seek ──────────────────────────────────────────────────────────────────

  const seekTo = useCallback(async (ms: number): Promise<void> => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(ms);
      setState((prev) => ({ ...prev, position: ms }));
    } catch {
      // Ignore seek errors
    }
  }, []);

  const skipBack = useCallback(
    async (seconds = 15): Promise<void> => {
      const newPos = Math.max(0, state.position - seconds * 1000);
      await seekTo(newPos);
    },
    [state.position, seekTo],
  );

  const skipForward = useCallback(
    async (seconds = 30): Promise<void> => {
      const newPos = Math.min(state.duration, state.position + seconds * 1000);
      await seekTo(newPos);
    },
    [state.position, state.duration, seekTo],
  );

  // ── Set speed ─────────────────────────────────────────────────────────────

  const setSpeed = useCallback(
    async (speed: number): Promise<void> => {
      const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
      setState((prev) => ({ ...prev, speed: clampedSpeed }));

      if (soundRef.current) {
        try {
          await soundRef.current.setRateAsync(clampedSpeed, true);
        } catch {
          // Ignore rate change errors
        }
      }
    },
    [],
  );

  // ── Unload ────────────────────────────────────────────────────────────────

  const unload = useCallback(async (): Promise<void> => {
    stopStatusUpdates();
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // Ignore unload errors
      }
      soundRef.current = null;
    }
    setState({
      isPlaying: false,
      isBuffering: false,
      isLoaded: false,
      position: 0,
      duration: 0,
      speed: state.speed,
      error: null,
    });
  }, [stopStatusUpdates, state.speed]);

  return {
    isPlaying: state.isPlaying,
    isBuffering: state.isBuffering,
    isLoaded: state.isLoaded,
    position: state.position,
    duration: state.duration,
    speed: state.speed,
    error: state.error,
    loadAndPlay,
    togglePlayPause,
    seekTo,
    skipBack,
    skipForward,
    setSpeed,
    unload,
  };
}
