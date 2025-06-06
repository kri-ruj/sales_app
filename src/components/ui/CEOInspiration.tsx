import React, { useState } from 'react';

interface CEOInspirationProps {
  quote: string;
  imageUrl?: string;
  ceoName?: string;
  variant?: 'full' | 'compact';
  className?: string;
}

const CEOInspiration: React.FC<CEOInspirationProps> = ({ 
  quote, 
  imageUrl = '/ceo-freshket.jpg',
  ceoName = 'Ponglada (Bell)',
  variant = 'full',
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);

  // Fallback avatar with initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
  };

  const renderImage = () => {
    if (imageError || !imageUrl) {
      // Beautiful gradient avatar with initials
      return (
        <div className={`${variant === 'compact' ? 'w-16 h-16' : 'w-48 h-64'} rounded-lg bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 flex items-center justify-center border-4 border-white shadow-xl`}>
          <span className={`${variant === 'compact' ? 'text-lg' : 'text-3xl'} font-bold text-white`}>
            {getInitials(ceoName)}
          </span>
        </div>
      );
    }

    return (
      <img 
        src={imageUrl} 
        alt={`${ceoName} - CEO`}
        className={`${variant === 'compact' ? 'w-16 h-16 border-2' : 'w-48 h-64 border-4'} rounded-lg object-cover border-primary-400 shadow-xl`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200 ${className}`}>
        <div className="flex items-center space-x-4">
          {renderImage()}
          <div className="flex-1">
            <p className="text-sm italic text-gray-700">"{quote}"</p>
            <p className="text-xs text-gray-500 mt-1">- {ceoName}, CEO Freshket</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-xl shadow-lg p-8 ${className}`}>
      <div className="flex flex-col items-center text-center">
        {renderImage()}
        
        <blockquote className="relative mt-6">
          <svg className="absolute top-0 left-0 transform -translate-x-6 -translate-y-8 h-16 w-16 text-primary-200 opacity-50" fill="currentColor" viewBox="0 0 32 32">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"/>
          </svg>
          <p className="relative text-lg md:text-xl font-medium text-gray-800 italic">
            {quote}
          </p>
        </blockquote>
        
        <div className="mt-6">
          <p className="text-lg font-bold text-primary-800">{ceoName}</p>
          <p className="text-sm font-semibold text-primary-700">CEO & Founder</p>
          <p className="text-sm text-primary-600">Freshket</p>
        </div>
        
        {/* Professional placeholder note */}
        {imageError && (
          <p className="text-xs text-gray-400 mt-2 px-4 text-center">
            💡 Add professional headshot to public/ceo-freshket.jpg
          </p>
        )}
      </div>
    </div>
  );
};

export default CEOInspiration;