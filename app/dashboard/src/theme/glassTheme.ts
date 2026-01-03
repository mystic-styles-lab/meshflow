/**
 * Unified Glassmorphism Theme
 * Конфетный стиль с выпуклыми элементами и стеклянными эффектами
 */

export const glassTheme = {
  // Основные цвета
  colors: {
    primary: {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      solid: "#667eea",
      light: "#7c8ff5",
      dark: "#5568d3",
    },
    secondary: {
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      solid: "#f093fb",
    },
    success: {
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      solid: "#4facfe",
    },
    warning: {
      gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      solid: "#fa709a",
    },
    danger: {
      gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)",
      solid: "#ff6b6b",
    },
    background: {
      dark: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      light: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  },

  // Glassmorphism эффекты
  glass: {
    // Основной стеклянный эффект
    default: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    },
    // Светлый стеклянный эффект
    light: {
      background: "rgba(255, 255, 255, 0.15)",
      backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    },
    // Темный стеклянный эффект
    dark: {
      background: "rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
    },
    // Акцентный стеклянный эффект
    accent: {
      background: "rgba(102, 126, 234, 0.1)",
      backdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(102, 126, 234, 0.3)",
      boxShadow: "0 8px 32px 0 rgba(102, 126, 234, 0.37)",
    },
  },

  // Candy/Lollipop эффекты (выпуклые элементы)
  candy: {
    // Основная кнопка
    button: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      boxShadow: `
        0 4px 15px 0 rgba(102, 126, 234, 0.4),
        inset 0 -2px 8px rgba(0, 0, 0, 0.2),
        inset 0 2px 8px rgba(255, 255, 255, 0.2)
      `,
      borderRadius: "16px",
      border: "2px solid rgba(255, 255, 255, 0.2)",
    },
    // Карточка
    card: {
      background: "rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(20px) saturate(180%)",
      boxShadow: `
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        inset 0 2px 4px rgba(255, 255, 255, 0.1),
        inset 0 -2px 4px rgba(0, 0, 0, 0.1)
      `,
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.18)",
    },
    // Badge/Tag
    badge: {
      background: "linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)",
      boxShadow: `
        0 4px 15px 0 rgba(102, 126, 234, 0.3),
        inset 0 2px 4px rgba(255, 255, 255, 0.3)
      `,
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    },
    // Input
    input: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      boxShadow: `
        inset 0 2px 8px rgba(0, 0, 0, 0.2),
        0 2px 8px rgba(102, 126, 234, 0.1)
      `,
      borderRadius: "14px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    },
  },

  // Анимации
  animations: {
    glow: {
      keyframes: `
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
        }
      `,
      animation: "glow-pulse 2s ease-in-out infinite",
    },
    float: {
      keyframes: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `,
      animation: "float 3s ease-in-out infinite",
    },
    shimmer: {
      keyframes: `
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `,
      animation: "shimmer 2s linear infinite",
    },
  },

  // Типографика
  typography: {
    heading: {
      fontWeight: "bold",
      textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
    },
    body: {
      fontWeight: "normal",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
    },
  },

  // Spacing
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },

  // Border radius
  borderRadius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    full: "9999px",
  },
};

// CSS для инъекции глобальных стилей
export const globalGlassStyles = `
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
    50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.6); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 
      0 8px 32px 0 rgba(31, 38, 135, 0.37),
      inset 0 2px 4px rgba(255, 255, 255, 0.1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 12px 48px 0 rgba(31, 38, 135, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.15),
      inset 0 -2px 4px rgba(0, 0, 0, 0.1);
  }

  .candy-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 
      0 4px 15px 0 rgba(102, 126, 234, 0.4),
      inset 0 -2px 8px rgba(0, 0, 0, 0.2),
      inset 0 2px 8px rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .candy-button:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 20px 0 rgba(102, 126, 234, 0.6),
      inset 0 -2px 8px rgba(0, 0, 0, 0.2),
      inset 0 2px 8px rgba(255, 255, 255, 0.3);
  }

  .candy-button:active {
    transform: translateY(0);
    box-shadow: 
      0 2px 10px 0 rgba(102, 126, 234, 0.4),
      inset 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;
