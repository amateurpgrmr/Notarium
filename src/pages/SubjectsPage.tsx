import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle } from '../theme';
import { GlowingStarsBackgroundCard, GlowingStarsTitle, GlowingStarsDescription } from '../components/ui/glowing-stars';

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
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                style={{ cursor: 'pointer' }}
              >
                <GlowingStarsBackgroundCard className="h-full">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <i
                      className={`fas ${subject.icon}`}
                      style={{
                        fontSize: '48px',
                        color: darkTheme.colors.accent
                      }}
                    ></i>
                    <GlowingStarsTitle>
                      {subject.name}
                    </GlowingStarsTitle>
                    <GlowingStarsDescription>
                      {subject.note_count} notes available
                    </GlowingStarsDescription>
                  </div>
                </GlowingStarsBackgroundCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
