import { useState, useRef, useCallback, useEffect } from 'react';

interface RealtimeASRHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
}

export const useRealtimeASR = (): RealtimeASRHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports Speech Recognition
  const isSupported = !!(
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  );

  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'th-TH'; // Thai language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          setConfidence(result[0].confidence || 0.8);
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimTranscript(interimTranscript);
      }

      if (finalTranscript) {
        setFinalTranscript(prev => prev + finalTranscript);
        setInterimTranscript(''); // Clear interim when we get final
      }

      // Update combined transcript
      const combined = (finalTranscript || '') + (interimTranscript || '');
      setTranscript(combined);

      // Reset timeout for continuous listening
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Auto-restart recognition if it stops unexpectedly
      timeoutRef.current = setTimeout(() => {
        if (isListening && recognition.readyState !== 'listening') {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart failed:', e);
          }
        }
      }, 1000);
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          setError('ไม่ได้ยินเสียงพูด กรุณาลองใหม่');
          break;
        case 'audio-capture':
          setError('ไม่สามารถเข้าถึงไมโครโฟนได้');
          break;
        case 'not-allowed':
          setError('ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน');
          break;
        case 'network':
          setError('เกิดข้อผิดพลาดเครือข่าย');
          break;
        default:
          setError(`เกิดข้อผิดพลาด: ${event.error}`);
      }

      // Try to restart on certain errors
      if (['no-speech', 'aborted'].includes(event.error) && isListening) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Auto-restart failed:', e);
          }
        }, 1000);
      }
    };

    // Handle start
    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    // Handle end
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart if we're still supposed to be listening
      if (recognitionRef.current && timeoutRef.current) {
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Auto-restart on end failed:', e);
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [isSupported, isListening]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('เบราว์เซอร์ของคุณไม่รองรับการรู้จำเสียงพูด');
      return;
    }

    try {
      const recognition = initializeRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      recognition.start();
      
      setTranscript('');
      setInterimTranscript('');
      setFinalTranscript('');
      setError(null);

    } catch (error: any) {
      console.error('Error starting recognition:', error);
      setError('ไม่สามารถเริ่มการรู้จำเสียงได้');
    }
  }, [isSupported, initializeRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsListening(false);
    
    // Combine final and interim into final transcript
    if (interimTranscript) {
      setFinalTranscript(prev => prev + interimTranscript);
      setInterimTranscript('');
    }
  }, [interimTranscript]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update combined transcript when final or interim changes
  useEffect(() => {
    const combined = finalTranscript + interimTranscript;
    setTranscript(combined);
  }, [finalTranscript, interimTranscript]);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    confidence,
    isSupported,
    error,
    startListening,
    stopListening,
    clearTranscript
  };
};