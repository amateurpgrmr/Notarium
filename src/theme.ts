// SpaceX-inspired dark theme configuration
export const darkTheme = {
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    bgTertiary: '#151515',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    borderColor: '#1a1a1a',
    accent: '#005288',
    accentHover: '#0066aa',
    success: '#4ade80',
    danger: '#ef4444',
    dangerHover: '#dc2626',
    warning: '#f59e0b',
  },
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
  },
  shadows: {
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
};

export const darkThemeStyles = `
  :root {
    --bg-primary: ${darkTheme.colors.bgPrimary};
    --bg-secondary: ${darkTheme.colors.bgSecondary};
    --bg-tertiary: ${darkTheme.colors.bgTertiary};
    --text-primary: ${darkTheme.colors.textPrimary};
    --text-secondary: ${darkTheme.colors.textSecondary};
    --border-color: ${darkTheme.colors.borderColor};
    --accent: ${darkTheme.colors.accent};
    --accent-hover: ${darkTheme.colors.accentHover};
    --transition: ${darkTheme.transitions.default};
    --shadow: ${darkTheme.shadows.default};
    --danger: ${darkTheme.colors.danger};
  }
`;

export const buttonBaseStyle = {
  padding: '8px 16px',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: darkTheme.transitions.default,
  borderRadius: darkTheme.borderRadius.md,
};

export const buttonPrimaryStyle = {
  ...buttonBaseStyle,
  background: `linear-gradient(135deg, ${darkTheme.colors.accent}, ${darkTheme.colors.accentHover})`,
  boxShadow: darkTheme.shadows.default,
};

export const buttonSecondaryStyle = {
  ...buttonBaseStyle,
  background: 'transparent',
  border: `1px solid ${darkTheme.colors.borderColor}`,
};

export const inputStyle = {
  padding: '12px 16px',
  background: darkTheme.colors.bgSecondary,
  border: `1px solid ${darkTheme.colors.borderColor}`,
  borderRadius: darkTheme.borderRadius.md,
  color: darkTheme.colors.textPrimary,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: darkTheme.transitions.default,
};

export const cardStyle = {
  background: darkTheme.colors.bgSecondary,
  border: `1px solid ${darkTheme.colors.borderColor}`,
  borderRadius: darkTheme.borderRadius.lg,
  padding: '16px',
  transition: darkTheme.transitions.default,
};

export const modalOverlayStyle = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  zIndex: 2000,
  padding: '16px',
};

export const modalContentStyle = {
  background: 'rgba(10, 10, 10, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${darkTheme.colors.borderColor}`,
  borderRadius: darkTheme.borderRadius.xl,
  maxWidth: '400px',
  width: '100%',
  padding: '24px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
};
