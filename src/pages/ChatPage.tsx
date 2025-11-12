import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle, inputStyle, buttonPrimaryStyle } from '../theme';
import ReactMarkdown from 'react-markdown';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setSessions([newSession, ...sessions]);
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

  // Detect mobile for responsive sizing
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '64px' : '76px',
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: isMobile ? '12px' : '16px',
      zIndex: 10
    }}>
      {/* Session Tabs - Top */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
        overflowX: 'auto',
        overflowY: 'hidden',
        minHeight: '56px'
      }}>
        {/* New Chat Button */}
        <button
          onClick={() => setShowNewSession(!showNewSession)}
          style={{
            padding: '10px 18px',
            background: darkTheme.colors.accent,
            border: 'none',
            borderRadius: darkTheme.borderRadius.md,
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: darkTheme.transitions.default,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          } as React.CSSProperties}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <i className="fas fa-plus"></i>New Chat
        </button>

        {/* Session Tabs */}
        {!loading && sessions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 0 }}>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                style={{
                  padding: '10px 16px',
                  background: selectedSession?.id === session.id
                    ? 'rgba(139, 92, 246, 0.2)'
                    : darkTheme.colors.bgSecondary,
                  border: selectedSession?.id === session.id
                    ? `2px solid ${darkTheme.colors.accent}`
                    : `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedSession?.id === session.id ? '600' : '500',
                  transition: darkTheme.transitions.default,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
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
                <span style={{ fontWeight: '600' }}>{session.subject}</span>
                <span style={{ fontSize: '12px', opacity: '0.7' }}>• {session.topic}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Session Form - Collapsible */}
      {showNewSession && (
        <div style={{
          padding: '16px',
          background: darkTheme.colors.bgSecondary,
          borderRadius: darkTheme.borderRadius.md,
          border: `1px solid ${darkTheme.colors.borderColor}`,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Subject</label>
            <input
              type="text"
              placeholder="e.g., Biology"
              value={newSessionSubject}
              onChange={(e) => setNewSessionSubject(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%'
              } as React.CSSProperties}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, display: 'block', marginBottom: '6px' }}>Topic</label>
            <input
              type="text"
              placeholder="e.g., Cell Division"
              value={newSessionTopic}
              onChange={(e) => setNewSessionTopic(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%'
              } as React.CSSProperties}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateSession}
              disabled={sending}
              style={{
                ...buttonPrimaryStyle,
                padding: '10px 24px',
                opacity: sending ? 0.6 : 1
              } as React.CSSProperties}
            >
              <i className="fas fa-check" style={{ marginRight: '6px' }}></i>Create
            </button>
            <button
              onClick={() => {
                setShowNewSession(false);
                setNewSessionSubject('');
                setNewSessionTopic('');
              }}
              style={{
                padding: '10px 24px',
                background: darkTheme.colors.bgTertiary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                color: darkTheme.colors.textPrimary,
                cursor: 'pointer',
                fontWeight: '500',
                transition: darkTheme.transitions.default
              } as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.bgTertiary}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat Area - Large and Full Width */}
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
              padding: '20px',
              borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
              background: darkTheme.colors.bgSecondary,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                  📚 {selectedSession.subject}
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: darkTheme.colors.textSecondary }}>
                  Topic: <strong>{selectedSession.topic}</strong>
                </p>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: darkTheme.colors.accent }}>
                  🤖 AI Study Tutor
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={toggleFullscreen}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    background: darkTheme.colors.bgTertiary,
                    border: `1px solid ${darkTheme.colors.borderColor}`,
                    borderRadius: darkTheme.borderRadius.md,
                    cursor: 'pointer',
                    transition: darkTheme.transitions.default,
                    fontSize: '16px',
                    color: darkTheme.colors.textPrimary,
                    width: '40px',
                    height: '40px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = darkTheme.colors.accent;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                    e.currentTarget.style.color = darkTheme.colors.textPrimary;
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
                </button>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: darkTheme.colors.accent,
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  transition: darkTheme.transitions.default,
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  whiteSpace: 'nowrap'
                } as React.CSSProperties}
                onMouseOver={(e) => !uploading && (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => !uploading && (e.currentTarget.style.opacity = '1')}
                >
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
            </div>

            {/* Info Section - Uploaded Documents and Key Concepts */}
            {(uploadedDocuments.length > 0 || (noteAnalysis || keyConcepts.length > 0)) && (
              <div style={{
                padding: '16px 20px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                {/* Uploaded Documents */}
                {uploadedDocuments.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: darkTheme.colors.accent }}>
                      📎 Documents ({uploadedDocuments.length})
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {uploadedDocuments.map((doc, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '4px 10px',
                            background: darkTheme.colors.bgSecondary,
                            borderRadius: darkTheme.borderRadius.sm,
                            fontSize: '12px',
                            color: darkTheme.colors.textSecondary
                          }}
                        >
                          {doc.fileName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Concepts */}
                {keyConcepts.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: darkTheme.colors.accent }}>
                      💡 Key Concepts
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {keyConcepts.slice(0, 6).map((concept, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '6px 12px',
                            background: darkTheme.colors.accent,
                            borderRadius: darkTheme.borderRadius.sm,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analyzing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: darkTheme.colors.textSecondary }}>
                    <i className="fas fa-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                    Analyzing available notes...
                  </div>
                )}
              </div>
            )}

            {/* Messages - Large and Easy to Use */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {messages.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: darkTheme.colors.textSecondary,
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <i className="fas fa-comments" style={{ fontSize: '56px', opacity: '0.5' }}></i>
                  <p style={{ fontSize: '16px', textAlign: 'center' }}>Start your study session by asking the AI tutor a question</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '12px'
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: darkTheme.colors.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '20px',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                      alignSelf: 'flex-start',
                      marginTop: '4px'
                    }}>
                      🤖
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%',
                    padding: msg.role === 'user' ? '16px 20px' : '18px 22px',
                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.role === 'user'
                      ? darkTheme.colors.accent
                      : darkTheme.colors.bgSecondary,
                    color: msg.role === 'user' ? '#fff' : darkTheme.colors.textPrimary,
                    wordWrap: 'break-word',
                    lineHeight: '1.7',
                    fontSize: '15px',
                    boxShadow: msg.role === 'user'
                      ? '0 2px 12px rgba(139, 92, 246, 0.25)'
                      : '0 1px 4px rgba(0, 0, 0, 0.1)',
                    border: msg.role === 'user' ? 'none' : `1px solid ${darkTheme.colors.borderColor}`
                  }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 12px 0', lineHeight: '1.7' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: '12px 0', paddingLeft: '24px', lineHeight: '1.8' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: '12px 0', paddingLeft: '24px', lineHeight: '1.8' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ margin: '6px 0', paddingLeft: '4px' }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ fontWeight: '700', color: darkTheme.colors.accent }}>{children}</strong>,
                          em: ({ children }) => <em style={{ fontStyle: 'italic', opacity: 0.95 }}>{children}</em>,
                          code: ({ children }) => <code style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '13.5px',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                          }}>{children}</code>,
                          h1: ({ children }) => <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '16px 0 10px 0', lineHeight: '1.3' }}>{children}</h1>,
                          h2: ({ children }) => <h2 style={{ fontSize: '19px', fontWeight: '700', margin: '14px 0 8px 0', lineHeight: '1.3' }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: '17px', fontWeight: '600', margin: '12px 0 6px 0', lineHeight: '1.4' }}>{children}</h3>,
                          blockquote: ({ children }) => <blockquote style={{
                            borderLeft: `4px solid ${darkTheme.colors.accent}`,
                            paddingLeft: '16px',
                            margin: '12px 0',
                            fontStyle: 'italic',
                            opacity: 0.9,
                            background: 'rgba(139, 92, 246, 0.05)',
                            paddingTop: '8px',
                            paddingBottom: '8px',
                            borderRadius: '0 8px 8px 0'
                          }}>{children}</blockquote>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: darkTheme.colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    fontSize: '20px',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                    alignSelf: 'flex-start',
                    marginTop: '4px'
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: '20px 20px 20px 4px',
                    background: darkTheme.colors.bgSecondary,
                    color: darkTheme.colors.textSecondary,
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${darkTheme.colors.borderColor}`
                  }}>
                    <i className="fas fa-circle-notch" style={{ animation: 'spin 1s linear infinite' }}></i>
                    Generating response...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Large and Easy */}
            <div style={{
              padding: '20px 24px',
              borderTop: `1px solid ${darkTheme.colors.borderColor}`,
              background: darkTheme.colors.bgSecondary,
              display: 'flex',
              gap: '12px',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your AI tutor a question..."
                disabled={sending}
                style={{
                  ...inputStyle,
                  flex: 1,
                  padding: '16px 20px',
                  fontSize: '15px',
                  opacity: sending ? 0.6 : 1,
                  borderRadius: '16px'
                } as React.CSSProperties}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !inputValue.trim()}
                style={{
                  ...buttonPrimaryStyle,
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  opacity: sending || !inputValue.trim() ? 0.6 : 1,
                  borderRadius: '16px',
                  boxShadow: sending || !inputValue.trim() ? 'none' : '0 2px 12px rgba(139, 92, 246, 0.3)'
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
            gap: '16px'
          }}>
            <i className="fas fa-comments" style={{ fontSize: '64px', opacity: '0.5' }}></i>
            <p style={{ fontSize: '18px', textAlign: 'center' }}>
              Select or create a chat session to get started
            </p>
            <p style={{ fontSize: '14px', color: darkTheme.colors.textSecondary, textAlign: 'center', maxWidth: '400px' }}>
              Click the "New Chat" button above to start a study session with your AI tutor
            </p>
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
