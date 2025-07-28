/**
 * @fileoverview Advanced file manipulation utilities with comprehensive validation
 * @module @/lib/utils/file
 * @description Enterprise-grade file processing utilities including validation,
 * conversion, compression, and metadata extraction with TypeScript generics
 */

/**
 * File type definitions and constants
 */
export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  DOCUMENT = "document",
  SPREADSHEET = "spreadsheet",
  PRESENTATION = "presentation",
  ARCHIVE = "archive",
  CODE = "code",
  TEXT = "text",
  UNKNOWN = "unknown",
}

/**
 * MIME type mappings for file validation
 */
export const MIME_TYPE_MAPPINGS: Record<string, FileType> = {
  // Images
  "image/jpeg": FileType.IMAGE,
  "image/png": FileType.IMAGE,
  "image/gif": FileType.IMAGE,
  "image/webp": FileType.IMAGE,
  "image/svg+xml": FileType.IMAGE,
  "image/bmp": FileType.IMAGE,
  "image/tiff": FileType.IMAGE,

  // Videos
  "video/mp4": FileType.VIDEO,
  "video/webm": FileType.VIDEO,
  "video/ogg": FileType.VIDEO,
  "video/quicktime": FileType.VIDEO,
  "video/x-msvideo": FileType.VIDEO,

  // Audio
  "audio/mpeg": FileType.AUDIO,
  "audio/wav": FileType.AUDIO,
  "audio/ogg": FileType.AUDIO,
  "audio/webm": FileType.AUDIO,
  "audio/mp4": FileType.AUDIO,

  // Documents
  "application/pdf": FileType.DOCUMENT,
  "application/msword": FileType.DOCUMENT,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    FileType.DOCUMENT,
  "application/rtf": FileType.DOCUMENT,

  // Spreadsheets
  "application/vnd.ms-excel": FileType.SPREADSHEET,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    FileType.SPREADSHEET,
  "text/csv": FileType.SPREADSHEET,

  // Presentations
  "application/vnd.ms-powerpoint": FileType.PRESENTATION,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    FileType.PRESENTATION,

  // Archives
  "application/zip": FileType.ARCHIVE,
  "application/x-rar-compressed": FileType.ARCHIVE,
  "application/x-7z-compressed": FileType.ARCHIVE,
  "application/x-tar": FileType.ARCHIVE,
  "application/gzip": FileType.ARCHIVE,

  // Code
  "text/javascript": FileType.CODE,
  "application/javascript": FileType.CODE,
  "text/typescript": FileType.CODE,
  "text/html": FileType.CODE,
  "text/css": FileType.CODE,
  "application/json": FileType.CODE,
  "application/xml": FileType.CODE,
  "text/x-python": FileType.CODE,
  "text/x-java": FileType.CODE,

  // Text
  "text/plain": FileType.TEXT,
  "text/markdown": FileType.TEXT,
};

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_TO_MIME: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",

  // Videos
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
  avi: "video/x-msvideo",

  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  oga: "audio/ogg",
  m4a: "audio/mp4",

  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",

  // Spreadsheets
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",

  // Presentations
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Archives
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",

  // Code
  js: "text/javascript",
  ts: "text/typescript",
  html: "text/html",
  css: "text/css",
  json: "application/json",
  xml: "application/xml",
  py: "text/x-python",
  java: "text/x-java",

  // Text
  txt: "text/plain",
  md: "text/markdown",
};

/**
 * File metadata interface
 */
export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
  mimeType: string;
  fileType: FileType;
  humanReadableSize: string;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: FileType[];
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
  customValidator?: (file: File) => boolean | Promise<boolean>;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get file extension from filename
 * @param filename - File name
 * @returns File extension without dot
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return "";
  }
  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Get MIME type from file extension
 * @param extension - File extension
 * @returns MIME type or null
 */
