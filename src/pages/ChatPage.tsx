import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle, inputStyle, buttonPrimaryStyle } from '../theme';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UploadedDocument {
  fileName: string;
  uploadedAt: string;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [newSessionTopic, setNewSessionTopic] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [noteAnalysis, setNoteAnalysis] = useState<string>('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.chat.getSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await api.chat.getMessages(sessionId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectSession = async (session: any) => {
    setSelectedSession(session);
    await loadMessages(session.id);
  };

  const handleCreateSession = async () => {
    if (!newSessionSubject.trim() || !newSessionTopic.trim()) return;

    try {
      setSending(true);
      const data = await api.chat.createSession(newSessionSubject, newSessionTopic);
      const newSession = data.session;
      setSessions([...sessions, newSession]);
      setSelectedSession(newSession);
      setMessages([]);
      setUploadedDocuments([]);
      setShowNewSession(false);
      setNewSessionSubject('');
      setNewSessionTopic('');

      // Analyze available notes for this subject and topic
      await analyzeNotesForSession(newSessionSubject, newSessionTopic);
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setSending(false);
    }
  };

  const analyzeNotesForSession = async (subject: string, topic: string) => {
    try {
      setAnalyzing(true);
      const result = await api.chat.analyzeNotes(subject, topic);
      setNoteAnalysis(result.analysis || '');
      setKeyConcepts(result.keyConcepts || []);
    } catch (error) {
      console.error('Failed to analyze notes:', error);
      setNoteAnalysis('Unable to analyze notes for this topic.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file || !selectedSession) return;

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string)?.split(',')[1] || '';
        await api.chat.uploadDocument(base64, file.name, selectedSession.id);

        // Add document to list
        setUploadedDocuments([
          ...uploadedDocuments,
          {
            fileName: file.name,
            uploadedAt: new Date().toLocaleTimeString()
          }
        ]);

        // Add system message about document upload
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📄 Document "${file.name}" has been uploaded and analyzed. I can now reference this document in our conversation.`
          }
        ]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload document:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Failed to upload document. Please try again.`
        }
      ]);
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSession) return;

    const userMessage = inputValue;
    setInputValue('');
    setSending(true);

    try {
      // Add user message locally
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

      // Get AI response from Gemini
      const response = await api.request(`/api/chat/sessions/${selectedSession.id}/ai-response`, {
        method: 'POST',
        body: { message: userMessage, subject: selectedSession.subject }
      });

      const aiResponseContent = response.response || 'I apologize, but I could not generate a response.';

      // Add AI message locally
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponseContent }]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Remove user message if request failed
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'user') {
          newMessages.pop();
        }
        return newMessages;
      });
      // Show error message
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from AI tutor. Please try again.'}`
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 150px)' }}>
      {/* Sidebar */}
      <div style={{
        ...cardStyle,
        width: '300px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        maxHeight: '100%'
      } as React.CSSProperties}>
        <button
          onClick={() => setShowNewSession(!showNewSession)}
          style={{
            ...buttonPrimaryStyle,
            width: '100%',
            marginBottom: '16px'
          } as React.CSSProperties}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>New Chat
        </button>

        {showNewSession && (
          <div style={{
            padding: '12px',
            background: darkTheme.colors.bgTertiary,
            borderRadius: darkTheme.borderRadius.md,
            marginBottom: '16px'
          }}>
            <input
              type="text"
              placeholder="Subject"
              value={newSessionSubject}
              onChange={(e) => setNewSessionSubject(e.target.value)}
              style={{
                ...inputStyle,
                marginBottom: '8px',
                width: '100%'
              } as React.CSSProperties}
            />
            <input
              type="text"
              placeholder="Topic"
              value={newSessionTopic}
              onChange={(e) => setNewSessionTopic(e.target.value)}
              style={{
                ...inputStyle,
                marginBottom: '8px',
                width: '100%'
              } as React.CSSProperties}
            />
            <button
              onClick={handleCreateSession}
              disabled={sending}
              style={{
                ...buttonPrimaryStyle,
                width: '100%',
                opacity: sending ? 0.6 : 1
              } as React.CSSProperties}
            >
              Create
            </button>
          </div>
        )}

        {loading ? (
          <LoadingSpinner size="sm" message="Loading..." />
        ) : (
          <div style={{ flex: 1 }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session)}
                style={{
                  padding: '12px',
                  background: selectedSession?.id === session.id
                    ? darkTheme.colors.accent
                    : darkTheme.colors.bgSecondary,
                  borderRadius: darkTheme.borderRadius.md,
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => {
                  if (selectedSession?.id !== session.id) {
                    e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedSession?.id !== session.id) {
                    e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                  }
                }}
              >
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>
                  {session.subject}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '11px',
                  color: selectedSession?.id === session.id
                    ? 'rgba(255, 255, 255, 0.7)'
                    : darkTheme.colors.textSecondary
                }}>
                  {session.topic}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div style={{
        ...cardStyle,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden'
      } as React.CSSProperties}>
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
              background: darkTheme.colors.bgSecondary
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    📚 {selectedSession.subject} - {selectedSession.topic}
                  </h3>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: darkTheme.colors.textSecondary }}>
                    🤖 AI Study Tutor Active
                  </p>
                </div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: darkTheme.colors.accent,
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  transition: darkTheme.transitions.default,
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'white'
                }}>
                  <i className="fas fa-upload"></i>
                  {uploading ? 'Uploading...' : 'Upload Document'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                    onChange={handleDocumentUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Uploaded Documents Section */}
              {uploadedDocuments.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: darkTheme.borderRadius.sm,
                  fontSize: '12px'
                }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '500', color: darkTheme.colors.accent }}>
                    📎 Uploaded Documents ({uploadedDocuments.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {uploadedDocuments.map((doc, idx) => (
                      <div key={idx} style={{ fontSize: '11px', color: darkTheme.colors.textSecondary }}>
                        • {doc.fileName} <span style={{ fontSize: '10px' }}>({doc.uploadedAt})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Analysis Section */}
              {(noteAnalysis || keyConcepts.length > 0) && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: darkTheme.borderRadius.sm,
                  fontSize: '12px',
                  borderLeft: `3px solid ${darkTheme.colors.accent}`
                }}>
                  <p style={{ margin: '0 0 6px 0', fontWeight: '500', color: darkTheme.colors.accent }}>
                    💡 Key Concepts from Available Notes
                  </p>
                  {keyConcepts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      {keyConcepts.slice(0, 5).map((concept, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 8px',
                            background: darkTheme.colors.accent,
                            borderRadius: darkTheme.borderRadius.sm,
                            color: 'white',
                            fontSize: '11px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                  {analyzing && (
                    <p style={{ margin: '4px 0 0 0', color: darkTheme.colors.textSecondary, fontStyle: 'italic' }}>
                      <i className="fas fa-spinner" style={{ animation: 'spin 1s linear infinite', marginRight: '6px' }}></i>
                      Analyzing available notes...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '8px'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: darkTheme.borderRadius.md,
                    background: msg.role === 'user'
                      ? darkTheme.colors.accent
                      : darkTheme.colors.bgSecondary,
                    color: msg.role === 'user' ? '#fff' : darkTheme.colors.textPrimary,
                    wordWrap: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: '8px'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: darkTheme.borderRadius.md,
                    background: darkTheme.colors.bgSecondary,
                    color: darkTheme.colors.textSecondary,
                    fontSize: '12px'
                  }}>
                    <i className="fas fa-circle-notch" style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }}></i>
                    Generating response...
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${darkTheme.colors.borderColor}`,
              background: darkTheme.colors.bgSecondary,
              display: 'flex',
              gap: '12px'
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                disabled={sending}
                style={{
                  ...inputStyle,
                  flex: 1,
                  opacity: sending ? 0.6 : 1
                } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !inputValue.trim()}
                style={{
                  ...buttonPrimaryStyle,
                  padding: '12px 20px',
                  opacity: sending || !inputValue.trim() ? 0.6 : 1
                } as React.CSSProperties}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: darkTheme.colors.textSecondary,
            flexDirection: 'column',
            gap: '12px'
          }}>
            <i className="fas fa-comments" style={{ fontSize: '48px' }}></i>
            <p>Select or create a chat session to get started</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Hidden file input for document upload */}
      <input type="file" id="docUpload" style={{ display: 'none' }} />
    </div>
  );
}
