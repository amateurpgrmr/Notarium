import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle, inputStyle, buttonPrimaryStyle } from '../theme';
import ReactMarkdown from 'react-markdown';
import { StudyChatInput } from '@/components/ui/study-chat-input';
import { ShaderAnimation } from '@/components/ui/shader-animation';

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

  const handleDocumentUpload = async (file: File) => {
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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      {/* Shader Animation Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0
      }}>
        <ShaderAnimation />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        top: isMobile ? '64px' : '76px',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: isMobile ? '12px' : '16px',
        zIndex: 10,
        height: `calc(100vh - ${isMobile ? '64px' : '76px'})`
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
            padding: '11px 20px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: darkTheme.transitions.default,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          } as React.CSSProperties}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
          }}
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
                  padding: '11px 18px',
                  background: selectedSession?.id === session.id
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))'
                    : 'rgba(30, 30, 35, 0.6)',
                  border: selectedSession?.id === session.id
                    ? `2px solid #8b5cf6`
                    : `1px solid rgba(139, 92, 246, 0.2)`,
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedSession?.id === session.id ? '600' : '500',
                  transition: darkTheme.transitions.default,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  backdropFilter: 'blur(10px)',
                  boxShadow: selectedSession?.id === session.id
                    ? '0 4px 12px rgba(139, 92, 246, 0.25)'
                    : 'none'
                }}
                onMouseOver={(e) => {
                  if (selectedSession?.id !== session.id) {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedSession?.id !== session.id) {
                    e.currentTarget.style.background = 'rgba(30, 30, 35, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  }
                }}
              >
                <span style={{ fontWeight: '600' }}>{session.subject}</span>
                <span style={{ fontSize: '12px', opacity: '0.7', marginLeft: '6px' }}>• {session.topic}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Session Form - Collapsible */}
      {showNewSession && (
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.05))',
          borderRadius: '16px',
          border: `1px solid rgba(139, 92, 246, 0.2)`,
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              fontSize: '12px',
              color: '#a78bfa',
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}>Subject</label>
            <input
              type="text"
              placeholder="e.g., Biology"
              value={newSessionSubject}
              onChange={(e) => setNewSessionSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(30, 30, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                outline: 'none',
                transition: darkTheme.transitions.default,
                backdropFilter: 'blur(10px)'
              } as React.CSSProperties}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{
              fontSize: '12px',
              color: '#a78bfa',
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}>Topic</label>
            <input
              type="text"
              placeholder="e.g., Cell Division"
              value={newSessionTopic}
              onChange={(e) => setNewSessionTopic(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(30, 30, 35, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                outline: 'none',
                transition: darkTheme.transitions.default,
                backdropFilter: 'blur(10px)'
              } as React.CSSProperties}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCreateSession}
              disabled={sending}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: darkTheme.transitions.default,
                opacity: sending ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              } as React.CSSProperties}
              onMouseOver={(e) => !sending && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !sending && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <i className="fas fa-check"></i>Create
            </button>
            <button
              onClick={() => {
                setShowNewSession(false);
                setNewSessionSubject('');
                setNewSessionTopic('');
              }}
              style={{
                padding: '12px 28px',
                background: 'rgba(30, 30, 35, 0.6)',
                border: `1px solid rgba(139, 92, 246, 0.2)`,
                borderRadius: '10px',
                color: darkTheme.colors.textPrimary,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: darkTheme.transitions.default,
                backdropFilter: 'blur(10px)'
              } as React.CSSProperties}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(30, 30, 35, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
              }}
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
              padding: isMobile ? '16px' : '24px 28px',
              borderBottom: `1px solid rgba(139, 92, 246, 0.2)`,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: isMobile ? '48px' : '56px',
                  height: isMobile ? '48px' : '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '24px' : '28px',
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
                  flexShrink: 0
                }}>
                  🤖
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {selectedSession.subject}
                  </h2>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: isMobile ? '13px' : '14px',
                    color: darkTheme.colors.textSecondary,
                    fontWeight: '500'
                  }}>
                    {selectedSession.topic}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={toggleFullscreen}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: `1px solid rgba(139, 92, 246, 0.3)`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: darkTheme.transitions.default,
                    fontSize: '18px',
                    color: darkTheme.colors.textPrimary,
                    width: '42px',
                    height: '42px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.borderColor = darkTheme.colors.accent;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
                </button>
              </div>
            </div>

            {/* Info Section - Uploaded Documents and Key Concepts */}
            {(uploadedDocuments.length > 0 || (noteAnalysis || keyConcepts.length > 0)) && (
              <div style={{
                padding: isMobile ? '14px 16px' : '18px 24px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.05))',
                borderBottom: `1px solid rgba(139, 92, 246, 0.2)`,
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
                backdropFilter: 'blur(10px)'
              }}>
                {/* Uploaded Documents */}
                {uploadedDocuments.length > 0 && (
                  <div>
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#a78bfa',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      📎 Documents ({uploadedDocuments.length})
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {uploadedDocuments.map((doc, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '6px 14px',
                            background: 'rgba(139, 92, 246, 0.12)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '10px',
                            fontSize: '12px',
                            color: '#e4e4e7',
                            fontWeight: '500',
                            backdropFilter: 'blur(10px)'
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
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#a78bfa',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      💡 Key Concepts
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {keyConcepts.slice(0, 6).map((concept, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '7px 14px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {analyzing && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    color: '#a78bfa',
                    fontWeight: '500'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderTopColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
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
                  flexDirection: 'column',
                  gap: '24px'
                }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '52px',
                    boxShadow: '0 12px 40px rgba(139, 92, 246, 0.4)',
                    animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    🤖
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: '450px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#e4e4e7',
                      margin: '0 0 12px 0'
                    }}>
                      Ready to Learn?
                    </h3>
                    <p style={{
                      fontSize: '15px',
                      color: darkTheme.colors.textSecondary,
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      Ask me anything about {selectedSession.subject}. I'm here to help you understand {selectedSession.topic} and more!
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: '14px',
                    animation: 'fadeIn 0.4s ease-out'
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '22px',
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                      alignSelf: 'flex-start',
                      marginTop: '2px'
                    }}>
                      🤖
                    </div>
                  )}
                  <div style={{
                    maxWidth: isMobile ? '85%' : '75%',
                    padding: msg.role === 'user' ? '14px 20px' : '18px 24px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'rgba(30, 30, 35, 0.6)',
                    color: msg.role === 'user' ? '#fff' : darkTheme.colors.textPrimary,
                    wordWrap: 'break-word',
                    lineHeight: '1.7',
                    fontSize: '15px',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 16px rgba(139, 92, 246, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.15)',
                    border: msg.role === 'user' ? 'none' : `1px solid rgba(139, 92, 246, 0.15)`,
                    backdropFilter: msg.role === 'assistant' ? 'blur(10px)' : 'none'
                  }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 14px 0', lineHeight: '1.7', color: '#e4e4e7' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: '14px 0', paddingLeft: '24px', lineHeight: '1.8', color: '#e4e4e7' }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: '14px 0', paddingLeft: '24px', lineHeight: '1.8', color: '#e4e4e7' }}>{children}</ol>,
                          li: ({ children }) => <li style={{ margin: '6px 0', paddingLeft: '4px' }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ fontWeight: '700', color: '#a78bfa', textShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}>{children}</strong>,
                          em: ({ children }) => <em style={{ fontStyle: 'italic', opacity: 0.95 }}>{children}</em>,
                          code: ({ children }) => <code style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: '#c4b5fd'
                          }}>{children}</code>,
                          h1: ({ children }) => <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '18px 0 12px 0', lineHeight: '1.3', color: '#a78bfa' }}>{children}</h1>,
                          h2: ({ children }) => <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '16px 0 10px 0', lineHeight: '1.3', color: '#a78bfa' }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '14px 0 8px 0', lineHeight: '1.4', color: '#a78bfa' }}>{children}</h3>,
                          blockquote: ({ children }) => <blockquote style={{
                            borderLeft: `4px solid #8b5cf6`,
                            paddingLeft: '18px',
                            margin: '14px 0',
                            fontStyle: 'italic',
                            opacity: 0.95,
                            background: 'rgba(139, 92, 246, 0.08)',
                            paddingTop: '10px',
                            paddingBottom: '10px',
                            borderRadius: '0 10px 10px 0',
                            color: '#c4b5fd'
                          }}>{children}</blockquote>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '22px',
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                      alignSelf: 'flex-start',
                      marginTop: '2px',
                      fontWeight: '600'
                    }}>
                      👤
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: '14px',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    fontSize: '22px',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                    alignSelf: 'flex-start',
                    marginTop: '2px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: '18px 24px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(30, 30, 35, 0.6)',
                    color: '#e4e4e7',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    border: `1px solid rgba(139, 92, 246, 0.15)`,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid rgba(139, 92, 246, 0.3)',
                      borderTopColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontWeight: '500' }}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Study Chat Input */}
            <div style={{
              padding: '20px 24px',
              borderTop: `1px solid ${darkTheme.colors.borderColor}`,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <StudyChatInput
                placeholder="Ask your AI tutor a question..."
                disabled={sending}
                onSubmit={async (value, options) => {
                  if (!selectedSession || !value.trim()) return;

                  const userMessage = value;
                  setSending(true);

                  try {
                    // Add user message locally
                    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

                    // Get AI response from Gemini
                    const response = await api.request(`/api/chat/sessions/${selectedSession.id}/ai-response`, {
                      method: 'POST',
                      body: {
                        message: userMessage,
                        subject: selectedSession.subject,
                        think: options?.think,
                        deepSearch: options?.deepSearch
                      }
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
                }}
                onFileUpload={handleDocumentUpload}
              />
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(0.98);
          }
        }
      `}</style>

      {/* Hidden file input for document upload */}
      <input type="file" id="docUpload" style={{ display: 'none' }} />
      </div>
    </div>
  );
}