export const getMimeTypeFromExtension = (extension: string): string | null => {
  return EXTENSION_TO_MIME[extension.toLowerCase()] || null;
};

/**
 * Get file type from MIME type
 * @param mimeType - MIME type
 * @returns File type enum
 */
export const getFileTypeFromMimeType = (mimeType: string): FileType => {
  return MIME_TYPE_MAPPINGS[mimeType] || FileType.UNKNOWN;
};

/**
 * Extract comprehensive file metadata
 * @param file - File object
 * @returns File metadata
 */
export const getFileMetadata = (file: File): FileMetadata => {
  const extension = getFileExtension(file.name);
  const mimeType =
    file.type || getMimeTypeFromExtension(extension) || "unknown";
  const fileType = getFileTypeFromMimeType(mimeType);

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    extension,
    mimeType,
    fileType,
    humanReadableSize: formatFileSize(file.size),
  };
};

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Validate file against specified criteria
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export const validateFile = async (
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata = getFileMetadata(file);

  // Size validation
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(
      `File size (${
        metadata.humanReadableSize
      }) exceeds maximum allowed size (${formatFileSize(options.maxSize)})`
    );
  }

  if (options.minSize && file.size < options.minSize) {
    errors.push(
      `File size (${
        metadata.humanReadableSize
      }) is below minimum required size (${formatFileSize(options.minSize)})`
    );
  }

  // Type validation
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(metadata.fileType)) {
      errors.push(
        `File type "${
          metadata.fileType
        }" is not allowed. Allowed types: ${options.allowedTypes.join(", ")}`
      );
    }
  }

  // Extension validation
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    const normalizedExtensions = options.allowedExtensions.map((ext) =>
      ext.toLowerCase()
    );
    if (!normalizedExtensions.includes(metadata.extension)) {
      errors.push(
        `File extension ".${
          metadata.extension
        }" is not allowed. Allowed extensions: ${normalizedExtensions
          .map((ext) => `.${ext}`)
          .join(", ")}`
      );
    }
  }

  // MIME type validation
  if (options.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    if (!options.allowedMimeTypes.includes(metadata.mimeType)) {
      errors.push(
        `MIME type "${
          metadata.mimeType
        }" is not allowed. Allowed MIME types: ${options.allowedMimeTypes.join(
          ", "
        )}`
      );
    }
  }

  // Custom validation
  if (options.customValidator) {
    try {
      const customResult = await options.customValidator(file);
      if (!customResult) {
        errors.push("File failed custom validation");
      }
    } catch (error) {
      errors.push(
        `Custom validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Warnings for common issues
  if (file.size > 50 * 1024 * 1024) {
    // 50MB
    warnings.push("Large file size may result in slow upload/processing times");
  }

  if (metadata.fileType === FileType.UNKNOWN) {
    warnings.push("Unknown file type detected. Processing may be limited");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Read file as text with encoding detection
 * @param file - File to read
 * @param encoding - Text encoding
 * @returns Promise resolving to file content
 */
export const readFileAsText = (
  file: File,
  encoding: string = "UTF-8"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message}`));
    };

    reader.readAsText(file, encoding);
  });
};

