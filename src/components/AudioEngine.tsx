import React, { useEffect, useRef, useState } from 'react';
import { useDayframeStore } from '../store/useDayframeStore';
import { AlertCircle, X } from 'lucide-react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: HTMLElement | string,
        config: {
          height: string | number;
          width: string | number;
          videoId: string;
          playerVars?: Record<string, any>;
          events?: {
            onReady?: (event: any) => void;
            onStateChange?: (event: any) => void;
            onError?: (event: any) => void;
          };
        }
      ) => any;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export const AudioEngine: React.FC = () => {
  const { audio, setActiveTrack } = useDayframeStore();
  const { activeTrackId, isPlayingAudio, volume, audioTracks } = audio;

  const activeTrack =
    audioTracks.find((t) => t.id === activeTrackId) || audioTracks[0];
  const activeYoutubeId = activeTrack?.youtubeId || 'jfKfPfyJRdk';

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const currentVideoIdRef = useRef<string>(activeYoutubeId);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initialize YouTube IFrame API Script
  useEffect(() => {
    // If YouTube API script is already on page
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }

    // Define global callback if not yet ready
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      initPlayer();
    };

    // Check if script element already inserted
    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
    }

    function initPlayer() {
      if (!containerRef.current || playerRef.current || !window.YT?.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '1',
          width: '1',
          videoId: activeYoutubeId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            iv_load_policy: 3,
            loop: 1,
            playlist: activeYoutubeId, // Required by YouTube for seamless audio looping
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              isReadyRef.current = true;
              try {
                event.target.setVolume(Math.round(volume * 100));
                if (isPlayingAudio) {
                  event.target.playVideo();
                }
              } catch (err) {
                console.warn('YouTube audio initialization warning:', err);
              }
            },
            onStateChange: (event: any) => {
              // Loop on video completion
              if (event.data === 0) {
                try {
                  event.target.playVideo();
                } catch {
                  // ignore
                }
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Stream playback error:', event.data);
              handlePlaybackError(event.data);
            },
          },
        });
      } catch (err) {
        console.warn('Failed to construct YouTube player instance:', err);
      }
    }

    return () => {
      // Clean up player on unmount
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, []);

  // 2. React to Track Change
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    if (currentVideoIdRef.current !== activeYoutubeId) {
      currentVideoIdRef.current = activeYoutubeId;
      try {
        if (isPlayingAudio) {
          playerRef.current.loadVideoById({
            videoId: activeYoutubeId,
            suggestedQuality: 'small',
          });
        } else {
          playerRef.current.cueVideoById({
            videoId: activeYoutubeId,
            suggestedQuality: 'small',
          });
        }
      } catch (err) {
        console.warn('Error loading YouTube track ID:', err);
      }
    }
  }, [activeYoutubeId, isPlayingAudio]);

  // 3. React to isPlayingAudio state
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    try {
      if (isPlayingAudio) {
        // If the current video is different from active, load it
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Error syncing playback state:', err);
    }
  }, [isPlayingAudio]);

  // 4. React to Volume Changes
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    try {
      const vol100 = Math.round(Math.max(0, Math.min(1, volume)) * 100);
      playerRef.current.setVolume(vol100);
      if (vol100 === 0) {
        playerRef.current.mute?.();
      } else {
        playerRef.current.unMute?.();
      }
    } catch (err) {
      console.warn('Error setting YouTube volume:', err);
    }
  }, [volume]);

  // Handle Playback / Embedding Errors
  const handlePlaybackError = (code: number) => {
    let detail = 'Stream unavailable';
    if (code === 101 || code === 150) {
      detail = 'Embedding disallowed by video owner';
    } else if (code === 100) {
      detail = 'Video not found or private';
    }

    setErrorMessage(`${detail}. Falling back to default Lofi Chill stream.`);

    // Automatically fall back to default Lofi stream
    setTimeout(() => {
      setActiveTrack('lofi');
    }, 400);

    // Auto-dismiss toast
    setTimeout(() => {
      setErrorMessage(null);
    }, 4500);
  };

  return (
    <>
      {/* Invisible Headless YouTube Player Container */}
      <div
        className="hidden pointer-events-none w-0 h-0 overflow-hidden"
        aria-hidden="true"
        tabIndex={-1}
      >
        <div ref={containerRef} id="dayframe-yt-headless-audio" />
      </div>

      {/* Non-intrusive stream error fallback toast */}
      {errorMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-16 left-6 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0D1117]/95 border border-amber-500/40 text-amber-200 text-[12px] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-md text-amber-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </>
  );
};

export default AudioEngine;
