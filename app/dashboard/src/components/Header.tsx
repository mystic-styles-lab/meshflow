import {
  Box,
  chakra,
  HStack,
  VStack,
  IconButton,
  useColorMode,
  Tab,
  Tabs,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Text,
  Show,
  Hide,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
} from "@chakra-ui/react";
import logoSrc from "../assets/logo.svg";
import { GlassCard, CandyButton } from "./common/GlassComponents";
import { glassTheme } from "../theme/glassTheme";
import {
  MoonIcon as MoonOutline,
  SunIcon as SunOutline,
  Bars3Icon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  MoonIcon as MoonSolid,
  SunIcon as SunSolid,
} from "@heroicons/react/24/solid";
import { useDashboard } from "contexts/DashboardContext";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { updateThemeColor } from "utils/themeColor";
import { Language } from "./Language";
import useGetUser from "hooks/useGetUser";

type HeaderProps = {
  actions?: ReactNode;
  activeTab?: number;
  onTabChange?: (index: number) => void;
};
const iconProps = {
  baseStyle: {
    w: 6,
    h: 6,
    _hover: {},
  },
};

// Иконки темы
const DarkIcon = chakra(MoonSolid, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});
const LightIcon = chakra(SunSolid, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});
const BurgerIcon = chakra(Bars3Icon, {
  baseStyle: {
    w: 6,
    h: 6,
  },
});

