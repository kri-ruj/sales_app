import React, { useState, useRef } from 'react';
import { Upload, Camera, Download, ExternalLink } from 'lucide-react';

interface ImageUploadHelperProps {
  onImageSelect?: (file: File) => void;
  className?: string;
}

const ImageUploadHelper: React.FC<ImageUploadHelperProps> = ({ 
  onImageSelect,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setSelectedImage(url);
        onImageSelect?.(file);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg ${className}`}>
      <div className="text-center mb-6">
        <Camera className="w-12 h-12 mx-auto text-primary-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">CEO Photo Upload</h3>
        <p className="text-gray-600">Upload a professional headshot for Ponglada (Bell)</p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />

        {selectedImage ? (
          <div className="space-y-4">
            <img 
              src={selectedImage} 
              alt="Selected CEO photo" 
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary-400"
            />
            <p className="text-green-600 font-medium">✅ Photo selected successfully!</p>
            <button
              onClick={onButtonClick}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Choose different photo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <button
                onClick={onButtonClick}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Choose Photo
              </button>
              <p className="text-gray-500 mt-2">or drag and drop here</p>
            </div>
          </div>
        )}
      </div>

      {/* Background Removal Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <ExternalLink className="w-4 h-4 mr-2" />
          Professional Background Removal Tools
        </h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span>🎨 Remove.bg - AI Background Remover</span>
            <a 
              href="https://www.remove.bg/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Open →
            </a>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span>📷 Adobe Express - Free Background Remover</span>
            <a 
              href="https://www.adobe.com/express/feature/image/remove-background" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Open →
            </a>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span>🖼️ Online PNG Tools</span>
            <a 
              href="https://onlinepngtools.com/remove-png-background" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Open →
            </a>
          </div>
        </div>
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>💡 Instructions:</strong>
            <br />1. Upload CEO photo to any tool above
            <br />2. Download the background-removed image
            <br />3. Save as <code>/public/ceo-freshket.jpg</code> in your project
            <br />4. Refresh the login page to see the result
          </p>
        </div>
      </div>

      {/* File Requirements */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">📋 Photo Requirements</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Format:</strong> JPG, PNG, or WebP</li>
          <li>• <strong>Size:</strong> Minimum 400x400px (square recommended)</li>
          <li>• <strong>Quality:</strong> Professional headshot with clear face</li>
          <li>• <strong>Background:</strong> Transparent or solid color (will be processed)</li>
          <li>• <strong>File Size:</strong> Under 5MB for optimal loading</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageUploadHelper; 