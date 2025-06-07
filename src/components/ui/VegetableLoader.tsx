import React from 'react';

interface VegetableLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const VegetableLoader: React.FC<VegetableLoaderProps> = ({ size = 'medium', text }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const vegetables = ['🥕', '🍅', '🥦', '🌽', '🥒', '🍆', '🌶️', '🥬'];
  const randomVeg = vegetables[Math.floor(Math.random() * vegetables.length)];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl animate-spin" style={{ animationDuration: '2s' }}>
            {randomVeg}
          </div>
        </div>
        <div className="absolute inset-0 border-4 border-green-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping"></div>
      </div>
      {text && (
        <p className="mt-4 text-green-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default VegetableLoader;