/**
 * Unified Glassmorphism Components
 * Переиспользуемые компоненты в едином стиле
 */

import { Box, BoxProps, Button, ButtonProps, Badge, BadgeProps, Card, CardProps } from "@chakra-ui/react";
import { FC, ReactNode } from "react";

// Glass Card - основная карточка
export interface GlassCardProps extends BoxProps {
  variant?: "default" | "light" | "dark" | "accent";
  elevated?: boolean;
  children: ReactNode;
}

export const GlassCard: FC<GlassCardProps> = ({ 
  variant = "default", 
  elevated = false,
  children, 
  ...props 
}) => {
  const variantStyles = {
    default: {
      bg: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.18)",
    },
    light: {
      bg: "rgba(255, 255, 255, 0.15)",
      borderColor: "rgba(255, 255, 255, 0.25)",
    },
    dark: {
      bg: "rgba(0, 0, 0, 0.2)",
      borderColor: "rgba(255, 255, 255, 0.08)",
    },
    accent: {
      bg: "rgba(102, 126, 234, 0.1)",
      borderColor: "rgba(102, 126, 234, 0.3)",
    },
  };

  return (
    <Box
      {...variantStyles[variant]}
      backdropFilter="blur(20px) saturate(180%)"
      boxShadow={
        elevated
          ? `
            0 12px 48px 0 rgba(31, 38, 135, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1)
          `
          : `
            0 8px 32px 0 rgba(31, 38, 135, 0.37),
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1)
          `
      }
      borderRadius="24px"
      borderWidth="1px"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      {...props}
    >
      {children}
    </Box>
  );
};

// Candy Button - конфетная кнопка с выпуклостью
export interface CandyButtonProps extends ButtonProps {
  candyVariant?: "primary" | "success" | "warning" | "danger" | "secondary";
}

export const CandyButton: FC<CandyButtonProps> = ({ 
  candyVariant = "primary", 
  children, 
  ...props 
}) => {
  const bgColors = {
    primary: "#667eea",
    success: "#4facfe",
    warning: "#fa709a",
    danger: "#ff6b6b",
    secondary: "#f093fb",
  };

  const shadowColors = {
    primary: "rgba(102, 126, 234, 0.4)",
    success: "rgba(79, 172, 254, 0.4)",
    warning: "rgba(250, 112, 154, 0.4)",
    danger: "rgba(255, 107, 107, 0.4)",
    secondary: "rgba(240, 147, 251, 0.4)",
  };

  return (
    <Button
      bg={bgColors[candyVariant]}
      color="white"
      boxShadow={`
        0 4px 15px 0 ${shadowColors[candyVariant]},
        inset 0 -2px 8px rgba(0, 0, 0, 0.2),
        inset 0 2px 8px rgba(255, 255, 255, 0.2)
      `}
      borderRadius="16px"
      border="2px solid rgba(255, 255, 255, 0.2)"
      fontWeight="600"
      h="48px"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: `
          0 6px 20px 0 ${shadowColors[candyVariant]},
          inset 0 -2px 8px rgba(0, 0, 0, 0.2),
          inset 0 2px 8px rgba(255, 255, 255, 0.3)
        `,
      }}
      _active={{
        transform: "translateY(0)",
        boxShadow: `
          0 2px 10px 0 ${shadowColors[candyVariant]},
          inset 0 2px 8px rgba(0, 0, 0, 0.3)
        `,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

// Candy Badge - конфетный badge
export interface CandyBadgeProps extends BadgeProps {
  candyVariant?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
}

export const CandyBadge: FC<CandyBadgeProps> = ({ 
  candyVariant = "primary", 
  children, 
  ...props 
}) => {
  const styles = {
    primary: {
      bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)",
      shadow: "rgba(102, 126, 234, 0.3)",
    },
    success: {
      bg: "linear-gradient(135deg, rgba(79, 172, 254, 0.8) 0%, rgba(0, 242, 254, 0.8) 100%)",
      shadow: "rgba(79, 172, 254, 0.3)",
    },
    warning: {
      bg: "linear-gradient(135deg, rgba(250, 112, 154, 0.8) 0%, rgba(254, 225, 64, 0.8) 100%)",
      shadow: "rgba(250, 112, 154, 0.3)",
    },
    danger: {
      bg: "linear-gradient(135deg, rgba(255, 107, 107, 0.8) 0%, rgba(238, 90, 111, 0.8) 100%)",
      shadow: "rgba(255, 107, 107, 0.3)",
    },
    info: {
      bg: "linear-gradient(135deg, rgba(99, 179, 237, 0.8) 0%, rgba(73, 141, 193, 0.8) 100%)",
      shadow: "rgba(99, 179, 237, 0.3)",
    },
    secondary: {
      bg: "linear-gradient(135deg, rgba(240, 147, 251, 0.8) 0%, rgba(245, 87, 108, 0.8) 100%)",
      shadow: "rgba(240, 147, 251, 0.3)",
    },
  };

  return (
    <Badge
      background={styles[candyVariant].bg}
      color="white"
      boxShadow={`
        0 4px 15px 0 ${styles[candyVariant].shadow},
        inset 0 2px 4px rgba(255, 255, 255, 0.3)
      `}
      borderRadius="12px"
      border="1px solid rgba(255, 255, 255, 0.3)"
      px={3}
      py={1}
      fontWeight="600"
      fontSize="xs"
      textTransform="uppercase"
      {...props}
    >
      {children}
    </Badge>
  );
};

// Glass Input Container
export const GlassInputContainer: FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(10px)"
      boxShadow={`
        inset 0 2px 8px rgba(0, 0, 0, 0.2),
        0 2px 8px rgba(102, 126, 234, 0.1)
      `}
      borderRadius="14px"
      border="1px solid rgba(255, 255, 255, 0.1)"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _focusWithin={{
        border: "1px solid rgba(102, 126, 234, 0.5)",
        boxShadow: `
          inset 0 2px 8px rgba(0, 0, 0, 0.2),
          0 0 20px rgba(102, 126, 234, 0.3)
        `,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Stat Card - карточка со статистикой
export interface GlassStatCardProps extends BoxProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export const GlassStatCard: FC<GlassStatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
  ...props
}) => {
  const trendColors = {
    up: "#4facfe",
    down: "#ff6b6b",
    neutral: "#9ca3af",
  };

  return (
    <GlassCard p={6} {...props}>
      <Box>
        {icon && <Box mb={3}>{icon}</Box>}
        <Box fontSize="sm" color="whiteAlpha.700" mb={2} fontWeight="medium">
          {label}
        </Box>
        <Box fontSize="3xl" fontWeight="bold" color="white" mb={2}>
          {value}
        </Box>
        {trend && trendValue && (
          <Box fontSize="sm" color={trendColors[trend]} fontWeight="medium">
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </Box>
        )}
      </Box>
    </GlassCard>
  );
};

// Section Header - заголовок секции
export interface SectionHeaderProps extends BoxProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  ...props
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={6}
      {...props}
    >
      <Box>
        <Box
          fontSize="2xl"
          fontWeight="bold"
          color="white"
          textShadow="0 2px 10px rgba(0, 0, 0, 0.3)"
          mb={subtitle ? 1 : 0}
        >
          {title}
        </Box>
        {subtitle && (
          <Box fontSize="sm" color="whiteAlpha.600">
            {subtitle}
          </Box>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
};
