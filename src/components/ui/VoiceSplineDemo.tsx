'use client'

import React, { useState, useEffect } from 'react';
import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"
import { InteractiveSpotlight } from "./interactive-spotlight"
import { motion, AnimatePresence } from "framer-motion"
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

interface VoiceCommand {
  command: string;
  action: string;
  timestamp: string;
}

export function VoiceSplineDemo() {
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [currentScene] = useState("https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode");
  
  const { 
    isRecording, 
    transcription, 
    startRecording, 
    stopRecording, 
    clearRecording 
  } = useVoiceRecording();

  // Process voice commands
  useEffect(() => {
    if (transcription && transcription.trim()) {
      const lowerTranscript = transcription.toLowerCase();
      let action = "พูดทั่วไป";
      
      // Command detection
      if (lowerTranscript.includes('หมุน') || lowerTranscript.includes('rotate')) {
        action = "หมุนโมเดล 3D";
      } else if (lowerTranscript.includes('ซูม') || lowerTranscript.includes('zoom')) {
        action = "ซูมเข้า/ออก";
      } else if (lowerTranscript.includes('เปลี่ยน') || lowerTranscript.includes('change')) {
        action = "เปลี่ยนมุมมอง";
      } else if (lowerTranscript.includes('สี') || lowerTranscript.includes('color')) {
        action = "เปลี่ยนสี";
      } else if (lowerTranscript.includes('แสง') || lowerTranscript.includes('light')) {
        action = "ปรับแสง";
      }

      const newCommand: VoiceCommand = {
        command: transcription,
        action: action,
        timestamp: new Date().toLocaleTimeString('th-TH')
      };

      setVoiceCommands(prev => [newCommand, ...prev.slice(0, 4)]);
    }
  }, [transcription]);

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearCommands = () => {
    setVoiceCommands([]);
    clearRecording();
  };

  return (
    <div className="space-y-6">
      {/* Interactive 3D Scene */}
      <Card className="w-full h-[600px] bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-green-800/95 relative overflow-hidden border-primary-600">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="white"
        />
        
        <InteractiveSpotlight 
          className="from-green-300 via-emerald-200 to-green-100"
          size={300}
        />
        
        <div className="flex h-full">
          {/* Left Content */}
          <motion.div 
            className="flex-1 p-8 relative z-10 flex flex-col justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-green-50 to-green-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              เสียง + 3D
            </motion.h1>
            
            <motion.h2 
              className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-emerald-50 to-emerald-300 mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Voice AI + Interactive 3D
            </motion.h2>
            
            <motion.p 
              className="mt-6 text-green-100 max-w-lg text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              🎤 ควบคุมโมเดล 3D ด้วยเสียงของคุณ! พูดคำสั่งเพื่อโต้ตอบกับผักสด 3D 
              แบบเรียลไทม์และสร้างประสบการณ์ขายที่ไม่เหมือนใคร
            </motion.p>

            {/* Voice Control Button */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              <button
                onClick={handleVoiceToggle}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRecording ? '🔴 หยุดฟัง' : '🎤 เริ่มพูด'}
              </button>
              
              {voiceCommands.length > 0 && (
                <button
                  onClick={clearCommands}
                  className="ml-4 px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  🗑️ ล้าง
                </button>
              )}
            </motion.div>

            {/* Voice Commands History */}
            <AnimatePresence>
              {voiceCommands.length > 0 && (
                <motion.div 
                  className="mt-6 space-y-3 max-h-48 overflow-y-auto"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {voiceCommands.map((cmd, index) => (
                    <motion.div
                      key={index}
                      className="bg-green-800/40 backdrop-blur-sm rounded-lg p-3 border border-green-500/30"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-green-100 text-sm font-medium">{cmd.command}</p>
                          <p className="text-green-300 text-xs mt-1">→ {cmd.action}</p>
                        </div>
                        <span className="text-green-400 text-xs">{cmd.timestamp}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Content - 3D Scene */}
          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <SplineScene 
              scene={currentScene}
              className="w-full h-full"
            />
            
            {/* Status Overlay */}
            <motion.div 
              className="absolute top-4 right-4 bg-green-800/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div>
                <p className="text-green-100 text-sm font-medium">
                  {isRecording ? 'กำลังฟัง...' : 'พร้อมรับคำสั่ง'}
                </p>
              </div>
            </motion.div>

            {/* Branding */}
            <motion.div 
              className="absolute bottom-4 right-4 bg-green-800/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.7 }}
            >
              <p className="text-green-100 text-sm font-medium">🌿 Freshket AI</p>
              <p className="text-green-200 text-xs">Voice + 3D Experience</p>
            </motion.div>
          </motion.div>
        </div>
      </Card>

      {/* Instructions Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-green-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🎮 วิธีใช้งาน Voice + 3D Interactive</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-green-900 mb-3">🎤 คำสั่งเสียง</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>"หมุน"</strong> - หมุนโมเดล 3D</li>
              <li>• <strong>"ซูม"</strong> - ซูมเข้า/ออก</li>
              <li>• <strong>"เปลี่ยน"</strong> - เปลี่ยนมุมมอง</li>
              <li>• <strong>"สี"</strong> - เปลี่ยนสี</li>
              <li>• <strong>"แสง"</strong> - ปรับแสง</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-green-900 mb-3">💡 เทคโนโลยี</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• <strong>Spline 3D</strong> - โมเดล 3D แบบโต้ตอบ</li>
              <li>• <strong>Web Speech API</strong> - รู้จำเสียงเรียลไทม์</li>
              <li>• <strong>Framer Motion</strong> - แอนิเมชั่นลื่น</li>
              <li>• <strong>AI Integration</strong> - ประมวลผลคำสั่งอัจฉริยะ</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 