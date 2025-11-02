import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle, inputStyle, buttonPrimaryStyle } from '../theme';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
      setShowNewSession(false);
      setNewSessionSubject('');
      setNewSessionTopic('');
    } catch (error) {
      console.error('Failed to create session:', error);
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
      // Add user message locally
      setMessages([...messages, { role: 'user', content: userMessage }]);

      // Get AI response
      const response = await api.chat.getAIResponse(userMessage, selectedSession.subject);
      const aiResponse = response.response || 'I apologize, but I could not generate a response.';

      // Add AI message locally
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);

      // Save to database
      await api.chat.addMessage(selectedSession.id, 'user', userMessage);
      await api.chat.addMessage(selectedSession.id, 'assistant', aiResponse);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.slice(0, -1)); // Remove user message if request failed
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
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {selectedSession.subject} - {selectedSession.topic}
              </h3>
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
    </div>
  );
}
