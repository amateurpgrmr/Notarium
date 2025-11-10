/**
 * Notarium Backend API
 * Handles notes management, user data, chat sessions, and authentication with Gemini AI integration
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface Env {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  JWT_SECRET?: string;
}

interface User {
  id: number;
  encrypted_yw_id?: string;
  display_name?: string;
  email?: string;
  photo_url?: string;
  class?: string;
  role: string;
  notes_uploaded?: number;
  total_likes?: number;
  total_admin_upvotes?: number;
  created_at?: string;
  updated_at?: string;
}

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Encrypted-Yw-ID, X-Is-Login',
};

// Helper function to create JSON responses
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// Initialize database tables
async function initializeDatabase(env: Env) {
  try {
    // Create users table with proper constraints
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        encrypted_yw_id TEXT UNIQUE,
        display_name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        photo_url TEXT,
        class TEXT,
        role TEXT DEFAULT 'student',
        notes_uploaded INTEGER DEFAULT 0,
        total_likes INTEGER DEFAULT 0,
        total_admin_upvotes INTEGER DEFAULT 0,
        suspended INTEGER DEFAULT 0,
        diamonds INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Add missing columns if they don't exist (migration)
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN notes_uploaded INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN total_likes INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN total_admin_upvotes INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN suspended INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN description TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN diamonds INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }

    // Create subjects table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        icon TEXT,
        note_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create notes table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER,
        title TEXT,
        description TEXT,
        subject_id INTEGER,
        extracted_text TEXT,
        image_path TEXT,
        summary TEXT,
        likes INTEGER DEFAULT 0,
        admin_upvotes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
      )
    `).run();

    // Add missing columns to notes table if they don't exist (migration)
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN subject_id INTEGER`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN description TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN extracted_text TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN image_path TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN summary TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN likes INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN admin_upvotes INTEGER DEFAULT 0`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN content TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN tags TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN author_class TEXT`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN status TEXT DEFAULT 'published'`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN scheduled_publish_at DATETIME`).run();
    } catch (e) {
      // Column already exists
    }
    try {
      await env.DB.prepare(`ALTER TABLE notes ADD COLUMN visibility TEXT DEFAULT 'everyone'`).run();
    } catch (e) {
      // Column already exists
    }

    // Create activity log table for admin actions
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        admin_email TEXT,
        action_type TEXT,
        target_type TEXT,
        target_id INTEGER,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `).run();

    // Create chat_sessions table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        subject TEXT,
        topic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create chat_messages table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        role TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
      )
    `).run();

    // Create note_likes table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS note_likes (
        note_id INTEGER,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (note_id, user_id),
        FOREIGN KEY (note_id) REFERENCES notes(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create admin_note_likes table for tracking admin appreciation
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_note_likes (
        note_id INTEGER,
        admin_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (note_id, admin_id),
        FOREIGN KEY (note_id) REFERENCES notes(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `).run();

    // Ensure all default subjects exist (add missing ones if deleted)
    const defaultSubjects = [
      { name: 'Filsafat', icon: '🧠' },
      { name: 'Fisika', icon: '⚛️' },
      { name: 'Matematika', icon: '📐' },
      { name: 'Bahasa Indonesia', icon: '🗣️' },
      { name: 'Bahasa Inggris', icon: '🇬🇧' },
      { name: 'Sosiologi', icon: '👥' },
      { name: 'Sejarah Indonesia', icon: '📜' },
      { name: 'Geografi', icon: '🌍' },
      { name: 'Ekonomi', icon: '💹' },
      { name: 'Sains', icon: '🔬' },
      { name: 'PKN', icon: '🏛️' },
      { name: 'PAK', icon: '⛪' },
      { name: 'Biologi', icon: '🧬' },
      { name: 'Kimia', icon: '🧪' }
    ];

    for (const subject of defaultSubjects) {
      try {
        // Try to insert if it doesn't exist
        await env.DB.prepare('INSERT INTO subjects (name, icon) VALUES (?, ?)').bind(subject.name, subject.icon).run();
      } catch (e) {
        // Subject already exists, skip
      }
    }

    // Remove any subjects that are not in the default list (cleanup old subjects)
    const validSubjectNames = defaultSubjects.map(s => s.name);
    try {
      const placeholders = validSubjectNames.map(() => '?').join(',');
      await env.DB.prepare(`DELETE FROM subjects WHERE name NOT IN (${placeholders})`).bind(...validSubjectNames).run();
      console.log('Cleaned up old subjects');
    } catch (e) {
      console.log('Cleanup skipped or completed');
    }

    // Sync note counts to reflect actual data
    try {
      await syncNoteCounts(env);
      console.log('Note counts synced successfully');
    } catch (e) {
      console.log('Note count sync skipped or failed');
    }

    console.log('Database initialized successfully');
  } catch (error: any) {
    console.error('Database initialization error:', error.message);
    // Don't throw - table might already exist
  }
}

// Sync note counts in subjects table with actual note data
async function syncNoteCounts(env: Env) {
  try {
    // Get actual note counts per subject
    const { results } = await env.DB.prepare(`
      SELECT subject_id, COUNT(*) as actual_count
      FROM notes
      GROUP BY subject_id
    `).all();

    // Update each subject's note_count
    for (const row of (results || [])) {
      const subjectRow = row as any;
      await env.DB.prepare(
        'UPDATE subjects SET note_count = ? WHERE id = ?'
      ).bind(subjectRow.actual_count, subjectRow.subject_id).run();
    }

    // Reset count to 0 for subjects with no notes
    await env.DB.prepare(`
      UPDATE subjects SET note_count = 0
      WHERE id NOT IN (SELECT DISTINCT subject_id FROM notes)
    `).run();

    console.log('Note counts synced with actual data');
  } catch (error: any) {
    console.error('Error syncing note counts:', error.message);
  }
}

// Initialize Gemini API
function getGeminiClient(env: Env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Get user's notes for context
async function getUserNotes(userId: number, subject?: string, env?: Env): Promise<any[]> {
  if (!env) return [];

  let query = 'SELECT id, title, description, subject_id, extracted_text, summary FROM notes WHERE author_id = ?';
  const params: any[] = [userId];

  if (subject) {
    query += ' AND subject_id = (SELECT id FROM subjects WHERE name = ?)';
    params.push(subject);
  }

  query += ' LIMIT 10';

  try {
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return results || [];
  } catch (e) {
    console.error('Error fetching user notes:', e);
    return [];
  }
}

// Format notes for Gemini context - uses AI-cleaned extracted text as knowledge base
function formatNotesForContext(notes: any[]): string {
  if (notes.length === 0) {
    return '';
  }

  const notesSummary = notes.map((note, idx) => {
    // Prioritize extracted_text (Gemini-cleaned OCR) for accurate content
    const content = note.extracted_text || note.description || note.title;
    return `[Note ${idx + 1}] ${note.title}\n${content?.substring(0, 800) || '(No content)'}`;
  }).join('\n\n---\n\n');

  return `\n\nKnowledge Base (User's Study Materials - Use these as primary reference):\n${notesSummary}\n\nInstructions: Answer based on the knowledge base above first, then supplement with general knowledge if needed.`;
}

// Chat with DeepSeek AI using note context - Automatically feeds AI-cleaned note content as knowledge base
async function chatWithGemini(sessionId: string, userMessage: string, subject: string, userId: number, request: Request, env: Env) {
  try {
    // Get user's notes for context - includes DeepSeek-cleaned extracted text from OCR
    const userNotes = await getUserNotes(userId, subject, env);
    const notesContext = formatNotesForContext(userNotes);

    // Get chat history
    const { results: messages } = await env.DB.prepare(`
      SELECT role, content FROM chat_messages
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(sessionId).all();

    const reverseMessages = (messages || []).reverse();

    // Build conversation history for DeepSeek
    const conversationHistory = reverseMessages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add system message at the beginning
    const allMessages = [
      {
        role: 'system',
        content: 'You are a helpful study assistant. Use the provided study notes to answer questions accurately. Always base your answers on the user\'s materials when available. IMPORTANT: Always respond in Indonesian (Bahasa Indonesia).'
      },
      ...conversationHistory
    ];

    // Send message with knowledge base context (invisible to user but feeds the AI)
    const contextualMessage = notesContext
      ? `${userMessage}${notesContext}`
      : userMessage;

    allMessages.push({
      role: 'user',
      content: contextualMessage
    });

    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: allMessages,
        max_tokens: 2048,
        temperature: 0.7
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    const aiResponse = data.choices[0].message.content.trim();

    // Save AI response to database
    await env.DB.prepare(`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
    `).bind(sessionId, 'assistant', aiResponse).run();

    return aiResponse;
  } catch (error: any) {
    console.error('DeepSeek chat error:', error);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// OCR using Google Cloud Vision API + Gemini 2.0 for text formatting
async function performOCR(imageBase64: string, mimeType: string, env: Env) {
  try {
    const apiKey = env.GOOGLE_CLOUD_VISION_API_KEY || env.GEMINI_API_KEY || 'AIzaSyAXy40iGkSBoxidqqrhoz9ZjNlLcyxYO7A';

    if (!apiKey) {
      throw new Error('Google Cloud Vision API key is not configured');
    }

    // Remove data URI prefix if present
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      cleanBase64 = imageBase64.split(',')[1];
    }

    // Step 1: Extract raw text with Cloud Vision API
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: cleanBase64
          },
          features: [{
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      })
    });

    const result = await response.json() as any;

    if (!response.ok) {
      const errorMessage = result.error?.message || 'Unknown Cloud Vision error';
      throw new Error(errorMessage);
    }

    let rawText = '';
    if (result.responses && result.responses[0]) {
      const textAnnotations = result.responses[0].textAnnotations;
      if (textAnnotations && textAnnotations.length > 0) {
        rawText = textAnnotations[0].description;
      } else if (result.responses[0].fullTextAnnotation) {
        rawText = result.responses[0].fullTextAnnotation.text;
      } else {
        return ''; // No text found in image
      }
    } else {
      throw new Error('Invalid response from Cloud Vision API');
    }

    // Step 2: Use DeepSeek to clean up and format the text
    try {
      const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: `Clean up and properly format this OCR-extracted text. Fix any obvious OCR errors, improve formatting, add proper line breaks and structure, but keep all the content intact. Return only the cleaned text without any explanations.

Raw OCR Text:
${rawText}`
          }],
          max_tokens: 4096,
          temperature: 0.2
        })
      });

      const data = await response.json() as any;

      if (response.ok && data.choices && data.choices[0]) {
        const formattedText = data.choices[0].message.content.trim();
        return formattedText;
      } else {
        console.error('DeepSeek formatting failed, returning raw OCR text:', data);
        return rawText;
      }
    } catch (deepseekError: any) {
      console.error('DeepSeek formatting failed, returning raw OCR text:', deepseekError);
      return rawText;
    }
  } catch (error: any) {
    console.error('OCR error:', error);
    throw new Error(`OCR failed: ${error.message}`);
  }
}

// Generate note summary - EXACTLY 2 sentences (Uses DeepSeek)
async function generateNoteSummary(content: string, title: string, env: Env) {
  try {
    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Summarize this study note in EXACTLY 2 sentences. Focus on the main concepts and key points.

Title: "${title}"

Content:
${content.substring(0, 3000)}

IMPORTANT: Your response must be EXACTLY 2 sentences, no more, no less. Write the summary in Indonesian (Bahasa Indonesia).`
        }],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    const summary = data.choices[0].message.content.trim();

    // Ensure it's only 2 sentences by splitting and taking first 2
    const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
    const twoSentences = sentences.slice(0, 2).join(' ').trim();

    return twoSentences;
  } catch (error: any) {
    console.error('DeepSeek summary error:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

// Generate quiz from note
async function generateQuiz(content: string, title: string, env: Env) {
  try {
    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Create a quiz with 5 multiple-choice questions based on the following study note titled "${title}".

Return the response as a JSON object with this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A) option 1", "B) option 2", "C) option 3", "D) option 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}

IMPORTANT: Write all questions, options, and explanations in Indonesian (Bahasa Indonesia).

Content:
${content}`
        }],
        max_tokens: 2048,
        temperature: 0.5
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    const responseText = data.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Invalid quiz format');
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
}

// Generate study plan
async function generateStudyPlan(subject: string, topic: string, env: Env) {
  try {
    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Create a comprehensive 7-day study plan for a student learning about "${topic}" in ${subject}.

The plan should:
- Be realistic and achievable for a high school student
- Include daily goals and activities
- Suggest resources and study techniques
- Include practice problems and self-assessment
- Prepare for exams

Format as a detailed markdown text with clear daily breakdowns. Write the entire plan in Indonesian (Bahasa Indonesia).`
        }],
        max_tokens: 2048,
        temperature: 0.4
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Study plan generation error:', error);
    throw new Error(`Failed to generate study plan: ${error.message}`);
  }
}

// Explain concept
async function explainConcept(concept: string, subject: string, env: Env) {
  try {
    const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Explain the concept of "${concept}" in the context of ${subject}.

Your explanation should:
- Start with a simple definition
- Use real-world examples
- Break down complex ideas
- Include common misconceptions
- Suggest how to remember it
- Provide practice tips

Make it engaging and suitable for high school students. Write the entire explanation in Indonesian (Bahasa Indonesia).`
        }],
        max_tokens: 1500,
        temperature: 0.5
      })
    });

    const data = await response.json() as any;

    if (!response.ok || !data.choices || data.choices.length === 0) {
      throw new Error(data.error?.message || 'DeepSeek API error');
    }

    return data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Concept explanation error:', error);
    throw new Error(`Failed to explain concept: ${error.message}`);
  }
}

// Extract user ID from Bearer token
function getUserIdFromToken(request: Request): number | null {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.id;
  } catch (e) {
    return null;
  }
}

// Extract full user info from Bearer token
function getUserFromToken(request: Request): { id: number; email: string; role: string } | null {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.id && decoded.email && decoded.role) {
      return { id: decoded.id, email: decoded.email, role: decoded.role };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Get or create user from headers - never returns null
async function getOrCreateUser(request: Request, env: Env): Promise<User> {
  // Try to get user ID from Bearer token first
  const userIdFromToken = getUserIdFromToken(request);

  if (userIdFromToken) {
    // Get user from database using ID
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userIdFromToken)
      .first();

    if (user) {
      return user as unknown as User;
    }
  }

  // Fallback to old header-based method
  const userId = request.headers.get('X-Encrypted-Yw-ID');

  if (!userId) {
    throw new Error('User ID not found');
  }

  // Check if user exists
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE encrypted_yw_id = ?')
    .bind(userId)
    .all();

  if (results.length > 0) {
    return results[0] as unknown as User;
  }

  // Create new user (with default class for students who upload notes)
  const insertResult = await env.DB.prepare(
    'INSERT INTO users (encrypted_yw_id, role, class) VALUES (?, ?, ?) RETURNING *'
  ).bind(userId, 'student', '10.1').first();

  if (!insertResult) {
    throw new Error('Failed to create user');
  }

  return insertResult as unknown as User;
}

// Update user info
async function updateUserInfo(request: Request, env: Env) {
  const userId = request.headers.get('X-Encrypted-Yw-ID');
  const body = await request.json() as any;

  // First check if user exists
  const { results } = await env.DB.prepare('SELECT * FROM users WHERE encrypted_yw_id = ?')
    .bind(userId)
    .all();

  if (results.length === 0) {
    // Create new user (with default class)
    await env.DB.prepare(
      'INSERT INTO users (encrypted_yw_id, display_name, photo_url, email, class) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, body.display_name, body.photo_url, body.email, '10.1').run();
  } else {
    // Update existing user
    await env.DB.prepare(
      'UPDATE users SET display_name = ?, photo_url = ?, email = ?, updated_at = datetime("now") WHERE encrypted_yw_id = ?'
    ).bind(body.display_name, body.photo_url, body.email, userId).run();
  }

  return jsonResponse({ success: true });
}

// Get current user info
async function getCurrentUser(request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);
  return jsonResponse({ user });
}

// Update user class
async function updateUserClass(request: Request, env: Env) {
  const userId = request.headers.get('X-Encrypted-Yw-ID');
  const body = await request.json() as any;

  await env.DB.prepare(
    'UPDATE users SET class = ?, updated_at = datetime("now") WHERE encrypted_yw_id = ?'
  ).bind(body.class, userId).run();

  return jsonResponse({ success: true });
}

// Get all subjects
async function getSubjects(request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);

  // Get subjects with accurate note counts (respecting visibility settings)
  const { results } = await env.DB.prepare(`
    SELECT
      s.*,
      (SELECT COUNT(*)
       FROM notes n
       JOIN users u ON n.author_id = u.id
       WHERE n.subject_id = s.id
       AND (n.status = 'published' OR n.status IS NULL)
       AND (
         n.visibility = 'everyone'
         OR n.visibility IS NULL
         OR (n.visibility = 'class' AND u.class = ?)
       )
      ) as note_count
    FROM subjects s
    ORDER BY s.name
  `).bind(user.class).all();

  return jsonResponse({ subjects: results });
}

// Get notes by subject
async function getNotesBySubject(subjectId: string, request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);

  // Show published notes based on visibility setting
  // - Show if visibility is 'everyone' or NULL (old notes)
  // - Show if visibility is 'class' and viewer's class matches author's class
  // - Also show notes where class info is missing (NULL) to avoid hiding old notes
  const { results } = await env.DB.prepare(`
    SELECT
      n.*,
      u.display_name as author_name,
      u.photo_url as author_photo,
      u.class as author_class,
      (SELECT COUNT(*) FROM note_likes WHERE note_id = n.id AND user_id = ?) as liked_by_me,
      (SELECT COUNT(*) FROM admin_note_likes WHERE note_id = n.id AND admin_id = ?) as upvoted_by_me
    FROM notes n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.subject_id = ?
      AND (n.status = 'published' OR n.status IS NULL OR n.status = '')
      AND (
        n.visibility = 'everyone'
        OR n.visibility IS NULL
        OR n.visibility = ''
        OR (n.visibility = 'class' AND (u.class = ? OR u.class IS NULL OR u.class = ''))
      )
    ORDER BY n.created_at DESC
  `).bind(user.id, user.id, subjectId, user.class || '').all();

  return jsonResponse({ notes: results });
}

// Search notes
async function searchNotes(query: string, request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);

  // Search in title, description, and extracted_text, only published notes with visibility check
  const { results } = await env.DB.prepare(`
    SELECT
      n.*,
      u.display_name as author_name,
      u.photo_url as author_photo,
      u.class as author_class,
      s.name as subject_name
    FROM notes n
    JOIN users u ON n.author_id = u.id
    JOIN subjects s ON n.subject_id = s.id
    WHERE (n.title LIKE ? OR n.description LIKE ? OR n.extracted_text LIKE ?)
      AND (n.status = 'published' OR n.status IS NULL)
      AND (
        n.visibility = 'everyone'
        OR n.visibility IS NULL
        OR (n.visibility = 'class' AND u.class = ?)
      )
    ORDER BY n.created_at DESC
    LIMIT 50
  `).bind(`%${query}%`, `%${query}%`, `%${query}%`, user.class).all();

  return jsonResponse({ notes: results });
}

// Create new note
async function createNote(request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);
    const body = await request.json() as any;

    console.log('[CREATE NOTE] User:', user.id, 'Subject:', body.subject_id);

    // Validate required fields
    if (!body.subject_id) {
      console.error('[CREATE NOTE] Missing subject_id');
      return jsonResponse({ error: 'Subject ID is required' }, 400);
    }

    if (!body.title) {
      console.error('[CREATE NOTE] Missing title');
      return jsonResponse({ error: 'Title is required' }, 400);
    }

    // Verify subject exists
    const subject = await env.DB.prepare('SELECT id FROM subjects WHERE id = ?').bind(body.subject_id).first();
    if (!subject) {
      console.error('[CREATE NOTE] Invalid subject_id:', body.subject_id);
      return jsonResponse({ error: 'Invalid subject ID' }, 400);
    }

    // Convert tags array to JSON string for storage
    const tagsJson = body.tags && Array.isArray(body.tags) ? JSON.stringify(body.tags) : '[]';

    // Get user's class for the note
    const userData = await env.DB.prepare('SELECT class FROM users WHERE id = ?').bind(user.id).first() as any;
    const userClass = userData?.class || null;

    // Determine note status (draft or published)
    // ALWAYS default to 'published' unless explicitly set to 'draft'
    const noteStatus = (body.status === 'draft') ? 'draft' : 'published';
    const scheduledPublishAt = body.scheduled_publish_at || null;
    // ALWAYS default to 'everyone' to ensure notes are visible
    const visibility = body.visibility && body.visibility !== '' ? body.visibility : 'everyone';

    // Create note
    const note = await env.DB.prepare(`
      INSERT INTO notes (title, description, subject_id, author_id, author_class, extracted_text, image_path, content, tags, summary, status, scheduled_publish_at, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      body.title,
      body.description || 'No description',
      body.subject_id,
      user.id,
      userClass,
      body.extracted_text || '',
      body.image_path || '',
      body.content || body.description || '',
      tagsJson,
      body.quick_summary || body.description || '',
      noteStatus,
      scheduledPublishAt,
      visibility
    ).first();

    if (!note) {
      console.error('[CREATE NOTE] Failed to create note in database');
      return jsonResponse({ error: 'Failed to create note' }, 500);
    }

    console.log('[CREATE NOTE] Note created:', (note as any).id, 'Status:', noteStatus, 'Visibility:', visibility);

    // Update user stats and subject count (only for published notes, not drafts)
    if (noteStatus === 'published') {
      try {
        await env.DB.batch([
          env.DB.prepare('UPDATE users SET notes_uploaded = notes_uploaded + 1 WHERE id = ?').bind(user.id),
          env.DB.prepare('UPDATE subjects SET note_count = note_count + 1 WHERE id = ?').bind(body.subject_id)
        ]);
        console.log('[CREATE NOTE] Stats updated successfully');
      } catch (updateError) {
        console.error('[CREATE NOTE] Failed to update stats:', updateError);
        // Note was created, so don't fail - just log the error
      }
    } else {
      console.log('[CREATE NOTE] Draft note created, stats not updated');
    }

    return jsonResponse({ note, success: true });
  } catch (error: any) {
    console.error('[CREATE NOTE] Error:', error);
    return jsonResponse({ error: error.message || 'Failed to create note' }, 500);
  }
}

// Update note summary
async function updateNoteSummary(noteId: string, request: Request, env: Env) {
  const body = await request.json() as any;

  await env.DB.prepare(
    'UPDATE notes SET summary = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(body.summary, noteId).run();

  return jsonResponse({ success: true });
}

// Toggle note like
async function toggleNoteLike(noteId: string, request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);

  // Check if already liked
  const { results } = await env.DB.prepare(
    'SELECT * FROM note_likes WHERE note_id = ? AND user_id = ?'
  ).bind(noteId, user.id).all();

  if (results.length > 0) {
    // Unlike
    const note = await env.DB.prepare('SELECT author_id FROM notes WHERE id = ?').bind(noteId).first() as any;

    await env.DB.batch([
      env.DB.prepare('DELETE FROM note_likes WHERE note_id = ? AND user_id = ?').bind(noteId, user.id),
      env.DB.prepare('UPDATE notes SET likes = likes - 1 WHERE id = ?').bind(noteId),
      // Decrement author's total_likes (diamonds only from notes now)
      ...(note && note.author_id ? [
        env.DB.prepare('UPDATE users SET total_likes = total_likes - 1 WHERE id = ?').bind(note.author_id)
      ] : [])
    ]);
    return jsonResponse({ liked: false });
  } else {
    // Like
    const note = await env.DB.prepare('SELECT author_id FROM notes WHERE id = ?').bind(noteId).first() as any;

    await env.DB.batch([
      env.DB.prepare('INSERT INTO note_likes (note_id, user_id) VALUES (?, ?)').bind(noteId, user.id),
      env.DB.prepare('UPDATE notes SET likes = likes + 1 WHERE id = ?').bind(noteId),
      // Increment author's total_likes (diamonds only from notes now)
      ...(note && note.author_id ? [
        env.DB.prepare('UPDATE users SET total_likes = total_likes + 1 WHERE id = ?').bind(note.author_id)
      ] : [])
    ]);
    return jsonResponse({ liked: true });
  }
}



// Get leaderboard
async function getLeaderboard(env: Env) {
  const { results } = await env.DB.prepare(`
    SELECT
      encrypted_yw_id,
      display_name,
      email,
      photo_url,
      class,
      notes_uploaded,
      total_likes,
      total_admin_upvotes,
      notes_uploaded as points
    FROM users
    WHERE role != 'admin'
    ORDER BY notes_uploaded DESC, total_likes DESC
  `).all();

  return jsonResponse({ leaderboard: results });
}

// Helper function to log admin activity
async function logAdminActivity(
  env: Env,
  adminId: number,
  adminEmail: string,
  actionType: string,
  targetType: string,
  targetId: number,
  details: string
) {
  try {
    await env.DB.prepare(`
      INSERT INTO admin_activity_log (admin_id, admin_email, action_type, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(adminId, adminEmail, actionType, targetType, targetId, details).run();
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

// Get admin activity logs
async function getAdminActivityLogs(request: Request, env: Env) {
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const { results } = await env.DB.prepare(`
    SELECT * FROM admin_activity_log
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  return jsonResponse({ logs: results });
}

// Admin verification
async function verifyAdmin(request: Request, env: Env) {
  const body = await request.json() as any;
  const { email, password } = body;

  // Check if email ends with @notarium.site and password matches
  if (email && email.endsWith('@notarium.site') && password === '51234') {
    return jsonResponse({ success: true, isAdmin: true });
  }

  return jsonResponse({ success: false, isAdmin: false, error: 'Invalid credentials' }, 401);
}

// Admin upvote note (gives higher weight)
async function adminUpvoteNote(noteId: string, request: Request, env: Env) {
  const userId = request.headers.get('X-Encrypted-Yw-ID');

  // Verify admin (simplified - in production should verify from database)
  const body = await request.json() as any;
  if (!body.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  // Update note admin upvotes
  await env.DB.prepare(
    'UPDATE notes SET admin_upvotes = admin_upvotes + 1, updated_at = datetime("now") WHERE id = ?'
  ).bind(noteId).run();

  // Get note author and update their total admin upvotes
  const note = await env.DB.prepare('SELECT author_id FROM notes WHERE id = ?').bind(noteId).first();
  if (note) {
    await env.DB.prepare(
      'UPDATE users SET total_admin_upvotes = total_admin_upvotes + 1 WHERE id = ?'
    ).bind(note.author_id).run();
  }

  return jsonResponse({ success: true });
}

// Admin like note (new endpoint using Bearer token auth)
async function adminLikeNote(noteId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  // Check if admin already liked this note
  const { results } = await env.DB.prepare(
    'SELECT * FROM admin_note_likes WHERE note_id = ? AND admin_id = ?'
  ).bind(noteId, adminUser.id).all();

  if (results.length > 0) {
    // Unlike
    const note = await env.DB.prepare('SELECT author_id, title FROM notes WHERE id = ?').bind(noteId).first() as any;

    await env.DB.batch([
      env.DB.prepare('DELETE FROM admin_note_likes WHERE note_id = ? AND admin_id = ?').bind(noteId, adminUser.id),
      env.DB.prepare('UPDATE notes SET admin_upvotes = admin_upvotes - 1 WHERE id = ?').bind(noteId),
      // Update user's total admin upvotes (diamonds only from notes now)
      ...(note && note.author_id ? [
        env.DB.prepare('UPDATE users SET total_admin_upvotes = total_admin_upvotes - 1 WHERE id = ?').bind(note.author_id)
      ] : [])
    ]);

    // Log activity
    await logAdminActivity(env, adminUser.id, adminUser.email, 'unlike', 'note', parseInt(noteId), `Removed admin like from note: ${note?.title || noteId}`);

    return jsonResponse({ liked: false });
  } else {
    // Like
    const note = await env.DB.prepare('SELECT author_id, title FROM notes WHERE id = ?').bind(noteId).first() as any;

    await env.DB.batch([
      env.DB.prepare('INSERT INTO admin_note_likes (note_id, admin_id) VALUES (?, ?)').bind(noteId, adminUser.id),
      env.DB.prepare('UPDATE notes SET admin_upvotes = admin_upvotes + 1 WHERE id = ?').bind(noteId),
      // Update user's total admin upvotes (diamonds only from notes now)
      ...(note && note.author_id ? [
        env.DB.prepare('UPDATE users SET total_admin_upvotes = total_admin_upvotes + 1 WHERE id = ?').bind(note.author_id)
      ] : [])
    ]);

    // Log activity
    await logAdminActivity(env, adminUser.id, adminUser.email, 'like', 'note', parseInt(noteId), `Admin liked note: ${note?.title || noteId} (+4.5 points to author)`);

    return jsonResponse({ liked: true });
  }
}

// Admin delete note
async function deleteNote(noteId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    // Get note details before deletion
    const note = await env.DB.prepare('SELECT id, author_id, subject_id, title FROM notes WHERE id = ?').bind(noteId).first() as any;

    if (!note) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    // Delete related data
    await env.DB.batch([
      // Delete note likes
      env.DB.prepare('DELETE FROM note_likes WHERE note_id = ?').bind(noteId),
      // Delete admin note likes
      env.DB.prepare('DELETE FROM admin_note_likes WHERE note_id = ?').bind(noteId),
      // Delete the note itself
      env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId),
      // Update note count in subjects table (ensure it doesn't go below 0)
      env.DB.prepare('UPDATE subjects SET note_count = MAX(0, note_count - 1) WHERE id = ?').bind(note.subject_id),
      // Update notes_uploaded count for the author (ensure it doesn't go below 0)
      env.DB.prepare('UPDATE users SET notes_uploaded = MAX(0, notes_uploaded - 1) WHERE id = ?').bind(note.author_id)
    ]);

    // Log activity
    await logAdminActivity(env, adminUser.id, adminUser.email, 'delete', 'note', parseInt(noteId), `Deleted note: ${note.title || noteId}`);

    return jsonResponse({ success: true });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return jsonResponse({ error: 'Failed to delete note' }, 500);
  }
}

// User update own note
async function userUpdateNote(noteId: string, request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);
    const body = await request.json() as any;

    // Verify ownership
    const note = await env.DB.prepare('SELECT author_id FROM notes WHERE id = ?').bind(noteId).first() as any;

    if (!note) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    if (note.author_id !== user.id) {
      return jsonResponse({ error: 'Unauthorized - You can only edit your own notes' }, 403);
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content);
    }
    if (body.extracted_text !== undefined) {
      updates.push('extracted_text = ?');
      values.push(body.extracted_text);
    }
    if (body.image_path !== undefined) {
      updates.push('image_path = ?');
      values.push(body.image_path);
    }
    if (body.summary !== undefined) {
      updates.push('summary = ?');
      values.push(body.summary);
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    // Always update updated_at
    updates.push('updated_at = datetime("now")');
    values.push(noteId);

    const query = `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...values).run();

    // Get updated note
    const updatedNote = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(noteId).first();

    return jsonResponse({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return jsonResponse({ error: 'Failed to update note' }, 500);
  }
}

// Get user's own notes
async function getMyNotes(request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);

    // Check if filtering by status
    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status'); // 'draft', 'published', or null for all

    let query = `
      SELECT
        n.id,
        n.title,
        n.subject_id as subject,
        s.name as subject_name,
        n.extracted_text,
        n.summary,
        n.tags,
        n.likes,
        n.admin_upvotes,
        n.created_at,
        n.image_path,
        n.status,
        n.scheduled_publish_at,
        n.subject_id,
        n.visibility
      FROM notes n
      LEFT JOIN subjects s ON n.subject_id = s.id
      WHERE n.author_id = ?
    `;

    const bindings = [user.id];

    if (statusFilter === 'draft') {
      query += ` AND n.status = 'draft'`;
    } else if (statusFilter === 'published') {
      query += ` AND (n.status = 'published' OR n.status IS NULL)`;
    }

    query += ` ORDER BY s.name, n.created_at DESC`;

    const { results: notes } = await env.DB.prepare(query).bind(...bindings).all();

    return jsonResponse({ notes });
  } catch (error: any) {
    console.error('Error getting user notes:', error);
    return jsonResponse({ error: 'Failed to get notes' }, 500);
  }
}

// Publish a draft note
async function publishDraftNote(noteId: string, request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);

    // Get the note and verify ownership
    const note = await env.DB.prepare('SELECT author_id, subject_id, status FROM notes WHERE id = ?').bind(noteId).first() as any;

    if (!note) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    if (note.author_id !== user.id) {
      return jsonResponse({ error: 'Unauthorized - You can only publish your own notes' }, 403);
    }

    if (note.status !== 'draft') {
      return jsonResponse({ error: 'Note is already published' }, 400);
    }

    // Update note status to published
    await env.DB.prepare(`
      UPDATE notes
      SET status = 'published', scheduled_publish_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(noteId).run();

    // Update user stats and subject count (since it's being published now)
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET notes_uploaded = notes_uploaded + 1 WHERE id = ?').bind(user.id),
      env.DB.prepare('UPDATE subjects SET note_count = note_count + 1 WHERE id = ?').bind(note.subject_id)
    ]);

    // Get updated note
    const updatedNote = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(noteId).first();

    return jsonResponse({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error publishing note:', error);
    return jsonResponse({ error: 'Failed to publish note' }, 500);
  }
}

// User delete own note (with point deduction)
async function userDeleteNote(noteId: string, request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);

    // Verify ownership
    const note = await env.DB.prepare('SELECT author_id, subject_id, likes, admin_upvotes FROM notes WHERE id = ?').bind(noteId).first() as any;

    if (!note) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    if (note.author_id !== user.id) {
      return jsonResponse({ error: 'Unauthorized - You can only delete your own notes' }, 403);
    }

    // Calculate points to deduct: user likes (1 each) + admin upvotes (5 each)
    const pointsToDeduct = (note.likes || 0) + ((note.admin_upvotes || 0) * 5);

    // Delete related data and update stats
    await env.DB.batch([
      // Delete note likes
      env.DB.prepare('DELETE FROM note_likes WHERE note_id = ?').bind(noteId),
      // Delete admin note likes
      env.DB.prepare('DELETE FROM admin_note_likes WHERE note_id = ?').bind(noteId),
      // Delete the note itself
      env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId),
      // Update note count in subjects table (ensure it doesn't go below 0)
      env.DB.prepare('UPDATE subjects SET note_count = MAX(0, note_count - 1) WHERE id = ?').bind(note.subject_id),
      // Update user stats: decrease notes_uploaded, total_likes, and total_admin_upvotes (ensure they don't go below 0)
      env.DB.prepare(`
        UPDATE users
        SET
          notes_uploaded = MAX(0, notes_uploaded - 1),
          total_likes = MAX(0, total_likes - ?),
          total_admin_upvotes = MAX(0, total_admin_upvotes - ?)
        WHERE id = ?
      `).bind(note.likes || 0, note.admin_upvotes || 0, user.id)
    ]);

    return jsonResponse({ success: true, points_deducted: pointsToDeduct });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return jsonResponse({ error: 'Failed to delete note' }, 500);
  }
}

// Admin update note
async function updateNote(noteId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const body = await request.json() as any;

    // Get note title before update for logging
    const originalNote = await env.DB.prepare('SELECT title FROM notes WHERE id = ?').bind(noteId).first() as any;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    const changedFields: string[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
      changedFields.push('title');
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
      changedFields.push('description');
    }
    if (body.content !== undefined) {
      updates.push('content = ?');
      values.push(body.content);
      changedFields.push('content');
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
      changedFields.push('tags');
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = datetime("now")');
    values.push(noteId);

    const query = `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...values).run();

    // Fetch and return updated note
    const updatedNote = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(noteId).first();

    // Log activity
    await logAdminActivity(
      env,
      adminUser.id,
      adminUser.email,
      'edit',
      'note',
      parseInt(noteId),
      `Edited note: ${originalNote?.title || noteId} (changed: ${changedFields.join(', ')})`
    );

    return jsonResponse({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return jsonResponse({ error: 'Failed to update note' }, 500);
  }
}

// Suspend user
async function suspendUser(userId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  const body = await request.json() as any;
  const { days, reason } = body;

  // Calculate suspension end date
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (days || 7)); // Default 7 days
  const endDateISO = endDate.toISOString();

  await env.DB.prepare(
    'UPDATE users SET suspended = 1, suspension_end_date = ?, suspension_reason = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(endDateISO, reason || 'Suspended by admin', userId).run();

  return jsonResponse({ success: true, suspension_end_date: endDateISO, reason });
}

// Warn user
async function warnUser(userId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  const body = await request.json() as any;
  const { message } = body;

  await env.DB.prepare(
    'UPDATE users SET warning = 1, warning_message = ?, warning_first_viewed = NULL, warning_view_count = 0, updated_at = datetime("now") WHERE id = ?'
  ).bind(message || 'Warning issued by admin', userId).run();

  return jsonResponse({ success: true, message });
}

// Remove user (soft delete - keep data but mark as removed)
async function removeUser(userId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  // Delete user and all related data
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

  return jsonResponse({ success: true });
}

// Unsuspend user (admin only)
async function unsuspendUser(userId: string, request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  // Clear suspension
  await env.DB.prepare(
    'UPDATE users SET suspended = 0, suspension_end_date = NULL, suspension_reason = NULL, updated_at = datetime("now") WHERE id = ?'
  ).bind(userId).run();

  return jsonResponse({ success: true });
}

// Get all users (admin only)
async function getAllUsers(request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT
        id,
        display_name,
        email,
        class,
        role,
        notes_uploaded,
        total_likes,
        total_admin_upvotes,
        COALESCE(diamonds, 0) as diamonds,
        (notes_uploaded * 10 + total_likes * 4 + total_admin_upvotes * 4.5) as points,
        suspended,
        suspension_end_date,
        suspension_reason,
        warning,
        warning_message,
        photo_url,
        description,
        created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return jsonResponse({ users: results });
  } catch (error: any) {
    // If users table doesn't exist or query fails, return empty list
    console.error('Failed to fetch users:', error);
    return jsonResponse({ users: [] });
  }
}

// Get all notes (admin only)
async function getAllNotes(request: Request, env: Env) {
  // Verify admin using Bearer token
  const adminUser = getUserFromToken(request);

  if (!adminUser || adminUser.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized - Admin access required' }, 403);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT
        n.id,
        n.title,
        n.description,
        n.content,
        n.extracted_text,
        n.summary,
        n.tags,
        n.image_path,
        n.likes,
        n.admin_upvotes,
        n.subject_id,
        n.author_id,
        n.created_at,
        u.display_name as author_name,
        s.name as subject_name,
        s.name as subject,
        (SELECT COUNT(*) FROM admin_note_likes WHERE note_id = n.id AND admin_id = ?) as admin_liked
      FROM notes n
      LEFT JOIN users u ON n.author_id = u.id
      LEFT JOIN subjects s ON n.subject_id = s.id
      ORDER BY n.created_at DESC
    `).bind(adminUser.id).all();

    return jsonResponse({ notes: results });
  } catch (error: any) {
    // If notes table doesn't exist or is empty, return empty list
    console.error('Failed to fetch notes:', error);
    return jsonResponse({ notes: [] });
  }
}

// Create chat session
async function createChatSession(request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);
  const body = await request.json() as any;

  const session = await env.DB.prepare(`
    INSERT INTO chat_sessions (user_id, subject, topic)
    VALUES (?, ?, ?)
    RETURNING *
  `).bind(user.id, body.subject, body.topic).first();

  return jsonResponse({ session });
}

// Get chat sessions
async function getChatSessions(request: Request, env: Env) {
  const user = await getOrCreateUser(request, env);

  const { results } = await env.DB.prepare(`
    SELECT * FROM chat_sessions
    WHERE user_id = ?
    ORDER BY updated_at DESC
    LIMIT 20
  `).bind(user.id).all();

  return jsonResponse({ sessions: results });
}

// Get chat messages
async function getChatMessages(sessionId: string, env: Env) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).bind(sessionId).all();

  return jsonResponse({ messages: results });
}

// Add chat message
async function addChatMessage(sessionId: string, request: Request, env: Env) {
  const body = await request.json() as any;

  const message = await env.DB.prepare(`
    INSERT INTO chat_messages (session_id, role, content)
    VALUES (?, ?, ?)
    RETURNING *
  `).bind(sessionId, body.role, body.content).first();

  // Update session timestamp
  await env.DB.prepare(
    'UPDATE chat_sessions SET updated_at = datetime("now") WHERE id = ?'
  ).bind(sessionId).run();

  return jsonResponse({ message });
}

// Get AI response using Gemini
async function getAIResponse(sessionId: string, request: Request, env: Env) {
  try {
    const user = await getOrCreateUser(request, env);
    const body = await request.json() as any;
    const { message, subject } = body;

    if (!message) {
      return jsonResponse({ error: 'Message is required' }, 400);
    }

    // Save user message
    await env.DB.prepare(`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (?, ?, ?)
    `).bind(sessionId, 'user', message).run();

    // Get chat session to get subject
    const session = await env.DB.prepare(
      'SELECT subject, topic FROM chat_sessions WHERE id = ?'
    ).bind(sessionId).first();

    const chatSubject = subject || (session as any)?.subject || 'General';

    // Get AI response
    const aiResponse = await chatWithGemini(sessionId, message, chatSubject, user.id, request, env);

    return jsonResponse({ response: aiResponse });
  } catch (error: any) {
    console.error('AI Response error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// OCR endpoint
async function performOCREndpoint(request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return jsonResponse({ error: 'Image base64 is required' }, 400);
    }

    const text = await performOCR(imageBase64, mimeType || 'image/jpeg', env);

    return jsonResponse({ text, success: true });
  } catch (error: any) {
    console.error('OCR endpoint error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// Generate note summary endpoint
async function generateNoteSummaryEndpoint(noteId: string, request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { content, title } = body;

    if (!content) {
      return jsonResponse({ error: 'Content is required' }, 400);
    }

    const summary = await generateNoteSummary(content, title || 'Untitled', env);

    // Update note with summary
    await env.DB.prepare(
      'UPDATE notes SET summary = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(summary, noteId).run();

    return jsonResponse({ summary });
  } catch (error: any) {
    console.error('Summary generation endpoint error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// Generate quiz endpoint
async function generateQuizEndpoint(noteId: string, request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { content, title } = body;

    if (!content) {
      return jsonResponse({ error: 'Content is required' }, 400);
    }

    const quiz = await generateQuiz(content, title || 'Untitled', env);

    return jsonResponse({ quiz });
  } catch (error: any) {
    console.error('Quiz generation endpoint error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// Generate study plan endpoint
async function generateStudyPlanEndpoint(request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { subject, topic } = body;

    if (!subject || !topic) {
      return jsonResponse({ error: 'Subject and topic are required' }, 400);
    }

    const plan = await generateStudyPlan(subject, topic, env);

    return jsonResponse({ plan });
  } catch (error: any) {
    console.error('Study plan generation endpoint error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// Explain concept endpoint
async function explainConceptEndpoint(request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { concept, subject } = body;

    if (!concept) {
      return jsonResponse({ error: 'Concept is required' }, 400);
    }

    const explanation = await explainConcept(concept, subject || 'General', env);

    return jsonResponse({ explanation });
  } catch (error: any) {
    console.error('Concept explanation endpoint error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// ============ AUTH ENDPOINTS ============

// Sign up endpoint
async function signupEndpoint(request: Request, env: Env) {
  try {
    const body = await request.json() as any;
    const { name, email, password, class: userClass } = body;

    if (!email || !password || !name) {
      return jsonResponse({ error: 'Missing required fields: name, email, password' }, 400);
    }

    // Check if user already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return jsonResponse({ error: 'Email already registered' }, 409);
    }

    // Create new user
    const user = await env.DB.prepare(`
      INSERT INTO users (display_name, email, password_hash, class, role, notes_uploaded, total_likes, total_admin_upvotes, diamonds, created_at)
      VALUES (?, ?, ?, ?, 'student', 0, 0, 0, 0, datetime('now'))
      RETURNING id, email, display_name, class, role, notes_uploaded, total_likes, total_admin_upvotes, diamonds, description, photo_url
    `).bind(name, email, password, userClass || null).first();

    if (!user) {
      return jsonResponse({ error: 'Failed to create user' }, 500);
    }

    // Create a simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ id: (user as any).id, email: (user as any).email })).toString('base64');

    // Calculate points
    const points = ((user as any).notes_uploaded || 0) * 10 + ((user as any).total_likes || 0) * 4 + ((user as any).total_admin_upvotes || 0) * 4.5;

    return jsonResponse({
      token,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).display_name,
        class: (user as any).class,
        role: (user as any).role,
        notes_count: (user as any).notes_uploaded || 0,
        total_likes: (user as any).total_likes || 0,
        total_admin_upvotes: (user as any).total_admin_upvotes || 0,
        diamonds: (user as any).diamonds || 0,
        points: points,
        description: (user as any).description || null,
        photo_url: (user as any).photo_url || null
      }
    }, 201);
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.message && error.message.includes('UNIQUE')) {
      return jsonResponse({ error: 'Email already registered' }, 409);
    }
    return jsonResponse({ error: error.message || 'Signup failed' }, 500);
  }
}

// Login endpoint
async function loginEndpoint(request: Request, env: Env) {
  try {
    console.log('[LOGIN] Request received');

    // Parse request body
    let body;
    try {
      body = await request.json() as any;
      console.log('[LOGIN] Body parsed:', { email: body?.email, hasPassword: !!body?.password });
    } catch (parseError) {
      console.error('[LOGIN] Body parse error:', parseError);
      return jsonResponse({ error: 'Invalid request body format' }, 400);
    }

    const { email, password } = body;

    if (!email || !password) {
      console.error('[LOGIN] Missing credentials');
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    console.log('[LOGIN] Querying user:', email);

    // Query user from database
    let user;
    try {
      // Try to query with all columns first
      user = await env.DB.prepare(`
        SELECT
          id,
          email,
          display_name,
          password_hash,
          class,
          role,
          notes_uploaded,
          total_likes,
          total_admin_upvotes,
          COALESCE(diamonds, 0) as diamonds,
          description,
          photo_url,
          suspended,
          suspension_end_date,
          suspension_reason
        FROM users WHERE email = ?
      `).bind(email).first();
      console.log('[LOGIN] User query result:', { found: !!user, userId: (user as any)?.id });
    } catch (dbError: any) {
      console.error('[LOGIN] Database query error (attempt 1):', { message: dbError?.message });

      // Fallback: try without diamonds column
      try {
        user = await env.DB.prepare(`
          SELECT
            id,
            email,
            display_name,
            password_hash,
            class,
            role,
            notes_uploaded,
            total_likes,
            total_admin_upvotes,
            description,
            photo_url,
            suspended,
            suspension_end_date,
            suspension_reason
          FROM users WHERE email = ?
        `).bind(email).first();

        // Add diamonds with default value
        if (user) {
          (user as any).diamonds = 0;
        }
        console.log('[LOGIN] User query result (fallback):', { found: !!user, userId: (user as any)?.id });
      } catch (fallbackError: any) {
        console.error('[LOGIN] Database query error (attempt 2):', { message: fallbackError?.message });
        return jsonResponse({ error: `Database error: ${fallbackError?.message || 'could not query user'}` }, 500);
      }
    }

    if (!user) {
      console.log('[LOGIN] User not found:', email);
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    if ((user as any).password_hash !== password) {
      console.log('[LOGIN] Password mismatch for user:', email);
      return jsonResponse({ error: 'Invalid email or password' }, 401);
    }

    // Check if user is suspended
    if ((user as any).suspended === 1) {
      const now = new Date();
      const suspensionEndDate = (user as any).suspension_end_date ? new Date((user as any).suspension_end_date) : null;

      // If suspension has expired, clear it
      if (suspensionEndDate && now > suspensionEndDate) {
        console.log('[LOGIN] Suspension expired, clearing for user:', (user as any).id);
        await env.DB.prepare(
          'UPDATE users SET suspended = 0, suspension_end_date = NULL, suspension_reason = NULL, updated_at = datetime("now") WHERE id = ?'
        ).bind((user as any).id).run();
        (user as any).suspended = 0;
        (user as any).suspension_end_date = null;
        (user as any).suspension_reason = null;
      } else {
        // Suspension is still active
        console.log('[LOGIN] User is suspended:', (user as any).id);
        const daysRemaining = suspensionEndDate
          ? Math.ceil((suspensionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return jsonResponse({
          error: 'Account suspended',
          suspended: true,
          suspension_end_date: (user as any).suspension_end_date,
          suspension_reason: (user as any).suspension_reason || 'Suspended by admin',
          days_remaining: daysRemaining
        }, 403);
      }
    }

    console.log('[LOGIN] Creating token for user:', (user as any).id);

    // Create token with role included
    const token = Buffer.from(JSON.stringify({
      id: (user as any).id,
      email: (user as any).email,
      role: (user as any).role || 'student'
    })).toString('base64');

    // Calculate points
    const points = (user as any).notes_uploaded * 10 + (user as any).total_likes * 4 + (user as any).total_admin_upvotes * 4.5;

    console.log('[LOGIN] Login successful for user:', (user as any).id);

    return jsonResponse({
      success: true,
      token,
      user: {
        id: (user as any).id,
        email: (user as any).email,
        name: (user as any).display_name,
        class: (user as any).class,
        role: (user as any).role,
        notes_count: (user as any).notes_uploaded || 0,
        total_likes: (user as any).total_likes || 0,
        total_admin_upvotes: (user as any).total_admin_upvotes || 0,
        diamonds: (user as any).diamonds || 0,
        points: points,
        description: (user as any).description || null,
        photo_url: (user as any).photo_url || null
      }
    });
  } catch (error: any) {
    console.error('[LOGIN] Unexpected error:', error, { message: error?.message, stack: error?.stack });
    return jsonResponse({ error: `Login failed: ${error?.message || 'Unknown error'}` }, 500);
  }
}

// Get current user endpoint
async function meEndpoint(request: Request, env: Env) {
  try {
    const auth = request.headers.get('Authorization');
    console.log('[ME] Auth header:', {
      hasAuth: !!auth,
      authLength: auth?.length || 0,
      authPreview: auth ? auth.substring(0, 30) + '...' : 'NO_AUTH'
    });

    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
      console.error('[ME] No token provided');
      return jsonResponse({ error: 'Unauthorized - No token provided' }, 401);
    }

    console.log('[ME] Token received:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // Validate and decode token
    let decoded;
    try {
      const decodedStr = Buffer.from(token, 'base64').toString();
      console.log('[ME] Decoded token string:', decodedStr);
      decoded = JSON.parse(decodedStr);
      console.log('[ME] Parsed token:', { id: decoded.id, email: decoded.email });
    } catch (tokenError) {
      console.error('[ME] Token decode error:', tokenError);
      return jsonResponse({ error: 'Invalid token format' }, 401);
    }

    if (!decoded.id) {
      console.error('[ME] Token missing user ID:', decoded);
      return jsonResponse({ error: 'Invalid token - missing user ID' }, 401);
    }

    const userId = decoded.id;

    try {
      let userData;
      try {
        userData = await env.DB.prepare(`
          SELECT
            id,
            email,
            display_name,
            photo_url,
            class,
            role,
            notes_uploaded,
            total_likes,
            total_admin_upvotes,
            COALESCE(diamonds, 0) as diamonds,
            description,
            suspended,
            suspension_end_date,
            suspension_reason,
            warning,
            warning_message,
            warning_first_viewed,
            warning_view_count,
            (notes_uploaded * 10 + total_likes * 4 + total_admin_upvotes * 6) as points
          FROM users WHERE id = ?
        `).bind(userId).first() as any;
      } catch (e) {
        // Fallback without diamonds column
        userData = await env.DB.prepare(`
          SELECT
            id,
            email,
            display_name,
            photo_url,
            class,
            role,
            notes_uploaded,
            total_likes,
            total_admin_upvotes,
            description,
            suspended,
            suspension_end_date,
            suspension_reason,
            warning,
            warning_message,
            warning_first_viewed,
            warning_view_count,
            (notes_uploaded * 10 + total_likes * 4 + total_admin_upvotes * 6) as points
          FROM users WHERE id = ?
        `).bind(userId).first() as any;
        if (userData) {
          userData.diamonds = 0;
        }
      }

      if (!userData) {
        return jsonResponse({ error: 'User not found' }, 404);
      }

      // Check if user is suspended and if suspension has expired
      if (userData.suspended === 1) {
        const now = new Date();
        const suspensionEndDate = userData.suspension_end_date ? new Date(userData.suspension_end_date) : null;

        // If suspension has expired, clear it
        if (suspensionEndDate && now > suspensionEndDate) {
          console.log('[ME] Suspension expired, clearing for user:', userId);
          await env.DB.prepare(
            'UPDATE users SET suspended = 0, suspension_end_date = NULL, suspension_reason = NULL, updated_at = datetime("now") WHERE id = ?'
          ).bind(userId).run();
          userData.suspended = 0;
          userData.suspension_end_date = null;
          userData.suspension_reason = null;
        }
      }

      // Handle warning tracking and auto-dismissal
      if (userData.warning === 1 && userData.warning_message) {
        const now = new Date();
        let shouldClearWarning = false;

        // Set first viewed timestamp if not set
        if (!userData.warning_first_viewed) {
          await env.DB.prepare(`
            UPDATE users
            SET warning_first_viewed = ?, warning_view_count = 1, updated_at = datetime("now")
            WHERE id = ?
          `).bind(now.toISOString(), userId).run();
          userData.warning_view_count = 1;
          userData.warning_first_viewed = now.toISOString();
        } else {
          // Check if 24 hours have passed
          const firstViewed = new Date(userData.warning_first_viewed);
          const hoursPassed = (now.getTime() - firstViewed.getTime()) / (1000 * 60 * 60);

          if (hoursPassed >= 24) {
            shouldClearWarning = true;
          } else {
            // Increment view count
            const newViewCount = (userData.warning_view_count || 0) + 1;

            if (newViewCount >= 5) {
              shouldClearWarning = true;
            } else {
              // Update view count
              await env.DB.prepare(`
                UPDATE users
                SET warning_view_count = ?, updated_at = datetime("now")
                WHERE id = ?
              `).bind(newViewCount, userId).run();
              userData.warning_view_count = newViewCount;
            }
          }
        }

        // Clear warning if conditions are met
        if (shouldClearWarning) {
          await env.DB.prepare(`
            UPDATE users
            SET warning = 0, warning_message = NULL, warning_first_viewed = NULL, warning_view_count = 0, updated_at = datetime("now")
            WHERE id = ?
          `).bind(userId).run();
          userData.warning = 0;
          userData.warning_message = null;
          userData.warning_first_viewed = null;
          userData.warning_view_count = 0;
        }
      }

      // Map database fields to frontend interface
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.display_name,
        class: userData.class,
        role: userData.role,
        notes_count: userData.notes_uploaded || 0,
        total_likes: userData.total_likes || 0,
        total_admin_upvotes: userData.total_admin_upvotes || 0,
        diamonds: userData.diamonds || 0,
        points: userData.points || 0,
        photo_url: userData.photo_url || null,
        description: userData.description || null,
        suspended: userData.suspended || 0,
        suspension_end_date: userData.suspension_end_date || null,
        suspension_reason: userData.suspension_reason || null,
        warning: userData.warning || 0,
        warning_message: userData.warning_message || null
      };

      return jsonResponse({ user });
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      return jsonResponse({ error: 'Failed to get user data' }, 500);
    }
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return jsonResponse({ error: error.message || 'Failed to get current user' }, 500);
  }
}

// Main request handler
let dbInitialized = false;

// Mock data for development/demo
const MOCK_SUBJECTS = [
  { id: 1, name: 'Filsafat', icon: '🧠', note_count: 0 },
  { id: 2, name: 'Fisika', icon: '⚛️', note_count: 0 },
  { id: 3, name: 'Matematika', icon: '📐', note_count: 0 },
  { id: 4, name: 'Bahasa Indonesia', icon: '🗣️', note_count: 0 },
  { id: 5, name: 'Bahasa Inggris', icon: '🇬🇧', note_count: 0 },
  { id: 6, name: 'Sosiologi', icon: '👥', note_count: 0 },
  { id: 7, name: 'Sejarah Indonesia', icon: '📜', note_count: 0 },
  { id: 8, name: 'Geografi', icon: '🌍', note_count: 0 },
  { id: 9, name: 'Ekonomi', icon: '💹', note_count: 0 },
  { id: 10, name: 'Sains', icon: '🔬', note_count: 0 },
  { id: 11, name: 'PKN', icon: '🏛️', note_count: 0 },
  { id: 12, name: 'PAK', icon: '⛪', note_count: 0 },
  { id: 13, name: 'Biologi', icon: '🧬', note_count: 0 },
  { id: 14, name: 'Kimia', icon: '🧪', note_count: 0 },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Initialize database on first request if available
    if (env.DB && !dbInitialized) {
      try {
        await initializeDatabase(env);
        dbInitialized = true;
      } catch (error) {
        console.log('Database initialization skipped, using mock data');
      }
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Encrypted-Yw-ID, X-Is-Login',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`[DEBUG] Request: ${request.method} ${path}`);
    console.log(`[DEBUG] env.DB available: ${!!env.DB}`);

    // Test endpoint to verify worker is responding
    if (path === '/test') {
      return jsonResponse({ message: 'Worker is running', timestamp: new Date().toISOString() });
    }

    try {
      // Auth routes
      if (path === '/api/auth/signup' && request.method === 'POST') {
        console.log('[DEBUG] Matched signup route');
        if (!env.DB) {
          return jsonResponse({ error: 'Database not available' }, 503);
        }
        return await signupEndpoint(request, env);
      }

      if (path === '/api/auth/login' && request.method === 'POST') {
        if (!env.DB) {
          return jsonResponse({ error: 'Database not available' }, 503);
        }
        return await loginEndpoint(request, env);
      }

      if (path === '/api/auth/me' && request.method === 'GET') {
        if (!env.DB) {
          return jsonResponse({ error: 'Database not available' }, 503);
        }
        return await meEndpoint(request, env);
      }

      if (path === '/api/auth/admin-login' && request.method === 'POST') {
        if (!env.DB) {
          return jsonResponse({ error: 'Database not available' }, 503);
        }
        try {
          const body = await request.json() as any;
          const { email, password, class: classValue } = body;

          console.log('[ADMIN-LOGIN] Request:', { email, hasPassword: !!password, classValue });

          // Check admin credentials
          if (!email.endsWith('@notarium.site') || password !== 'notariumanagers') {
            return jsonResponse({ error: 'Invalid admin credentials' }, 401);
          }

          // Validate class value
          const validClass = classValue || '10.1';
          console.log('[ADMIN-LOGIN] Validated class:', validClass, 'type:', typeof validClass);
          if (!['10.1', '10.2', '10.3'].includes(validClass)) {
            return jsonResponse({ error: 'Invalid class value' }, 400);
          }

          // Check if admin user exists or create
          console.log('[ADMIN-LOGIN] Checking for existing user...');
          let admin = await env.DB.prepare(
            `SELECT * FROM users WHERE email = ?`
          ).bind(email).first();
          console.log('[ADMIN-LOGIN] Existing user found:', !!admin);

          if (!admin) {
            // Create admin user with specified class
            const result = await env.DB.prepare(`
              INSERT INTO users (encrypted_yw_id, display_name, email, password_hash, class, role, created_at)
              VALUES (?, ?, ?, ?, ?, 'admin', datetime('now'))
              RETURNING id, email, display_name, class, role
            `).bind('admin_' + email, 'Admin', email, password, validClass).first();
            admin = result;
          } else {
            // Update existing user: set role to admin and update class
            console.log('[ADMIN-LOGIN] Updating existing user:', email, 'with class:', validClass);
            console.log('[ADMIN-LOGIN] Current user data:', admin);
            try {
              await env.DB.prepare(
                `UPDATE users SET role = 'admin', class = ?, updated_at = datetime('now') WHERE email = ?`
              ).bind(validClass, email).run();
              console.log('[ADMIN-LOGIN] Update successful');

              // Re-fetch the updated user
              admin = await env.DB.prepare(
                `SELECT * FROM users WHERE email = ?`
              ).bind(email).first();
              console.log('[ADMIN-LOGIN] Re-fetched user:', admin);
            } catch (updateError: any) {
              console.error('[ADMIN-LOGIN] Update failed:', updateError);
              console.error('[ADMIN-LOGIN] Error details:', JSON.stringify(updateError));
              throw new Error(`Failed to update admin user: ${updateError.message}`);
            }
          }

          // Create token
          const token = Buffer.from(JSON.stringify({ id: (admin as any).id, email: (admin as any).email, role: 'admin' })).toString('base64');

          return jsonResponse({
            token,
            user: {
              id: (admin as any).id,
              email: (admin as any).email,
              name: (admin as any).display_name,
              role: 'admin'
            }
          });
        } catch (error: any) {
          return jsonResponse({ error: error.message }, 500);
        }
      }

      // Super simple debug endpoint
      if (path === '/api/debug/ping' && request.method === 'POST') {
        console.log('[DEBUG] PING endpoint called!');
        return jsonResponse({ ok: true, message: 'Pong!' });
      }

      // Debug endpoint to verify database write
      if (path === '/api/debug/verify-update' && request.method === 'POST') {
        try {
          const body = await request.json() as any;
          const { userId, name } = body;

          console.log('[DEBUG] Testing direct database write...');

          // First check current value
          const before = await env.DB.prepare(`SELECT display_name FROM users WHERE id = ?`).bind(userId).first() as any;
          console.log('[DEBUG] Before update:', before);

          // Do a simple update
          await env.DB.prepare(
            `UPDATE users SET display_name = ? WHERE id = ?`
          ).bind(name, userId).run();

          // Check after value
          const after = await env.DB.prepare(`SELECT display_name FROM users WHERE id = ?`).bind(userId).first() as any;
          console.log('[DEBUG] After update:', after);

          return jsonResponse({ before, after });
        } catch (error: any) {
          console.error('[DEBUG] Error:', error);
          return jsonResponse({ error: error.message }, 500);
        }
      }

      if (path === '/api/auth/profile' && request.method === 'PUT') {
        if (!env.DB) {
          return jsonResponse({ error: 'Database not available' }, 503);
        }
        try {
          const auth = request.headers.get('Authorization');
          console.log('[PROFILE] Auth header:', {
            hasAuth: !!auth,
            authLength: auth?.length || 0,
            authPreview: auth ? auth.substring(0, 30) + '...' : 'NO_AUTH'
          });

          const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;

          if (!token) {
            console.error('[PROFILE] No token provided');
            return jsonResponse({ error: 'Unauthorized - No token provided' }, 401);
          }

          console.log('[PROFILE] Token received:', {
            tokenLength: token.length,
            tokenPreview: token.substring(0, 20) + '...'
          });

          // Validate and decode token
          let decoded;
          try {
            const decodedStr = Buffer.from(token, 'base64').toString();
            console.log('[PROFILE] Decoded token string:', decodedStr);
            decoded = JSON.parse(decodedStr);
            console.log('[PROFILE] Parsed token:', { id: decoded.id, email: decoded.email });
          } catch (tokenError) {
            console.error('[PROFILE] Token decode error:', tokenError);
            return jsonResponse({ error: 'Invalid token format' }, 401);
          }

          if (!decoded.id) {
            console.error('[PROFILE] Token missing user ID:', decoded);
            return jsonResponse({ error: 'Invalid token - missing user ID' }, 401);
          }

          const userId = decoded.id;

          // Parse request body
          let body;
          try {
            body = await request.json() as any;
          } catch (bodyError) {
            console.error('Body parse error:', bodyError);
            return jsonResponse({ error: 'Invalid request body' }, 400);
          }

          // Update user profile - build update query dynamically
          console.log('[PROFILE] Request body:', body);
          console.log('[PROFILE] User ID from token:', userId);

          const updates: string[] = [];
          const values: any[] = [];

          // Add fields to update
          if (body.name) {
            updates.push('display_name = ?');
            values.push(body.name);
          }
          if (body.display_name) {
            updates.push('display_name = ?');
            values.push(body.display_name);
          }
          if (body.photo_url) {
            updates.push('photo_url = ?');
            values.push(body.photo_url);
          }
          if (body.email) {
            updates.push('email = ?');
            values.push(body.email);
          }
          if (body.class) {
            updates.push('class = ?');
            values.push(body.class);
          }
          if (body.description !== undefined) {
            updates.push('description = ?');
            values.push(body.description || null);
          }

          // Always update the timestamp
          updates.push('updated_at = ?');
          values.push(new Date().toISOString());

          console.log('[PROFILE] Fields to update:', updates);

          if (updates.length === 1) {
            // Only updated_at, no real changes
            console.log('[PROFILE] No fields to update, only timestamp');
            return jsonResponse({ success: true, updated: false });
          }

          try {
            values.push(userId); // Add userId for WHERE clause
            const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            console.log('[PROFILE] SQL:', sql);
            console.log('[PROFILE] Values count:', values.length);

            const result = await env.DB.prepare(sql)
              .bind(...values)
              .run();

            console.log('[PROFILE] Update result:', result);
            console.log('[PROFILE] Changes made:', result?.meta?.changes || 0);

            // Verify the update by reading it back
            const updated = await env.DB.prepare(`
              SELECT id, display_name, photo_url, email, class, description FROM users WHERE id = ?
            `).bind(userId).first() as any;

            console.log('[PROFILE] Verification - Updated user data:', updated);

            return jsonResponse({ success: true, updated: true, user: updated });
          } catch (dbError: any) {
            console.error('[PROFILE] Database update error:', dbError);
            return jsonResponse({ error: `Failed to update profile: ${dbError.message}` }, 500);
          }
        } catch (error: any) {
          console.error('Profile update error:', error);
          return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
      }

      // User routes (only if database available)
      if (env.DB && path === '/api/user/update' && request.method === 'POST') {
        return await updateUserInfo(request, env);
      }

      if (env.DB && path === '/api/user/me' && request.method === 'GET') {
        return await getCurrentUser(request, env);
      }

      if (env.DB && path === '/api/user/class' && request.method === 'PUT') {
        return await updateUserClass(request, env);
      }

      // Subject routes - use mock data as fallback
      if (path === '/api/subjects' && request.method === 'GET') {
        if (!env.DB) {
          return jsonResponse({ subjects: MOCK_SUBJECTS });
        }
        return await getSubjects(request, env);
      }

      // Note routes
      if (path.startsWith('/api/notes/subject/')) {
        const subjectId = path.split('/').pop();
        return await getNotesBySubject(subjectId!, request, env);
      }

      if (path === '/api/notes/search' && request.method === 'GET') {
        const query = url.searchParams.get('q') || '';
        return await searchNotes(query, request, env);
      }

      if (path === '/api/notes' && request.method === 'POST') {
        return await createNote(request, env);
      }

      if (path.match(/^\/api\/notes\/\d+$/) && request.method === 'PUT') {
        const noteId = path.split('/')[3];
        return await userUpdateNote(noteId, request, env);
      }

      if (path.match(/^\/api\/notes\/\d+\/summary$/) && request.method === 'PUT') {
        const noteId = path.split('/')[3];
        return await updateNoteSummary(noteId, request, env);
      }

      if (path.match(/^\/api\/notes\/\d+\/like$/) && request.method === 'POST') {
        const noteId = path.split('/')[3];
        return await toggleNoteLike(noteId, request, env);
      }

      // My Notes routes
      if (path === '/api/notes/my-notes' && request.method === 'GET') {
        return await getMyNotes(request, env);
      }

      if (path.match(/^\/api\/notes\/\d+\/publish$/) && request.method === 'POST') {
        const noteId = path.split('/')[3];
        return await publishDraftNote(noteId, request, env);
      }

      if (path.match(/^\/api\/notes\/\d+$/) && request.method === 'DELETE') {
        const noteId = path.split('/')[3];
        return await userDeleteNote(noteId, request, env);
      }

      // Leaderboard
      if (path === '/api/leaderboard' && request.method === 'GET') {
        return await getLeaderboard(env);
      }

      // Chat routes
      if (path === '/api/chat/sessions' && request.method === 'POST') {
        return await createChatSession(request, env);
      }

      if (path === '/api/chat/sessions' && request.method === 'GET') {
        return await getChatSessions(request, env);
      }

      if (path.match(/^\/api\/chat\/sessions\/\d+\/messages$/) && request.method === 'GET') {
        const sessionId = path.split('/')[4];
        return await getChatMessages(sessionId, env);
      }

      if (path.match(/^\/api\/chat\/sessions\/\d+\/messages$/) && request.method === 'POST') {
        const sessionId = path.split('/')[4];
        return await addChatMessage(sessionId, request, env);
      }

      if (path.match(/^\/api\/chat\/sessions\/\d+\/ai-response$/) && request.method === 'POST') {
        const sessionId = path.split('/')[4];
        if (!env.DB) {
          const body = await request.json() as any;
          const mockResponse = `That's a great question about ${body.message?.substring(0, 20) || 'this topic'}. Let me explain: This is an important concept in education. Understanding this will help you succeed in your studies. Feel free to ask follow-up questions!`;
          return jsonResponse({ response: mockResponse });
        }
        return await getAIResponse(sessionId, request, env);
      }

      // AI/Gemini routes
      if (path === '/api/gemini/quick-summary' && request.method === 'POST') {
        if (!env.GEMINI_API_KEY) {
          // Fallback when no API key
          const body = await request.json() as any;
          const summary = `${body.title || 'Study material'}: ${body.content?.substring(0, 80) || 'No content available'}...`;
          return jsonResponse({ success: true, summary });
        }

        try {
          const body = await request.json() as any;
          const { title, content } = body;

          if (!content) {
            return jsonResponse({ error: 'Content is required' }, 400);
          }

          const summary = await generateNoteSummary(content, title || 'Untitled', env);
          return jsonResponse({ success: true, summary });
        } catch (error: any) {
          console.error('Quick summary error:', error);
          return jsonResponse({ error: error.message || 'Failed to generate summary' }, 500);
        }
      }

      if (path === '/api/gemini/auto-tags' && request.method === 'POST') {
        try {
          const body = await request.json() as any;
          const { title, content } = body;

          const deepseekApiKey = env.DEEPSEEK_API_KEY || 'sk-5691768e614e4bfc9f563f0a45741be1';

          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${deepseekApiKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{
                role: 'user',
                content: `Generate 3-5 relevant study tags for this note. Return ONLY the tags as a comma-separated list, nothing else. Write the tags in Indonesian (Bahasa Indonesia).

Title: ${title || 'Untitled'}
Content: ${content?.substring(0, 500) || 'No content'}

Tags:`
              }],
              max_tokens: 50,
              temperature: 0.4
            })
          });

          const data = await response.json() as any;

          if (!response.ok || !data.choices || data.choices.length === 0) {
            throw new Error('DeepSeek API error');
          }

          const tagsText = data.choices[0].message.content.trim();
          const tags = tagsText.split(',').map(t => t.trim()).filter(t => t && t.length > 0).slice(0, 5);

          return jsonResponse({ success: true, tags: tags.length > 0 ? tags : ['study', 'notes'] });
        } catch (error: any) {
          console.error('Auto tags error:', error);
          // Fallback tags on error
          return jsonResponse({ success: true, tags: ['study', 'notes', 'learning'] });
        }
      }

      if (path === '/api/gemini/summarize' && request.method === 'POST') {
        if (!env.GEMINI_API_KEY) {
          const body = await request.json() as any;
          const summary = `${body.title || 'Topic'}: ${body.description || 'This covers key concepts'}.`;
          return jsonResponse({ success: true, summary });
        }

        try {
          const body = await request.json() as any;
          const summary = await generateNoteSummary(body.content || body.description, body.title || 'Untitled', env);
          return jsonResponse({ success: true, summary });
        } catch (error: any) {
          console.error('Summarize error:', error);
          return jsonResponse({ error: error.message }, 500);
        }
      }

      if (path === '/api/gemini/ocr' && request.method === 'POST') {
        return await performOCREndpoint(request, env);
      }

      if (path.match(/^\/api\/notes\/\d+\/summary$/) && request.method === 'POST') {
        const noteId = path.split('/')[3];
        return await generateNoteSummaryEndpoint(noteId, request, env);
      }

      if (path.match(/^\/api\/notes\/\d+\/quiz$/) && request.method === 'POST') {
        const noteId = path.split('/')[3];
        return await generateQuizEndpoint(noteId, request, env);
      }

      if (path === '/api/study-plan' && request.method === 'POST') {
        return await generateStudyPlanEndpoint(request, env);
      }

      if (path === '/api/concept-explain' && request.method === 'POST') {
        return await explainConceptEndpoint(request, env);
      }

      // Admin routes
      if (path === '/api/admin/verify' && request.method === 'POST') {
        return await verifyAdmin(request, env);
      }

      if (path.match(/^\/api\/admin\/upvote\/\d+$/) && request.method === 'POST') {
        const noteId = path.split('/')[4];
        return await adminUpvoteNote(noteId, request, env);
      }

      if (path.match(/^\/api\/admin\/notes\/\d+\/like$/) && request.method === 'POST') {
        const noteId = path.split('/')[4];
        return await adminLikeNote(noteId, request, env);
      }

      if (path.match(/^\/api\/admin\/notes\/\d+$/) && request.method === 'DELETE') {
        const noteId = path.split('/')[4];
        return await deleteNote(noteId, request, env);
      }

      if (path.match(/^\/api\/admin\/notes\/\d+$/) && request.method === 'PUT') {
        const noteId = path.split('/')[4];
        return await updateNote(noteId, request, env);
      }

      if (path.match(/^\/api\/admin\/suspend\/\d+$/) && request.method === 'POST') {
        const userId = path.split('/')[4];
        return await suspendUser(userId, request, env);
      }

      if (path.match(/^\/api\/admin\/warn\/\d+$/) && request.method === 'POST') {
        const userId = path.split('/')[4];
        return await warnUser(userId, request, env);
      }

      if (path.match(/^\/api\/admin\/unsuspend\/\d+$/) && request.method === 'POST') {
        const userId = path.split('/')[4];
        return await unsuspendUser(userId, request, env);
      }

      if (path.match(/^\/api\/admin\/user\/\d+$/) && request.method === 'DELETE') {
        const userId = path.split('/')[4];
        return await removeUser(userId, request, env);
      }

      if (path === '/api/admin/users' && request.method === 'GET') {
        return await getAllUsers(request, env);
      }

      if (path === '/api/admin/notes' && request.method === 'GET') {
        return await getAllNotes(request, env);
      }

      if (path === '/api/admin/activity-log' && request.method === 'GET') {
        return await getAdminActivityLogs(request, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error: any) {
      console.error('API Error:', error);
      return jsonResponse({ error: error.message || 'Internal server error' }, 500);
    }
  },
};
