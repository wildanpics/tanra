"use client";

import { useEffect, useRef, useCallback } from "react";

export function useAudioEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmOscRef = useRef<OscillatorNode | null>(null);
  const bgmGainRef = useRef<GainNode | null>(null);
  const isEnabled = useRef<boolean>(false);

  // Initialize audio context only after user interaction
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      isEnabled.current = true;
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }, []);

  // 1. Ticking Sound (Short high-pitch click)
  const playTick = useCallback(() => {
    if (!audioCtxRef.current || !isEnabled.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  // 2. Dramatic Reveal (Low bass swell)
  const playDramaticReveal = useCallback(() => {
    if (!audioCtxRef.current || !isEnabled.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(40, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 3);
  }, []);

  // 3. Gavel / Elimination (Sharp impact)
  const playElimination = useCallback(() => {
    if (!audioCtxRef.current || !isEnabled.current) return;
    const ctx = audioCtxRef.current;
    
    // Impact oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "square";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Noise burst for the "hit" sound
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 1000;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.2);
  }, []);

  // 4. BGM Discussion (Tense low heartbeat loop)
  const startBGM = useCallback(() => {
    if (!audioCtxRef.current || !isEnabled.current) return;
    const ctx = audioCtxRef.current;
    
    if (bgmOscRef.current) return; // Already playing
    
    bgmOscRef.current = ctx.createOscillator();
    bgmGainRef.current = ctx.createGain();
    
    bgmOscRef.current.type = "sine";
    bgmOscRef.current.frequency.value = 50; // Deep bass
    
    // Heartbeat rhythm using an LFO on the gain
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 1.5; // 1.5 beats per second
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    
    lfo.connect(lfoGain);
    
    // Default gain volume
    bgmGainRef.current.gain.value = 0.1;
    
    bgmOscRef.current.connect(bgmGainRef.current);
    bgmGainRef.current.connect(ctx.destination);
    
    bgmOscRef.current.start();
    lfo.start();
  }, []);

  const stopBGM = useCallback(() => {
    if (bgmOscRef.current && bgmGainRef.current) {
      bgmGainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current!.currentTime + 1);
      setTimeout(() => {
        bgmOscRef.current?.stop();
        bgmOscRef.current = null;
        bgmGainRef.current = null;
      }, 1000);
    }
  }, []);

  return { initAudio, playTick, playDramaticReveal, playElimination, startBGM, stopBGM };
}