export const Header: FC<HeaderProps> = ({ actions, activeTab = 0, onTabChange }) => {
  const { t } = useTranslation();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const logoFilter = useColorModeValue("none", "invert(1)");

  // CSS переменные для отступов
  const HEADER_SPACING = {
    horizontal: 0,    // отступ слева и справа от содержимого
    vertical: 0.5,   // внутренний отступ хедера
    tabsLeft: 0,      // дополнительный отступ слева для вкладок
    buttonsRight: 0   // дополнительный отступ справа для кнопок
  };

  const tabBg = useColorModeValue("gray.50", "gray.900");
  const tabSelectedBg = useColorModeValue("white", "gray.700");
  const tabHoverBg = useColorModeValue("gray.100", "gray.800");

  const tabs = [
    "Пользователи",
    "Прокси",
    "Логи",
    "Настройки",
    "Тарифы"
  ];

  const handleTabClick = (index: number) => {
    onTabChange?.(index);
    onClose();
  };

  return (
    <>
    {/* Mobile Version - No Background */}
    <Show breakpoint="(max-width: 930px)">
      <HStack w="full" justifyContent="space-between" alignItems="center" px={HEADER_SPACING.horizontal} py={HEADER_SPACING.vertical}>
        {/* Mobile Burger Menu */}
        <Box
          flex="1"
          display="flex"
          justifyContent="flex-start"
        >
        <Box
          bg="rgba(255, 255, 255, 0.05)"
          backdropFilter="blur(10px)"
          borderRadius="full"
          border="1px solid rgba(255, 255, 255, 0.1)"
          _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          minW="44px"
          minH="44px"
          boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
        >
          <IconButton
            aria-label="Menu"
            icon={<BurgerIcon />}
            onClick={onOpen}
            variant="ghost"
            size="sm"
            color="white"
            _light={{ color: "gray.500" }}
            minW="auto"
            h="auto"
          />
        </Box>
        </Box>

        {/* Mobile Logo - Center */}
        <Box
          flex="1"
          display="flex"
          justifyContent="center"
        >
          <img
            src={logoSrc}
            alt="Logo"
            style={{
              width: "88px",
              height: "44px",
              filter: logoFilter,
            }}
          />
        </Box>

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(4px)" />
          <DrawerContent
            bg="rgba(30, 35, 50, 0.85)"
            backdropFilter="blur(20px) saturate(180%)"
            borderRight="1px solid rgba(255, 255, 255, 0.1)"
            boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
            _light={{
              bg: "rgba(255, 255, 255, 0.85)",
              borderRight: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
            }}
          >
            <DrawerCloseButton
              color="white"
              _light={{ color: "gray.500" }}
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                _light: { bg: "rgba(0, 0, 0, 0.05)" },
              }}
            />
            <DrawerHeader
              color="white"
              borderBottom="1px solid rgba(255, 255, 255, 0.08)"
              _light={{ 
                color: "gray.900",
                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
              }}
            >
              Навигация
            </DrawerHeader>
            <DrawerBody pt={4}>
              <VStack align="stretch" spacing={2}>
                {tabs.map((tab, index) => (
                  <Box
                    key={index}
                    p={3}
                    borderRadius="20px"
                    bg={activeTab === index 
                      ? "rgba(102, 126, 234, 0.5)" 
                      : "rgba(255, 255, 255, 0.03)"
                    }
                    color={activeTab === index ? "white" : "rgba(255, 255, 255, 0.8)"}
                    cursor="pointer"
                    fontWeight={activeTab === index ? "600" : "normal"}
                    onClick={() => handleTabClick(index)}
                    transition="all 0.3s ease"
                    border="1px solid"
                    borderColor={activeTab === index 
                      ? "rgba(102, 126, 234, 0.5)" 
                      : "rgba(255, 255, 255, 0.05)"
                    }
                    _hover={{
                      bg: activeTab === index 
                        ? "rgba(102, 126, 234, 0.6)" 
                        : "rgba(255, 255, 255, 0.08)",
                    }}
                    _light={{
                      bg: activeTab === index 
                        ? "rgba(102, 126, 234, 0.8)" 
                        : "rgba(0, 0, 0, 0.03)",
                      color: activeTab === index ? "white" : "gray.700",
                      borderColor: activeTab === index 
                        ? "rgba(102, 126, 234, 0.8)" 
                        : "rgba(0, 0, 0, 0.05)",
                      _hover: {
                        bg: activeTab === index 
                          ? "rgba(102, 126, 234, 0.9)" 
                          : "rgba(0, 0, 0, 0.06)",
                      },
                    }}
                  >
                    {tab}
                  </Box>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Language and Theme Controls */}
        <Box
          flex="1"
          display="flex"
          justifyContent="flex-end"
        >
        <HStack spacing={3}>
          <Box
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(10px)"
            borderRadius="full"
            border="1px solid rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
            boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
          >
            <Language />
          </Box>

          <Box
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(10px)"
            borderRadius="full"
            border="1px solid rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
            boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
          >
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="switch theme"
              borderRadius="full"
              color="white"
            _light={{ color: "gray.500" }}
              onClick={() => {
                updateThemeColor(colorMode == "dark" ? "light" : "dark");
                toggleColorMode();
              }}
            >
              {colorMode === "light" ? <DarkIcon /> : <LightIcon />}
            </IconButton>
          </Box>
        </HStack>
        </Box>
      </HStack>
    </Show>

    {/* Desktop Version - No Background, Glass Tab Buttons */}
    <Hide breakpoint="(max-width: 930px)">
      <HStack w="full" justifyContent="space-between" alignItems="center" px={HEADER_SPACING.horizontal} py={HEADER_SPACING.vertical}>
        <HStack spacing={4} alignItems="center">
          {/* Desktop Logo */}
          <img
            src={logoSrc}
            alt="Logo"
            style={{
              width: "70px",
              height: "35px",
              marginRight: "8px",
              filter: logoFilter,
            }}
          />
          {tabs.map((tab, index) => (
            <Box
              key={index}
              as="button"
              onClick={() => onTabChange?.(index)}
              bg={activeTab === index 
                ? "rgba(102, 126, 234, 0.5)" 
                : "rgba(255, 255, 255, 0.05)"
              }
              backdropFilter="blur(10px)"
              borderRadius="30px"
              border="1px solid"
              borderColor={activeTab === index 
                ? "rgba(102, 126, 234, 0.5)" 
                : "rgba(255, 255, 255, 0.1)"
              }
              px="4"
              py="2"
              fontSize="sm"
              fontWeight="600"
              color={activeTab === index ? "white" : "rgba(255, 255, 255, 0.7)"}
              transition="all 0.3s ease"
              boxShadow={activeTab === index 
                ? "0 4px 15px rgba(102, 126, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)" 
                : "inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
              }
              _light={{
                bg: activeTab === index 
                  ? "rgba(102, 126, 234, 0.8)" 
                  : "rgba(255, 255, 255, 0.8)",
                borderColor: activeTab === index 
                  ? "rgba(102, 126, 234, 0.8)" 
                  : "rgba(0, 0, 0, 0.1)",
                color: activeTab === index ? "white" : "rgba(0, 0, 0, 0.7)",
                boxShadow: activeTab === index 
                  ? "0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)" 
                  : "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)",
              }}
            >
              {tab}
            </Box>
          ))}
        </HStack>

        {/* Language and Theme Controls */}
        <HStack spacing={3}>
          <Box
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(10px)"
            borderRadius="full"
            border="1px solid rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
            boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
          >
            <Language />
          </Box>

          <Box
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(10px)"
            borderRadius="full"
            border="1px solid rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
            boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
          >
            <IconButton
              size="sm"
              variant="ghost"
              aria-label="switch theme"
              borderRadius="full"
              color="white"
              _light={{ color: "gray.500" }}
              minW="auto"
              h="auto"
              onClick={() => {
                updateThemeColor(colorMode == "dark" ? "light" : "dark");
                toggleColorMode();
              }}
            >
              {colorMode === "light" ? <DarkIcon /> : <LightIcon />}
            </IconButton>
          </Box>
        </HStack>
      </HStack>
    </Hide>
    </>
  );
};
