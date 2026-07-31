import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  type LayoutChangeEvent,
} from 'react-native';
import { useAudioPlayer } from '@/hooks/useAudio';
import { useTheme } from '@/hooks/useTheme';
import { UIFontFamily } from '@/constants/theme';

interface AudioMiniPlayerProps {
  audioUrl: string;
  title: string;
  scriptureRef?: string;
  onExpand?: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [1, 1.25, 1.5] as const;

export function AudioMiniPlayer({
  audioUrl,
  title,
  scriptureRef,
  onExpand,
}: AudioMiniPlayerProps): React.ReactElement {
  const { palette } = useTheme();
  const {
    isPlaying,
    isBuffering,
    isLoaded,
    position,
    duration,
    speed,
    error,
    loadAndPlay,
    togglePlayPause,
    seekTo,
    skipBack,
    skipForward,
    setSpeed,
  } = useAudioPlayer();

  // ── Auto-load audio on mount ───────────────────────────────────────────────

  React.useEffect(() => {
    if (audioUrl) {
      void loadAndPlay(audioUrl, 0);
    }
  }, [audioUrl, loadAndPlay]);

  // ── Handle progress bar press ──────────────────────────────────────────────

  const progressFraction = duration > 0 ? position / duration : 0;

  const handleProgressPress = useCallback(
    (event: { nativeEvent: { locationX: number } }, layoutWidth: number) => {
      if (duration <= 0) return;
      const fraction = Math.max(0, Math.min(1, event.nativeEvent.locationX / layoutWidth));
      void seekTo(fraction * duration);
    },
    [duration, seekTo],
  );

  // ── Handle speed cycle ─────────────────────────────────────────────────────

  const cycleSpeed = useCallback(() => {
    const currentIndex = SPEED_OPTIONS.indexOf(
      speed as (typeof SPEED_OPTIONS)[number],
    );
    const nextIndex =
      currentIndex < 0 ? 0 : (currentIndex + 1) % SPEED_OPTIONS.length;
    void setSpeed(SPEED_OPTIONS[nextIndex]);
  }, [speed, setSpeed]);

  // ── Render ─────────────────────────────────────────────────────────────────

  // If there's an error, show a minimal bar
  if (error) {
    return (
      <View
        style={{
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
          }}
        >
          Audio unavailable
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderTopWidth: 1,
        borderTopColor: palette.line,
      }}
    >
      {/* Progress bar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          // Use a ref-based approach via callback
        }}
        accessibilityLabel={`Audio progress: ${formatTime(position)} of ${formatTime(duration)}`}
        style={{
          height: 3,
          backgroundColor: palette.line,
        }}
      >
        <View
          style={{
            height: 3,
            backgroundColor: palette.clay,
            width: `${progressFraction * 100}%` as unknown as number,
          }}
        />
      </TouchableOpacity>

      {/* Controls row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        {/* Skip back 15s */}
        <TouchableOpacity
          onPress={() => void skipBack(15)}
          accessibilityLabel="Skip back 15 seconds"
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 18, color: palette.ink }}>⏪</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          onPress={() => void togglePlayPause()}
          accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.clay,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 8,
          }}
        >
          {isBuffering ? (
            <Text style={{ fontSize: 20, color: '#FFFFFF' }}>⟳</Text>
          ) : (
            <Text style={{ fontSize: 20, color: '#FFFFFF' }}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Skip forward 30s */}
        <TouchableOpacity
          onPress={() => void skipForward(30)}
          accessibilityLabel="Skip forward 30 seconds"
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 18, color: palette.ink }}>⏩</Text>
        </TouchableOpacity>

        {/* Info + time — press to expand */}
        <TouchableOpacity
          onPress={onExpand}
          style={{ flex: 1, marginLeft: 12 }}
          accessibilityLabel={`${title}. ${formatTime(position)} of ${formatTime(duration)}. Tap to expand.`}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 13,
              fontWeight: '600',
              color: palette.ink,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {scriptureRef ? (
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 11,
                color: palette.muted,
              }}
              numberOfLines={1}
            >
              {scriptureRef}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 11,
              color: palette.inkDim,
            }}
          >
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </TouchableOpacity>

        {/* Speed control */}
        <TouchableOpacity
          onPress={cycleSpeed}
          accessibilityLabel={`Playback speed: ${speed}x. Tap to change.`}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              fontWeight: '600',
              color: palette.clay,
            }}
          >
            {speed}x
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
