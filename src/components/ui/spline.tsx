'use client'

import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse delay-150"></div>
            <span className="text-primary-600 font-medium">Loading 3D Scene...</span>
          </div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
      />
    </Suspense>
  )
} 