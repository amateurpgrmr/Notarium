// Theme type definition
export interface Theme {
  name: string;
  displayName: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    borderColor: string;
    accent: string;
    accentHover: string;
    success: string;
    danger: string;
    dangerHover: string;
    warning: string;
  };
  transitions: {
    default: string;
    fast: string;
    slow: string;
  };
  shadows: {
    default: string;
    lg: string;
    md: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  background?: {
    image?: string;
    gradient?: string;
    overlay?: string;
  };
}

// SpaceX-inspired dark theme (default)
const spaceXTheme: Theme = {
  name: 'default',
  displayName: 'SpaceX Dark',
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

// Nature/Green theme
const natureTheme: Theme = {
  name: 'nature',
  displayName: 'Nature',
  colors: {
    bgPrimary: '#0a1810',
    bgSecondary: '#0f2318',
    bgTertiary: '#1a3525',
    textPrimary: '#e8f5e9',
    textSecondary: '#a5d6a7',
    borderColor: '#2d5a3d',
    accent: '#4caf50',
    accentHover: '#66bb6a',
    success: '#81c784',
    danger: '#ef5350',
    dangerHover: '#e53935',
    warning: '#ffb74d',
  },
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
  },
  shadows: {
    default: '0 4px 6px -1px rgba(0, 50, 0, 0.4)',
    lg: '0 20px 25px -5px rgba(0, 50, 0, 0.6)',
    md: '0 10px 15px -3px rgba(0, 50, 0, 0.3)',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  background: {
    image: '/nature.jpg',
    overlay: 'rgba(10, 24, 16, 0.85)',
  },
};

// Pink theme
const pinkTheme: Theme = {
  name: 'pink',
  displayName: 'Pink Dreams',
  colors: {
    bgPrimary: '#1a0a14',
    bgSecondary: '#2a1228',
    bgTertiary: '#3d1a38',
    textPrimary: '#fce4ec',
    textSecondary: '#f48fb1',
    borderColor: '#6d2e5c',
    accent: '#e91e63',
    accentHover: '#f06292',
    success: '#81c784',
    danger: '#ef5350',
    dangerHover: '#e53935',
    warning: '#ffb74d',
  },
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s ease',
    slow: 'all 0.5s ease',
  },
  shadows: {
    default: '0 4px 6px -1px rgba(233, 30, 99, 0.3)',
    lg: '0 20px 25px -5px rgba(233, 30, 99, 0.5)',
    md: '0 10px 15px -3px rgba(233, 30, 99, 0.2)',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  background: {
    gradient: 'linear-gradient(135deg, #1a0a14 0%, #2a1228 50%, #3d1a38 100%)',
  },
};

// Export all themes
export const themes: Record<string, Theme> = {
  default: spaceXTheme,
  nature: natureTheme,
  pink: pinkTheme,
};

// Get current theme from localStorage or default
export const getCurrentTheme = (): Theme => {
  const savedTheme = localStorage.getItem('notarium_theme');
  return themes[savedTheme || 'default'] || themes.default;
};

// Export default theme for backward compatibility
export const darkTheme = getCurrentTheme();

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
