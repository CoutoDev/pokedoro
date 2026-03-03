import { useCallback, useEffect, useRef, useState } from "react"
import type { Pomodoro } from "../Components/Timer";

const initialState: Pomodoro = {
  phase: 'FOCUS',
  status: 'IDLE',
  completedSessions: 0,
  totalSessions: 0,
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sectionTimeout: null,
  pausedAt: null,
  remaining: 25 * 60,
}

export function usePomodoroTimer(defaultDuration = 25 * 60) {
  const [state, setState] = useState<Pomodoro>({
    ...initialState,
    focusDuration: defaultDuration
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedAtRef = useRef<Date | null>(null);

  // Função que calcula remaining baseado em sectionTimeout vs now
  const calculateRemaining = useCallback(() => {
    if (!state.sectionTimeout) return state.focusDuration;
    
    const now = new Date();
    const diff = state.sectionTimeout.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 1000));
  }, [state.sectionTimeout, state.focusDuration]);

  // Inicia o timer com duração configurada pelo usuário
  const start = useCallback((customDuration?: number) => {
    const focusDuration = customDuration ?? state.focusDuration;
    const timeout = new Date(Date.now() + focusDuration * 1000);
    
    setState(prev => ({
      ...prev,
      remaining: focusDuration,
      status: 'RUNNING',
      focusDuration,
      sectionTimeout: timeout,
    }));

    pausedAtRef.current = null;
  }, [state.focusDuration]);

  // Pausa
  const pause = useCallback(() => {
    if (state.status !== 'RUNNING') return;
    
    pausedAtRef.current = new Date();
    setState(prev => ({ ...prev, status: 'PAUSED' }));
  }, [state.status]);

  // Resume (ajusta timeout pelo tempo pausado)
  const resume = useCallback(() => {
    if (state.status !== 'PAUSED' || !pausedAtRef.current || !state.sectionTimeout) return;

    const pausedDuration = Date.now() - pausedAtRef.current.getTime();
    const adjustedTimeout = new Date(
      state.sectionTimeout.getTime() + pausedDuration
    );

    setState(prev => ({
      ...prev,
      status: 'RUNNING',
      sectionTimeout: adjustedTimeout,
    }));
    
    pausedAtRef.current = null;
  }, [state.status, state.sectionTimeout]);

  // Reset
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      status: 'IDLE',
      remaining: prev.focusDuration,
      sectionTimeout: null,
    }));
    
    pausedAtRef.current = null;
  }, []);

  // O tick principal (roda a cada segundo)
  const tick = useCallback(() => {
    const remaining = calculateRemaining();
    
    setState(prev => {
      if (remaining <= 0) {
        // Timer acabou
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return { ...prev, remaining: 0, status: 'IDLE' };
      }
      
      return { ...prev, remaining };
    });
  }, [calculateRemaining]);

  // Efeito que gerencia o interval
  useEffect(() => {
    if (state.status === 'RUNNING') {
      intervalRef.current = setInterval(tick, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.status, tick]);

  // Mudar duração (sem parar o timer)
  const setDuration = useCallback((minutes: number) => {
    const duration = minutes * 60;
    setState(prev => ({
      ...prev,
      duration,
      remaining: Math.min(prev.remaining, duration),
    }));
  }, []);

  return {
    ...state,
    start,
    pause,
    resume,
    reset,
    duration: state.focusDuration,
    setDuration,
    formatTime: (seconds: number) =>
      `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`,
  };
}