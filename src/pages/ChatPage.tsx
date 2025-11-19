import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme } from '../theme';
import ReactMarkdown from 'react-markdown';
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
  const [initialInputValue, setInitialInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [newSessionTopic, setNewSessionTopic] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
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
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setSending(false);
    }
  };

  const handleInitialSubmit = async () => {
    if (!initialInputValue.trim()) return;

    const userMessage = initialInputValue;
    setInitialInputValue('');
    setSending(true);

    try {
      // Auto-create a new chat session
      const data = await api.chat.createSession('General', 'AI Chat');
      const newSession = data.session;
      setSessions([newSession, ...sessions]);
      setSelectedSession(newSession);

      // Add user message
      setMessages([{ role: 'user', content: userMessage }]);

      // Get AI response
      const response = await api.request(`/api/chat/sessions/${newSession.id}/ai-response`, {
        method: 'POST',
        body: { message: userMessage, subject: newSession.subject }
      });

      const aiResponseContent = response.response || 'I apologize, but I could not generate a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponseContent }]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setMessages([{
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from AI tutor. Please try again.'}`
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedSession) return;

    const userMessage = inputValue;
    setInputValue('');
    setSending(true);

    try {
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

      const response = await api.request(`/api/chat/sessions/${selectedSession.id}/ai-response`, {
        method: 'POST',
        body: { message: userMessage, subject: selectedSession.subject }
      });

      const aiResponseContent = response.response || 'I apologize, but I could not generate a response.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponseContent }]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'user') {
          newMessages.pop();
        }
        return newMessages;
      });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response from AI tutor. Please try again.'}`
      }]);
    } finally {
      setSending(false);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.8) 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Left Floating Sidebar */}
      <div style={{
        position: 'fixed',
        top: isMobile ? '64px' : '76px',
        left: sidebarOpen ? '20px' : '-280px',
        width: '260px',
        height: `calc(100vh - ${isMobile ? '84px' : '96px'})`,
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(30px)',
        borderRadius: '20px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px'
      } as React.CSSProperties}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Chat History
          </h2>
          <button
            onClick={() => setShowNewSession(true)}
            style={{
              padding: '8px 12px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              transition: darkTheme.transitions.default,
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
          >
            <i className="fas fa-plus"></i> New
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: darkTheme.colors.textSecondary }}>
              <LoadingSpinner />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session)}
                style={{
                  padding: '12px 16px',
                  background: selectedSession?.id === session.id
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedSession?.id === session.id
                    ? '1px solid #8b5cf6'
                    : '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedSession?.id === session.id ? '600' : '500',
                  transition: darkTheme.transitions.default,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{session.subject}</div>
                <div style={{ fontSize: '12px', opacity: '0.7' }}>{session.topic}</div>
              </button>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: darkTheme.colors.textSecondary,
              fontSize: '14px'
            }}>
              No chats yet. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: isMobile ? '80px' : '92px',
          left: sidebarOpen ? '300px' : '20px',
          width: '40px',
          height: '40px',
          background: 'rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          color: darkTheme.colors.textPrimary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          transition: 'left 0.3s ease',
          fontSize: '16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
        }}
      >
        <i className={`fas fa-${sidebarOpen ? 'chevron-left' : 'bars'}`}></i>
      </button>

      {/* New Session Modal */}
      {showNewSession && (
        <>
          <div
            onClick={() => setShowNewSession(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '90%' : '500px',
            maxWidth: '90vw',
            padding: '32px',
            background: 'rgba(10, 10, 15, 0.95)',
            backdropFilter: 'blur(40px)',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
            zIndex: 201
          }}>
            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              New Chat Session
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '13px',
                color: '#a78bfa',
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>Subject</label>
              <input
                type="text"
                placeholder="e.g., Biology"
                value={newSessionSubject}
                onChange={(e) => setNewSessionSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(30, 30, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  fontSize: '15px',
                  outline: 'none'
                } as React.CSSProperties}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                fontSize: '13px',
                color: '#a78bfa',
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>Topic</label>
              <input
                type="text"
                placeholder="e.g., Cell Division"
                value={newSessionTopic}
                onChange={(e) => setNewSessionTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(30, 30, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  fontSize: '15px',
                  outline: 'none'
                } as React.CSSProperties}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCreateSession}
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  opacity: sending ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
                } as React.CSSProperties}
              >
                {sending ? 'Creating...' : 'Create Chat'}
              </button>
              <button
                onClick={() => {
                  setShowNewSession(false);
                  setNewSessionSubject('');
                  setNewSessionTopic('');
                }}
                style={{
                  padding: '14px 24px',
                  background: 'rgba(30, 30, 35, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px'
                } as React.CSSProperties}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div style={{
        position: 'relative',
        marginLeft: sidebarOpen ? (isMobile ? '0px' : '340px') : '80px',
        marginRight: '20px',
        marginTop: isMobile ? '64px' : '76px',
        marginBottom: '20px',
        height: `calc(100vh - ${isMobile ? '84px' : '96px'})`,
        transition: 'margin-left 0.3s ease',
        zIndex: 10
      }}>
        {!selectedSession ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '32px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.5)',
              animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}>
              🤖
            </div>

            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
              <h1 style={{
                fontSize: isMobile ? '28px' : '42px',
                fontWeight: '800',
                margin: '0 0 16px 0',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Ask AI Anything
              </h1>
              <p style={{
                fontSize: isMobile ? '16px' : '18px',
                color: darkTheme.colors.textSecondary,
                lineHeight: '1.7',
                margin: '0 0 32px 0'
              }}>
                Select a chat from the sidebar or create a new one to start learning with your AI tutor.
              </p>
            </div>

            <div style={{
              width: '100%',
              maxWidth: '600px',
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder="Ask AI anything..."
                value={initialInputValue}
                onChange={(e) => setInitialInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInitialSubmit();
                  }
                }}
                disabled={sending}
                style={{
                  width: '100%',
                  padding: '18px 60px 18px 24px',
                  background: 'rgba(10, 10, 15, 0.9)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '16px',
                  color: darkTheme.colors.textPrimary,
                  fontSize: '16px',
                  outline: 'none',
                  cursor: sending ? 'not-allowed' : 'text',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease'
                } as React.CSSProperties}
              />
              <button
                onClick={handleInitialSubmit}
                disabled={sending || !initialInputValue.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  background: (sending || !initialInputValue.trim())
                    ? 'rgba(139, 92, 246, 0.3)'
                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: (sending || !initialInputValue.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: (sending || !initialInputValue.trim())
                    ? 'none'
                    : '0 4px 12px rgba(139, 92, 246, 0.4)',
                  transition: 'transform 0.2s ease',
                  opacity: (sending || !initialInputValue.trim()) ? 0.5 : 1
                }}
              >
                <i className={`fas fa-${sending ? 'circle-notch fa-spin' : 'arrow-right'}`}></i>
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10, 10, 15, 0.7)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden'
          } as React.CSSProperties}>
            {/* Chat Header */}
            <div style={{
              padding: isMobile ? '16px 20px' : '20px 28px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
                }}>
                  🤖
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: isMobile ? '16px' : '18px',
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
                    fontSize: '13px',
                    color: darkTheme.colors.textSecondary,
                    fontWeight: '500'
                  }}>
                    {selectedSession.topic}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '20px' : '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.length === 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
                    animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    🤖
                  </div>
                  <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#e4e4e7',
                      margin: '0 0 12px 0',
                      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      How Can I Help?
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: darkTheme.colors.textSecondary,
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      Ask me anything about {selectedSession.subject}!
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
                    gap: '12px',
                    animation: 'fadeIn 0.4s ease-out'
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '20px',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                    }}>
                      🤖
                    </div>
                  )}
                  <div style={{
                    maxWidth: isMobile ? '85%' : '75%',
                    padding: '14px 18px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                      : 'rgba(30, 30, 35, 0.7)',
                    color: msg.role === 'user' ? '#fff' : darkTheme.colors.textPrimary,
                    fontSize: '15px',
                    lineHeight: '1.7',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(139, 92, 246, 0.15)'
                  }}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      fontSize: '20px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
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
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'rgba(30, 30, 35, 0.7)',
                    color: '#e4e4e7',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                      borderTopColor: '#8b5cf6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              padding: isMobile ? '16px' : '20px 24px',
              borderTop: '1px solid rgba(139, 92, 246, 0.15)',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask AI anything..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    background: 'rgba(30, 30, 35, 0.7)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '14px',
                    color: darkTheme.colors.textPrimary,
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    minHeight: '52px',
                    maxHeight: '120px',
                    fontFamily: 'inherit'
                  } as React.CSSProperties}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !inputValue.trim()}
                  style={{
                    padding: '14px 20px',
                    background: (sending || !inputValue.trim())
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    border: 'none',
                    borderRadius: '14px',
                    color: 'white',
                    cursor: (sending || !inputValue.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    minWidth: '80px',
                    boxShadow: (sending || !inputValue.trim())
                      ? 'none'
                      : '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
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
    </div>
  );
}
