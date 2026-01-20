import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { darkTheme, modalOverlayStyle, modalContentStyle, buttonPrimaryStyle, buttonSecondaryStyle } from '../../theme';

interface QuizModalProps {
  noteId: number;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
}

export default function QuizModal({ noteId, onClose }: QuizModalProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadQuiz();
  }, [noteId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await api.ai.generateQuiz(noteId);
      const quizData = data.quiz || { questions: [] };
      setQuiz(quizData);
      setAnswers(new Array(quizData.questions?.length || 0).fill(null));
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!quiz?.questions) return;

    let correctCount = 0;
    quiz.questions.forEach((q: Question, idx: number) => {
      if (answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(Math.round((correctCount / quiz.questions.length) * 100));
    setShowResults(true);
  };

  if (loading) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle as React.CSSProperties}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-color)',
              borderTop: `3px solid ${darkTheme.colors.accent}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p>Generating quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz?.questions || quiz.questions.length === 0) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle as React.CSSProperties}>
          <p style={{ margin: 0, textAlign: 'center' }}>Failed to generate quiz. Please try again.</p>
          <button
            onClick={onClose}
            style={{
              ...buttonSecondaryStyle,
              width: '100%',
              marginTop: '16px'
            } as React.CSSProperties}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle as React.CSSProperties}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, marginBottom: '16px' }}>
            Quiz Results
          </h2>
          <div style={{
            textAlign: 'center',
            padding: '32px 16px',
            background: darkTheme.colors.bgSecondary,
            borderRadius: darkTheme.borderRadius.lg,
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: score >= 70 ? '#86efac' : '#fca5a5',
              marginBottom: '8px'
            }}>
              {score}%
            </div>
            <p style={{
              margin: 0,
              color: darkTheme.colors.textSecondary,
              marginBottom: '16px'
            }}>
              You got {answers.filter((a, idx) => a === quiz.questions[idx]?.correctAnswer).length} out of {quiz.questions.length} questions correct
            </p>
            {score >= 70 ? (
              <p style={{ margin: 0, color: '#86efac' }}>Great job! You passed the quiz! 🎉</p>
            ) : (
              <p style={{ margin: 0, color: '#fca5a5' }}>Keep practicing to improve your score!</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadQuiz}
              style={{
                ...buttonSecondaryStyle,
                flex: 1
              } as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Retake Quiz
            </button>
            <button
              onClick={onClose}
              style={{
                ...buttonPrimaryStyle,
                flex: 1
              } as React.CSSProperties}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContentStyle,
        maxWidth: '500px'
      } as React.CSSProperties}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            Quiz ({currentQuestion + 1}/{quiz.questions.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkTheme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              transition: darkTheme.transitions.default,
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = darkTheme.colors.textSecondary}
          >
            ✕
          </button>
        </div>

        <div style={{
          background: darkTheme.colors.bgSecondary,
          padding: '16px',
          borderRadius: darkTheme.borderRadius.lg,
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            marginBottom: '16px'
          }}>
            {question?.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {question?.options?.map((option: string, idx: number) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                style={{
                  padding: '12px 16px',
                  background: answers[currentQuestion] === idx
                    ? darkTheme.colors.accent
                    : darkTheme.colors.bgTertiary,
                  border: `1px solid ${answers[currentQuestion] === idx ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: answers[currentQuestion] === idx ? '#fff' : darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: darkTheme.transitions.default,
                  fontSize: '14px'
                }}
                onMouseOver={(e) => {
                  if (answers[currentQuestion] !== idx) {
                    e.currentTarget.style.background = darkTheme.colors.accent;
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseOut={(e) => {
                  if (answers[currentQuestion] !== idx) {
                    e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                    e.currentTarget.style.color = darkTheme.colors.textPrimary;
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            style={{
              ...buttonSecondaryStyle,
              flex: 1,
              opacity: currentQuestion === 0 ? 0.5 : 1
            } as React.CSSProperties}
            onMouseOver={(e) => currentQuestion > 0 && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Previous
          </button>
          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              style={{
                ...buttonPrimaryStyle,
                flex: 1
              } as React.CSSProperties}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{
                ...buttonPrimaryStyle,
                flex: 1
              } as React.CSSProperties}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
