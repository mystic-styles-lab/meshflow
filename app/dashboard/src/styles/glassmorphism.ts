// Glassmorphism Dark Theme
export const glassmorphismTheme = {
  // Основные цвета
  colors: {
    background: {
      primary: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      secondary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.08)',
    },
    accent: {
      primary: '#667eea',
      secondary: '#764ba2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.5)',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    }
  },

  // Glass эффекты
  glass: {
    // Основной glass контейнер
    container: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    },
    // Выпуклая карточка
    card: {
      background: 'rgba(255, 255, 255, 0.07)',
      backdropFilter: 'blur(15px) saturate(180%)',
      WebkitBackdropFilter: 'blur(15px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: `
        0 8px 32px 0 rgba(0, 0, 0, 0.37),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.2)
      `,
    },
    // Интерактивные элементы
    interactive: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(10px) saturate(180%)',
      WebkitBackdropFilter: 'blur(10px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.3)',
      _hover: {
        background: 'rgba(255, 255, 255, 0.12)',
        boxShadow: '0 6px 24px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },

  // Анимации
  animations: {
    glowPulse: `
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5); }
        50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.8); }
      }
    `,
    float: `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `,
  },
};

// CSS стили для глобальной темы
export const globalGlassStyles = `
  body {
    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    background-attachment: fixed;
    color: #ffffff;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// Helper функции для применения стилей
export const applyGlassStyle = (type: 'container' | 'card' | 'interactive' = 'card') => {
  return glassmorphismTheme.glass[type];
};

export const applyConvexEffect = () => ({
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 100%)',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
});
