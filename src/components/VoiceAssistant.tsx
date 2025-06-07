import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { useToast } from '../hooks/useToast';
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles, FileText } from 'lucide-react';
import SmartActivityForm from './SmartActivityForm';
import ApiService, { SalesActivity } from '../services/apiService';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  transcription?: string;
  audioUrl?: string;
  hasActivitySuggestion?: boolean;
}

const VoiceAssistant: React.FC = () => {
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isRecording,
    transcription,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    isProcessing,
    apiStatus
  } = useVoiceRecording();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUserMessage = useCallback(async (content: string, isVoice = false, audioUrl?: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      isVoice,
      transcription: isVoice ? content : undefined,
      audioUrl: audioUrl
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Generate AI response with activity suggestion for voice messages
    setTimeout(() => {
      const hasActivitySuggestion = isVoice && content.length > 50; // Suggest activity for substantial voice messages
      const aiResponse = generateAIResponse(content, hasActivitySuggestion);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        hasActivitySuggestion,
        transcription: isVoice ? content : undefined,
        audioUrl: audioUrl
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcription && !isProcessing) {
      handleUserMessage(transcription, true, audioUrl || undefined);
      clearRecording();
    }
  }, [transcription, isProcessing, audioUrl, clearRecording, handleUserMessage]);

  const generateAIResponse = (userInput: string, hasActivitySuggestion = false): string => {
    if (hasActivitySuggestion) {
      const activityResponses = [
        `🥦 ฉันวิเคราะห์บันทึกเสียงของคุณและพบข้อมูลร้านค้าผัก! ต้องการให้ฉันสร้างบันทึกคำสั่งซื้อแบบอัตโนมัติไหม?`,
        `🥕 การสนทนาดีมาก! ฉันตรวจพบข้อมูลร้านค้าและรายการสั่งซื้อผัก ช่วยบันทึกเป็นกิจกรรมขายไหมคะ?`,
        `🌽 นี่เป็นการขายผักที่สำคัญ! ฉันสามารถกรอกข้อมูลอัตโนมัติจากที่คุณพูดคุย พร้อมตรวจสอบไหม?`,
        `🥬 ฉันดึงข้อมูลสำคัญจากการบันทึกเสียงได้แล้ว ให้ฉันช่วยบันทึกคำสั่งซื้อผักแบบอัจฉริยะ!`,
      ];
      return activityResponses[Math.floor(Math.random() * activityResponses.length)];
    }
    
    const generalResponses = [
      `🥦 เข้าใจแล้วคะ! ฉันจะช่วยจัดการคำสั่งซื้อผักสดของคุณอย่างไรดี?`,
      `🥕 รับทราบ! มีอะไรเกี่ยวกับการขายผักที่อยากให้ช่วยไหมคะ?`,
      `🌽 ขอบคุณสำหรับข้อมูล! คุณต้องการจัดการคำสั่งซื้อผักอะไรต่อ?`,
      `🫑 ฉันพร้อมช่วยบันทึกกิจกรรมการขายผักสดของคุณคะ!`,
    ];
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording();
      setIsListening(false);
    } else {
      await startRecording();
      setIsListening(true);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserMessage(textInput);
      setTextInput('');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleCreateActivity = (message: Message) => {
    if (message.transcription) {
      setCurrentTranscription(message.transcription);
      setCurrentAudioUrl(message.audioUrl);
      setShowActivityForm(true);
    }
  };

  const handleActivitySubmit = async (activityData: Partial<SalesActivity>) => {
    try {
      const response = await ApiService.createActivity(activityData);
      if (response.success) {
        success('✅ บันทึกกิจกรรมเรียบร้อยแล้ว');
        setShowActivityForm(false);
        setCurrentTranscription('');
        setCurrentAudioUrl(undefined);
        
        // Add confirmation message
        const confirmationMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🥦 เยี่ยมมาก! ฉันบันทึกคำสั่งซื้อ "${activityData.title}" สำหรับร้าน "${activityData.customerName}" เรียบร้อยแล้ว ข้อมูลทั้งหมดถูกบันทึกด้วย AI แล้ว! 🥕`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmationMessage]);
      } else {
        throw new Error('Failed to create activity');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      showError('เกิดข้อผิดพลาดในการบันทึกกิจกรรม');
    }
  };

  const handleActivityCancel = () => {
    setShowActivityForm(false);
    setCurrentTranscription('');
    setCurrentAudioUrl(undefined);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl border-2 border-green-300 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-2xl">🥦</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg">🥕 AI ผู้ช่วยขายผัก</h3>
            <p className="text-white/80 text-sm">บันทึกคำสั่งซื้อด้วยเสียง</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-6xl mx-auto mb-4 animate-pulse">🌽</div>
            <p className="text-sm text-green-600">🥦 เริ่มการสนทนากับผู้ช่วยขายผักของคุณ</p>
            <p className="text-xs mt-2 text-green-500">ลอง: "เพิ่มคำสั่งซื้อผักจากร้าน ABC"</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg shadow-md ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : 'bg-gradient-to-r from-lime-100 to-green-100 text-green-800 border border-green-200'
                }`}
              >
                {message.isVoice && (
                  <div className="flex items-center space-x-1 mb-1">
                    <Mic className="w-3 h-3" />
                    <span className="text-xs opacity-75">Voice message</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                {message.type === 'assistant' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => speakText(message.content)}
                      className="p-1 hover:bg-green-100 rounded transition-colors"
                      disabled={isSpeaking}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    {message.hasActivitySuggestion && message.transcription && (
                      <button
                        onClick={() => handleCreateActivity(message)}
                        className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105"
                      >
                        <span className="text-sm">🥬</span>
                        <span>บันทึกคำสั่งซื้อ</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-green-200 bg-gradient-to-t from-green-50 to-transparent">
        {/* Voice Status */}
        {(isRecording || isProcessing) && (
          <div className="mb-3 p-2 bg-gradient-to-r from-green-100 to-lime-100 rounded-lg text-center border border-green-200">
            <div className="flex items-center justify-center space-x-2">
              <div className={`text-lg ${isRecording ? 'animate-bounce' : 'animate-spin'}`}>
                {isRecording ? '🌽' : '🥦'}
              </div>
              <span className="text-sm text-green-700 font-medium">
                {isRecording ? 'กำลังฟัง...' : 'กำลังประมวลผล...'}
              </span>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleTextSubmit} className="flex space-x-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="พิมพ์ข้อความเกี่ยวกับคำสั่งซื้อผัก..."
            className="flex-1 px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            disabled={isRecording || isProcessing}
          />
          
          {/* Voice Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-2 rounded-lg transition-all transform hover:scale-110 ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            }`}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* Send Button */}
          <button
            type="submit"
            className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-110"
            disabled={!textInput.trim() || isRecording || isProcessing}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {/* API Status */}
        <div className="mt-2 text-xs text-center">
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full ${
            apiStatus === 'success' ? 'bg-green-100 text-green-700' :
            apiStatus === 'fallback' ? 'bg-yellow-100 text-yellow-700' :
            apiStatus === 'error' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              apiStatus === 'success' ? 'bg-green-500' :
              apiStatus === 'fallback' ? 'bg-yellow-500' :
              apiStatus === 'error' ? 'bg-red-500' :
              'bg-gray-400'
            }`} />
            <span>
              {apiStatus === 'success' ? '🥦 เชื่อมต่อแล้ว' :
               apiStatus === 'fallback' ? '🌽 โหมดออฟไลน์' :
               apiStatus === 'error' ? '🥕 ขาดการเชื่อมต่อ' :
               '🌱 พร้อมใช้งาน'}
            </span>
          </span>
        </div>
      </div>
      
      {/* Smart Activity Form Modal */}
      <SmartActivityForm
        isOpen={showActivityForm}
        transcription={currentTranscription}
        audioUrl={currentAudioUrl}
        onSubmit={handleActivitySubmit}
        onCancel={handleActivityCancel}
      />
    </div>
  );
};

export default VoiceAssistant; 