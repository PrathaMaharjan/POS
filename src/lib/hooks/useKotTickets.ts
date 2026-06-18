"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';

let cachedTickets: any[] = [];
let listeners: ((tickets: any[]) => void)[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;

async function fetchAndBroadcast() {
  try {
    const res = await api.get('/kot');
    cachedTickets = res.data.tickets ?? [];
    listeners.forEach(fn => fn(cachedTickets));
  } catch (err) {
    console.error('Failed to fetch KOT tickets:', err);
  }
}

export function useKotTickets(pollIntervalMs = 10000) {
  const [tickets, setTickets] = useState<any[]>(cachedTickets);

  useEffect(() => {
    subscriberCount++;
    listeners.push(setTickets);

    // First subscriber starts the polling; later subscribers just listen
    if (subscriberCount === 1) {
      fetchAndBroadcast();
      intervalId = setInterval(fetchAndBroadcast, pollIntervalMs);
    } else {
      // Give late subscribers the latest cached data immediately
      setTickets(cachedTickets);
    }

    return () => {
      subscriberCount--;
      listeners = listeners.filter(fn => fn !== setTickets);

      // Last subscriber leaving stops the polling
      if (subscriberCount === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, [pollIntervalMs]);

  return { tickets, refetch: fetchAndBroadcast };
}