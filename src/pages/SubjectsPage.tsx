import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle } from '../theme';

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

  // Background images for subjects
  const backgroundImages = [
    '/nature.jpg',
    '/green.png',
    '/pink.png'
  ];

  // Get background image for a subject (consistent based on subject id)
  const getBackgroundImage = (subjectId: number) => {
    return backgroundImages[subjectId % backgroundImages.length];
  };

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
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {subjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              style={{
                ...cardStyle,
                padding: '40px 32px',
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: darkTheme.transitions.default,
                border: `2px solid ${darkTheme.colors.accent}`,
                overflow: 'hidden',
                backgroundImage: `url(${getBackgroundImage(subject.id)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              } as React.CSSProperties}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = darkTheme.colors.accent;
                e.currentTarget.style.boxShadow = darkTheme.shadows.lg;
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = darkTheme.colors.accent;
                e.currentTarget.style.boxShadow = darkTheme.shadows.default;
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {/* Dark overlay for readability */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(10, 15, 13, 0.85) 0%, rgba(10, 15, 13, 0.75) 100%)',
                zIndex: 0
              }}></div>

              {/* Content */}
              <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <i style={{
                  fontSize: '64px',
                  marginBottom: '20px',
                  color: darkTheme.colors.accent,
                  display: 'block',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }} className={`fas ${subject.icon}`}></i>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  {subject.name}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: darkTheme.colors.accent,
                  fontWeight: '500',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  backdropFilter: 'blur(4px)'
                }}>
                  {subject.note_count} notes
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
