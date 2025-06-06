import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import TranscriptionService from '../services/transcriptionService';
import LogService from '../services/logService';

const router = Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    fs.ensureDirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original extension or default to .webm
    const originalExt = path.extname(file.originalname) || '.webm';
    const uniqueName = `${uuidv4()}-${Date.now()}${originalExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept various audio formats
    const allowedMimeTypes = [
      'audio/webm',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/flac',
      'audio/aiff',
      'audio/x-aiff'
    ];
    
    const allowedExtensions = ['.webm', '.wav', '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.aiff'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format. Allowed formats: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Enhanced transcription using AI services

// Upload and transcribe audio
router.post('/upload', upload.single('audio'), async (req, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const audioUrl = `/uploads/${req.file.filename}`;
    
    // Use AI transcription service
    const transcriptionResult = await TranscriptionService.transcribeAuto(req.file.path);

    // Log successful audio upload and transcription
    await LogService.info(
      'AUDIO_UPLOADED_TRANSCRIBED',
      `Audio file uploaded and transcribed: ${req.file.filename}`,
      {
        filename: req.file.filename,
        originalname: req.file.originalname,
        fileSize: req.file.size,
        mimetype: req.file.mimetype,
        transcriptionLength: transcriptionResult.text.length,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence,
        duration: transcriptionResult.duration,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      data: {
        audioUrl,
        filename: req.file.filename,
        transcription: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        confidence: transcriptionResult.confidence,
        uploadTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Audio upload error:', error);
    
    // Log audio upload/transcription error
    await LogService.error(
      'AUDIO_UPLOAD_ERROR',
      `Failed to upload or transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        filename: req.file?.filename,
        originalname: req.file?.originalname,
        fileSize: req.file?.size,
        errorStack: error instanceof Error ? error.stack : null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
    
    res.status(500).json({ 
      error: 'Failed to process audio file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get transcription for existing audio file
router.post('/transcribe', async (req, res): Promise<void> => {
  try {
    const { audioPath } = req.body;
    
    if (!audioPath) {
      res.status(400).json({ error: 'Audio path is required' });
      return;
    }

    const transcriptionResult = await TranscriptionService.transcribeAuto(audioPath);

    res.json({
      success: true,
      data: {
        transcription: transcriptionResult.text,
        language: transcriptionResult.language,
        duration: transcriptionResult.duration,
        confidence: transcriptionResult.confidence,
        processedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete audio file
router.delete('/:filename', async (req, res): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      
      // Log file deletion
      await LogService.info(
        'AUDIO_FILE_DELETED',
        `Audio file deleted: ${filename}`,
        { 
          filename,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      res.json({ 
        success: true, 
        message: 'Audio file deleted successfully' 
      });
    } else {
      // Log attempt to delete non-existent file
      await LogService.warning(
        'AUDIO_FILE_NOT_FOUND',
        `Attempt to delete non-existent audio file: ${filename}`,
        { 
          filename,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      res.status(404).json({ 
        error: 'Audio file not found' 
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete audio file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 