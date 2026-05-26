"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Room as LiveKitRoom,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Track,
  createLocalAudioTrack,
  ParticipantEvent,
  TrackPublishOptions,
} from "livekit-client";

interface UseVoiceChatOptions {
  roomName: string;
  userId: string;
  username: string;
  token: string | null;
  livekitUrl: string;
}

interface VoiceChatState {
  connected: boolean;
  isMuted: boolean;
  speakingParticipants: Set<string>;
  toggleMute: () => void;
  setMuteState: (mute: boolean) => Promise<void>;
  disconnect: () => void;
  participants: string[];
}

export function useVoiceChat({
  roomName,
  userId,
  username,
  token,
  livekitUrl,
}: UseVoiceChatOptions): VoiceChatState {
  const roomRef = useRef<LiveKitRoom | null>(null);
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(
    new Set()
  );
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !livekitUrl) return;

    const room = new LiveKitRoom({
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    roomRef.current = room;

    room.on(RoomEvent.Connected, () => {
      setConnected(true);
      updateParticipants(room);
    });

    room.on(RoomEvent.Disconnected, () => {
      setConnected(false);
      setParticipants([]);
    });

    room.on(RoomEvent.ParticipantConnected, () => updateParticipants(room));
    room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(room));

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakingIds = new Set(
        speakers.map((s) => s.identity)
      );
      setSpeakingParticipants(speakingIds);
    });

    room
      .connect(livekitUrl, token, {
        autoSubscribe: true,
      })
      .catch(console.error);

    return () => {
      room.disconnect();
      roomRef.current = null;
    };
  }, [token, livekitUrl]);

  function updateParticipants(room: LiveKitRoom) {
    const ids = [
      room.localParticipant.identity,
      ...Array.from(room.remoteParticipants.values()).map((p) => p.identity),
    ];
    setParticipants(ids);
  }

  const toggleMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;

    const local = room.localParticipant;
    if (isMuted) {
      try {
        const track = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        });
        await local.publishTrack(track);
        setIsMuted(false);
      } catch (err) {
        console.error("Mic error:", err);
      }
    } else {
      local.audioTrackPublications.forEach((pub) => {
        if (pub.track) {
          local.unpublishTrack(pub.track);
        }
      });
      setIsMuted(true);
    }
  }, [isMuted]);

  const setMuteState = useCallback(async (mute: boolean) => {
    if (mute === isMuted) return;
    const room = roomRef.current;
    if (!room) return;

    const local = room.localParticipant;
    if (!mute) {
      try {
        const track = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        });
        await local.publishTrack(track);
        setIsMuted(false);
      } catch (err) {
        console.error("Mic error:", err);
      }
    } else {
      local.audioTrackPublications.forEach((pub) => {
        if (pub.track) {
          local.unpublishTrack(pub.track);
        }
      });
      setIsMuted(true);
    }
  }, [isMuted]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
  }, []);

  return {
    connected,
    isMuted,
    speakingParticipants,
    toggleMute,
    setMuteState,
    disconnect,
    participants,
  };
}
