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
                  background: 'rgba(20, 25, 23, 0.6)',
                  backdropFilter: 'blur(10px)'
                } as React.CSSProperties}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 25, 23, 0.8)';
                  e.currentTarget.style.borderColor = darkTheme.colors.accent;
                  e.currentTarget.style.boxShadow = darkTheme.shadows.lg;
                  e.currentTarget.style.transform = 'translateY(-6px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(20, 25, 23, 0.6)';
                  e.currentTarget.style.borderColor = darkTheme.colors.accent;
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i style={{
                  fontSize: '64px',
                  marginBottom: '20px',
                  color: darkTheme.colors.accent,
                  display: 'block'
                }} className={`fas ${subject.icon}`}></i>
                <h3 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '12px', color: darkTheme.colors.textPrimary }}>
                  {subject.name}
                </h3>
                <p style={{ fontSize: '14px', color: darkTheme.colors.textSecondary }}>
                  {subject.note_count} notes
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
