export const uploadTypes = {
  images: {
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp"
    ],
    maxSize: 5 * 1024 * 1024 // 5MB
  },

  documents: {
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    maxSize: 10 * 1024 * 1024 // 10MB
  },

  cad: {
    mimeTypes: [
      "application/acad",
      "application/x-acad",
      "application/dwg",
      "image/vnd.dwg"
    ],
    maxSize: 50 * 1024 * 1024 // 50MB
  },

  mixed: {
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf"
    ],
    maxSize: 20 * 1024 * 1024 // 20MB
  }
};