/**
 * Read file as data URL (base64)
 * @param file - File to read
 * @returns Promise resolving to data URL
 */
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message}`));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Read file as array buffer
 * @param file - File to read
 * @returns Promise resolving to array buffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Create file from blob
 * @param blob - Blob data
 * @param filename - File name
 * @param options - File options
 * @returns File object
 */
export const createFileFromBlob = (
  blob: Blob,
  filename: string,
  options?: FilePropertyBag
): File => {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
    ...options,
  });
};

/**
 * Create file from base64 string
 * @param base64 - Base64 string
 * @param filename - File name
 * @param mimeType - MIME type
 * @returns File object
 */
export const createFileFromBase64 = (
  base64: string,
  filename: string,
  mimeType: string = "application/octet-stream"
): File => {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:[^;]+;base64,/, "");

  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return createFileFromBlob(blob, filename);
};

/**
 * Download file from URL
 * @param url - File URL
 * @param filename - Download filename
 * @returns Promise resolving when download starts
 */
export const downloadFile = async (
  url: string,
  filename?: string
): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download =
      filename || url.split("/").pop() || `download_${Date.now()}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);
  } catch (error) {
    throw new Error(
      `Download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Generate unique filename
 * @param originalName - Original filename
 * @param prefix - Optional prefix
 * @returns Unique filename
 */
export const generateUniqueFilename = (
  originalName: string,
  prefix?: string
): string => {
  const extension = getFileExtension(originalName);
  const nameWithoutExtension = originalName.substring(
    0,
    originalName.lastIndexOf(".")
  );
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  const uniqueName = [prefix, nameWithoutExtension, timestamp, random]
    .filter(Boolean)
    .join("_");

  return extension ? `${uniqueName}.${extension}` : uniqueName;
};

/**
 * Check if file is image
 * @param file - File to check
 * @returns Boolean indicating if file is image
 */
export const isImageFile = (file: File): boolean => {
  const metadata = getFileMetadata(file);
  return metadata.fileType === FileType.IMAGE;
};

/**
 * Check if file is video
 * @param file - File to check
 * @returns Boolean indicating if file is video
 */
export const isVideoFile = (file: File): boolean => {
  const metadata = getFileMetadata(file);
  return metadata.fileType === FileType.VIDEO;
};

/**
 * Check if file is audio
 * @param file - File to check
 * @returns Boolean indicating if file is audio
 */
export const isAudioFile = (file: File): boolean => {
  const metadata = getFileMetadata(file);
  return metadata.fileType === FileType.AUDIO;
};

/**
 * Check if file is document
 * @param file - File to check
 * @returns Boolean indicating if file is document
 */
export const isDocumentFile = (file: File): boolean => {
  const metadata = getFileMetadata(file);
  return [
    FileType.DOCUMENT,
    FileType.SPREADSHEET,
    FileType.PRESENTATION,
  ].includes(metadata.fileType);
};

/**
 * Calculate file hash (SHA-256)
 * @param file - File to hash
 * @returns Promise resolving to hex string hash
 */
export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await readFileAsArrayBuffer(file);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

/**
 * Compress image file
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed file
 */
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/png" | "image/webp";
}

export const compressImageFile = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          const compressedFile = createFileFromBlob(blob, file.name, {
            type: format,
          });
          resolve(compressedFile);
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Extract text from text-based files
 * @param file - File to extract text from
 * @returns Promise resolving to extracted text
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const metadata = getFileMetadata(file);

  if (
    [FileType.TEXT, FileType.CODE].includes(metadata.fileType) ||
    metadata.mimeType.startsWith("text/")
  ) {
    return readFileAsText(file);
  }

  throw new Error(`Cannot extract text from file type: ${metadata.fileType}`);
};

/**
 * Batch file processor
 * @param files - Array of files to process
 * @param processor - Processing function
 * @param options - Processing options
 * @returns Promise resolving to processed results
 */
export interface BatchProcessOptions {
  concurrency?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, file: File) => void;
}

export const batchProcessFiles = async <T>(
  files: File[],
  processor: (file: File) => Promise<T>,
  options: BatchProcessOptions = {}
): Promise<Array<{ file: File; result?: T; error?: Error }>> => {
  const { concurrency = 3, onProgress, onError } = options;
  const results: Array<{ file: File; result?: T; error?: Error }> = [];
  let processed = 0;

  const processFile = async (file: File) => {
    try {
      const result = await processor(file);
      results.push({ file, result });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({ file, error: err });
      onError?.(err, file);
    } finally {
      processed++;
      onProgress?.(processed, files.length);
    }
  };

  // Process in batches
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    await Promise.all(batch.map(processFile));
  }

  return results;
};
