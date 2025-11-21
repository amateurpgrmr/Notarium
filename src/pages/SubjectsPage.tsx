import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle } from '../theme';
import { ArrowRight } from 'lucide-react';

export interface Subject {
  id: number;
  name: string;
  icon: string;
  note_count: number;
}

interface SubjectsPageProps {
  onSelectSubject: (subject: Subject) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function SubjectsPage({
  onSelectSubject,
  isLoading,
  setIsLoading
}: SubjectsPageProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setIsLoading(true);
        console.log('Loading subjects...');
        const subjectsData = await api.getSubjects();
        console.log('Subjects data:', subjectsData);

        const normalizedSubjects = Array.isArray(subjectsData)
          ? subjectsData
          : (subjectsData?.subjects || []);

        setSubjects(normalizedSubjects as Subject[]);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, [setIsLoading]);

  return (
    <div>
      {/* Content */}
      <div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: darkTheme.colors.textPrimary
        }}>
          Subjects
        </h2>

        {isLoading ? (
          <LoadingSpinner message="Loading subjects..." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className="group"
                style={{
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'relative',
                  height: '27rem',
                  width: '100%',
                  overflow: 'hidden',
                  borderRadius: '12px'
                }}>
                  {/* Background with icon */}
                  <div style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 300ms',
                  }}
                  className="group-hover:scale-105"
                  >
                    <i
                      className={`fas ${subject.icon}`}
                      style={{
                        fontSize: '120px',
                        color: 'rgba(139, 92, 246, 0.3)',
                        opacity: 0.5
                      }}
                    ></i>
                  </div>

                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    height: '100%',
                    background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.4) 60%, rgba(139, 92, 246, 0.8) 100%)',
                    mixBlendMode: 'multiply'
                  }} />

                  {/* Content at bottom */}
                  <div style={{
                    position: 'absolute',
                    insetInline: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '32px',
                    color: 'white'
                  }}>
                    <div style={{
                      marginBottom: '12px',
                      paddingTop: '16px',
                      fontSize: '24px',
                      fontWeight: '600'
                    }}>
                      {subject.name}
                    </div>
                    <div style={{
                      marginBottom: '48px',
                      fontSize: '14px',
                      opacity: 0.9
                    }}>
                      {subject.note_count} notes available
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}>
                      View notes{' '}
                      <ArrowRight
                        className="ml-2 transition-transform group-hover:translate-x-1"
                        size={20}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
