'use client'

import { SplineScene } from "./spline";
import { Card } from "./card"
import { Spotlight } from "./spotlight"
import { InteractiveSpotlight } from "./interactive-spotlight"
import { motion } from "framer-motion"
 
export function VegetableSplineDemo() {
  return (
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
        {/* Left content */}
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
            สด ใหม่ คุณภาพ
          </motion.h1>
          
          <motion.h2 
            className="text-2xl md:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-emerald-50 to-emerald-300 mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Interactive 3D
          </motion.h2>
          
          <motion.p 
            className="mt-6 text-green-100 max-w-lg text-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            🥬 ยกระดับประสบการณ์การขายผักสดด้วยเทคโนโลยี 3D แบบโต้ตอบ 
            สร้างความประทับใจให้ลูกค้าและเพิ่มยอดขายอย่างมีประสิทธิภาพ
          </motion.p>
          
          <motion.div 
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            {['🥕 มัน', '🌽 ข้าวโพด', '🥬 กะหล่ำ', '🥦 บล็อกโคลี่', '🍅 มะเขือเทศ'].map((item, index) => (
              <motion.span
                key={item}
                className="px-3 py-1 bg-green-700/40 text-green-100 rounded-full text-sm border border-green-500/30"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.3 + index * 0.1 }}
              >
                {item}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right content - 3D Scene */}
        <motion.div 
          className="flex-1 relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
          
          {/* Overlay for branding */}
          <motion.div 
            className="absolute bottom-4 right-4 bg-green-800/80 backdrop-blur-sm rounded-lg p-3 border border-green-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <p className="text-green-100 text-sm font-medium">🌿 Freshket</p>
            <p className="text-green-200 text-xs">Interactive Sales Experience</p>
          </motion.div>
        </motion.div>
      </div>
    </Card>
  )
} 