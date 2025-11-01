const API_BASE_URL = 'https://backend-3lj5uvvrn-richard-amadeus-projects.vercel.app';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Notes
  NOTES: `${API_BASE_URL}/api/notes`,
  NOTES_BY_ID: (id) => `${API_BASE_URL}/api/notes/${id}`,
  NOTES_BY_SUBJECT: (subjectId) => `${API_BASE_URL}/api/notes/subject/${subjectId}`,
  
  // AI Services
  GEMINI_OCR: `${API_BASE_URL}/api/gemini/ocr`,
  GEMINI_CHAT: `${API_BASE_URL}/api/gemini/chat`,
  
  // Users
  USER_PROFILE: `${API_BASE_URL}/api/user/me`,
  
  // Subjects
  SUBJECTS: `${API_BASE_URL}/api/subjects`
};

export default API_BASE_URL;
