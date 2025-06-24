import { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE_URL from '@/config';

export interface QuizState {
  audience_count: number;
  state: 'LOBBY' | 'QUESTION' | 'RESULTS' | 'FINISHED';
  players: Record<string, { score: number }>;
  question?: string;
  options?: string[];
  question_index?: number;
  total_questions?: number;
  timer?: number;
  results?: Record<string, number>;
  correct_answer?: string;
  scores?: Record<string, { score: number }>;
}

export const useQuizSocket = (sessionCode: string, nickname?: string) => {
  const [state, setState] = useState<QuizState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/ws/${sessionCode}`;

      console.log('Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setJoinError(null);
        reconnectAttempts.current = 0;
        
        // Send join message
        if (nickname) {
          sendMessage({ type: 'join', nickname });
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle join errors
          if (data.type === 'join_error') {
            setJoinError(data.message);
            return;
          }
          
          // Handle regular state updates
          setState(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttempts.current}`);
            connect();
          }, 2000 * reconnectAttempts.current);
        } else {
          setError('Connection lost. Please refresh the page.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please check your network.');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setError('Failed to connect. Please try again.');
    }
  }, [sessionCode, nickname]);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  const startQuiz = useCallback(() => {
    sendMessage({ type: 'start_quiz' });
  }, [sendMessage]);

  const showResults = useCallback(() => {
    sendMessage({ type: 'show_results' });
  }, [sendMessage]);

  const nextQuestion = useCallback(() => {
    sendMessage({ type: 'next_question' });
  }, [sendMessage]);

  const vote = useCallback((option: string) => {
    sendMessage({ type: 'vote', option });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    state,
    isConnected,
    error,
    joinError,
    startQuiz,
    showResults,
    nextQuestion,
    vote,
  };
};
