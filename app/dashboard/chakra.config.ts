import { extendTheme } from "@chakra-ui/react";
export const theme = extendTheme({
  shadows: { outline: "0 0 0 2px var(--chakra-colors-primary-200)" },
  fonts: {
    body: `Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif`,
  },
  colors: {
    "light-border": "#d2d2d4",
    primary: {
      50: "#9cb7f2",
      100: "#88a9ef",
      200: "#749aec",
      300: "#618ce9",
      400: "#4d7de7",
      500: "#396fe4",
      600: "#3364cd",
      700: "#2e59b6",
      800: "#284ea0",
      900: "#224389",
    },
    gray: {
      750: "#222C3B",
    },
  },
  components: {
    Tooltip: {
      baseStyle: {
        bg: "rgba(30, 35, 50, 0.95)",
        color: "white",
        borderRadius: "12px",
        px: 3,
        py: 2,
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
        _light: {
          bg: "rgba(255, 255, 255, 0.95)",
          color: "gray.800",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "rgba(30, 35, 50, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          py: 2,
          _light: {
            bg: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          },
        },
        item: {
          bg: "transparent",
          color: "white",
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
          },
          _light: {
            color: "gray.800",
            _hover: {
              bg: "rgba(0, 0, 0, 0.05)",
            },
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "rgba(30, 35, 50, 0.95)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "30px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          _light: {
            bg: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
          },
        },
        overlay: {
          bg: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        },
        header: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          _light: {
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
          },
        },
        footer: {
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          _light: {
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
          },
        },
        closeButton: {
          bg: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "full",
          color: "white",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
          },
          _light: {
            bg: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            color: "gray.600",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
            _hover: {
              bg: "rgba(255, 255, 255, 0.9)",
            },
          },
        },
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: "20px",
          fontSize: "sm",
          bg: "rgba(30, 35, 50, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          _light: {
            bg: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
    Switch: {
      baseStyle: {
        track: {
          bg: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          _light: {
            bg: "rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          },
          _checked: {
            bg: "primary.500",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 0 10px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          },
        },
        thumb: {
          bg: "white",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          bg: "rgba(255, 255, 255, 0.06)",
          border: "none",
          borderRadius: "16px",
          color: "white",
          backdropFilter: "blur(12px)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15)",
          _light: {
            bg: "rgba(255, 255, 255, 0.7)",
            border: "none",
            color: "gray.800",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.08)",
          },
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
            _light: {
              bg: "rgba(255, 255, 255, 0.8)",
            },
          },
          _focus: {
            bg: "rgba(255, 255, 255, 0.1)",
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(102, 126, 234, 0.25)",
            _light: {
              bg: "rgba(255, 255, 255, 0.85)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 16px rgba(102, 126, 234, 0.2)",
            },
          },
        },
        icon: {
          color: "gray.400",
          _light: {
            color: "gray.500",
          },
        },
      },
    },
    FormHelperText: {
      baseStyle: {
        fontSize: "xs",
      },
    },
    Textarea: {
      baseStyle: {
        bg: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        color: "white",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        _light: {
          bg: "rgba(255, 255, 255, 0.7)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          color: "gray.800",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        },
        _hover: {
          bg: "rgba(255, 255, 255, 0.08)",
          _light: {
            bg: "rgba(255, 255, 255, 0.8)",
          },
        },
        _placeholder: {
          color: "gray.400",
          _light: { color: "gray.500" },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: "sm",
        fontWeight: "medium",
        mb: "1",
        color: "gray.300",
        _dark: { color: "gray.300" },
        _light: { color: "gray.600" },
      },
    },
    Input: {
      baseStyle: {
        addon: {
          _dark: {
            borderColor: "gray.600",
            _placeholder: {
              color: "gray.500",
            },
          },
        },
        field: {
          _focusVisible: {
            boxShadow: "none",
            borderColor: "primary.200",
            outlineColor: "primary.200",
          },
          _dark: {
            borderColor: "gray.600",
            _disabled: {
              color: "gray.400",
              borderColor: "gray.500",
            },
            _placeholder: {
              color: "gray.500",
            },
          },
        },
      },
    },
    Table: {
      baseStyle: {
        table: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
        thead: {
          borderBottomColor: "rgba(255, 255, 255, 0.1)",
          _light: {
            borderBottomColor: "rgba(0, 0, 0, 0.1)",
          },
        },
        th: {
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          color: "rgba(255, 255, 255, 0.8)",
          _light: {
            background: "transparent",
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            color: "gray.700",
          },
          _dark: {
            borderColor: "rgba(255, 255, 255, 0.1)",
            background: "transparent",
          },
        },
        td: {
          transition: "all .1s ease-out",
          border: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          _light: {
            borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          },
          _dark: {
            borderColor: "rgba(255, 255, 255, 0.05)",
          },
        },
        tr: {
          "&.interactive": {
            cursor: "pointer",
            _hover: {
              "& > td": {
                bg: "rgba(255, 255, 255, 0.05)",
              },
              _light: {
                "& > td": {
                  bg: "rgba(0, 0, 0, 0.03)",
                },
              },
            },
          },
          _last: {
            "& > td": {
              borderBottom: "none",
            },
          },
        },
      },
    },
  },
});
