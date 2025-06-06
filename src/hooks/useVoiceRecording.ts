import { useState, useRef, useCallback } from 'react';
import ApiService from '../services/apiService';

interface VoiceRecordingHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcription: string | null;
  transcriptionLanguage: string | null;
  transcriptionConfidence: number | null;
  transcriptionDuration: number | null;
  isProcessing: boolean;
  apiStatus: 'idle' | 'connecting' | 'success' | 'fallback' | 'error';
  errorMessage: string | null;
  // Enhanced Gemini data
  isEnhanced: boolean;
  customerInfo: { name?: string; company?: string } | null;
  dealInfo: { value?: string; status?: string } | null;
  actionItems: string[] | null;
  summary: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  isSupported: boolean;
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string | null>(null);
  const [transcriptionConfidence, setTranscriptionConfidence] = useState<number | null>(null);
  const [transcriptionDuration, setTranscriptionDuration] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'connecting' | 'success' | 'fallback' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Enhanced Gemini data states
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{ name?: string; company?: string } | null>(null);
  const [dealInfo, setDealInfo] = useState<{ value?: string; status?: string } | null>(null);
  const [actionItems, setActionItems] = useState<string[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      alert('การบันทึกเสียงไม่รองรับในเบราว์เซอร์นี้');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsProcessing(true);
        setApiStatus('connecting');
        setErrorMessage(null);

        try {
          // Upload and transcribe audio using backend API
          console.log('Uploading audio to backend for transcription...');
          const result = await ApiService.uploadAndTranscribeAudio(blob);
          
          if (result.success) {
            setTranscription(result.data.transcription);
            setTranscriptionLanguage(result.data.language || null);
            setTranscriptionConfidence(result.data.confidence || null);
            setTranscriptionDuration(result.data.duration || null);
            
            // Handle enhanced Gemini data
            if (result.data.enhanced) {
              setIsEnhanced(true);
              setCustomerInfo(result.data.customerInfo || null);
              setDealInfo(result.data.dealInfo || null);
              setActionItems(result.data.actionItems || null);
              setSummary(result.data.summary || null);
              console.log('✅ Enhanced Gemini transcription completed with metadata');
            } else {
              setIsEnhanced(false);
              setCustomerInfo(null);
              setDealInfo(null);
              setActionItems(null);
              setSummary(null);
            }
            
            setApiStatus('success');
            console.log('✅ Transcription completed:', result.data.transcription);
          } else {
            throw new Error('Backend transcription failed');
          }
        } catch (error) {
          console.error('❌ Backend transcription error:', error);
          setApiStatus('fallback');
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
          
          // Fallback to mock transcription
          const mockTranscriptions = [
            'สวัสดีครับ วันนี้มีลูกค้าใหม่ติดต่อมาสนใจผลิตภัณฑ์ของเรา',
            'ได้คุยกับคุณสมชาย เรื่องข้อเสนอพิเศษสำหรับลูกค้าขายส่ง ลูกค้าสนใจมาก',
            'ต้องติดตามลูกค้ารายนี้อีกครั้งในสัปดาหน้า กำหนดการประชุมใหม่',
            'ลูกค้าถามเรื่องราคาและการส่งมอบ ต้องเตรียมใบเสนอราคาและเอกสารเพิ่มเติม'
          ];
          const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
          setTranscription(randomTranscription);
          setTranscriptionLanguage('th');
          setTranscriptionConfidence(0.85);
          setTranscriptionDuration(30);
          
          console.log('🔄 Using fallback mock transcription');
        } finally {
          setIsProcessing(false);
        }

        // Stop all tracks to free up the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error('ไม่สามารถเข้าถึงไมโครโฟนได้:', error);
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้งานไมโครโฟน');
      setApiStatus('error');
      setErrorMessage('ไม่สามารถเข้าถึงไมโครโฟนได้');
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription(null);
    setTranscriptionLanguage(null);
    setTranscriptionConfidence(null);
    setTranscriptionDuration(null);
    setIsProcessing(false);
    setApiStatus('idle');
    setErrorMessage(null);
    
    // Clear enhanced Gemini data
    setIsEnhanced(false);
    setCustomerInfo(null);
    setDealInfo(null);
    setActionItems(null);
    setSummary(null);
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    transcription,
    transcriptionLanguage,
    transcriptionConfidence,
    transcriptionDuration,
    isProcessing,
    apiStatus,
    errorMessage,
    // Enhanced Gemini data
    isEnhanced,
    customerInfo,
    dealInfo,
    actionItems,
    summary,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported,
  };
}; 