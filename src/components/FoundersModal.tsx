import { darkTheme } from '../theme';

interface Founder {
  name: string;
  role: string;
  photo: string;
}

interface FoundersModalProps {
  onClose: () => void;
}

export default function FoundersModal({ onClose }: FoundersModalProps) {
  const founders: Founder[] = [
    { name: 'Founder 1', role: 'Co-Founder & CEO', photo: '/per.1.jpg' },
    { name: 'Founder 2', role: 'Co-Founder & CTO', photo: '/per.2.jpg' },
    { name: 'Founder 3', role: 'Co-Founder & COO', photo: '/per.3.jpg' },
    { name: 'Founder 4', role: 'Co-Founder & CMO', photo: '/per.4.jpg' },
    { name: 'Founder 5', role: 'Co-Founder & CFO', photo: '/per.5.jpg' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: darkTheme.colors.bgSecondary,
          borderRadius: darkTheme.borderRadius.lg,
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 9999,
          border: `1px solid ${darkTheme.colors.borderColor}`,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: darkTheme.colors.textPrimary
          }}>
            Meet Our Founders
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: darkTheme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              padding: '4px 8px',
              transition: darkTheme.transitions.default,
              borderRadius: darkTheme.borderRadius.sm
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = darkTheme.colors.textPrimary;
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = darkTheme.colors.textSecondary;
              e.currentTarget.style.background = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Founders Grid */}
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {founders.map((founder, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: darkTheme.colors.bgTertiary,
                borderRadius: darkTheme.borderRadius.md,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                transition: darkTheme.transitions.default
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = darkTheme.colors.accent;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
              }}
            >
              {/* Founder Photo */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `url('${founder.photo}') center/cover, linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                  border: `2px solid ${darkTheme.colors.accent}`,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '20px'
                }}
              >
                {/* Fallback to first letter if image doesn't load */}
                <span style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {founder.name.charAt(0)}
                </span>
              </div>

              {/* Founder Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: darkTheme.colors.textPrimary
                }}>
                  {founder.name}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '13px',
                  color: darkTheme.colors.textSecondary
                }}>
                  {founder.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p style={{
          marginTop: '24px',
          marginBottom: 0,
          fontSize: '12px',
          color: darkTheme.colors.textSecondary,
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Building the future of collaborative learning
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
