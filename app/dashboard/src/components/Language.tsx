import {
  chakra,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { GlobeAltIcon } from "@heroicons/react/24/solid";
import { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";

type HeaderProps = {
  actions?: ReactNode;
};

const LangIcon = chakra(GlobeAltIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const Language: FC<HeaderProps> = ({ actions }) => {
  const { i18n } = useTranslation();

  var changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={IconButton}
        size="sm"
        variant="ghost"
        icon={<LangIcon />}
        borderRadius="full"
        color="white"
        _light={{ color: "gray.500" }}
        minW="auto"
        h="auto"
        _hover={{
          bg: "rgba(255, 255, 255, 0.1)",
          _light: { bg: "rgba(0, 0, 0, 0.05)" },
        }}
        _active={{
          bg: "rgba(255, 255, 255, 0.15)",
          _light: { bg: "rgba(0, 0, 0, 0.1)" },
        }}
      />
      <Portal>
        <MenuList 
          minW="120px" 
          zIndex={99999}
          bg="rgba(30, 35, 50, 0.95)"
          backdropFilter="blur(20px) saturate(180%)"
          borderRadius="16px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
          py={1}
          px={1}
          _light={{
            bg: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <MenuItem
            fontSize="sm"
            borderRadius="10px"
            color="white"
            bg="transparent"
            px={3}
            py={2}
            _light={{ color: "gray.900" }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              _light: { bg: "rgba(0, 0, 0, 0.05)" },
            }}
            onClick={() => changeLanguage("en")}
          >
            English
          </MenuItem>
          <MenuItem
            fontSize="sm"
            borderRadius="10px"
            color="white"
            bg="transparent"
            px={3}
            py={2}
            _light={{ color: "gray.900" }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              _light: { bg: "rgba(0, 0, 0, 0.05)" },
            }}
            onClick={() => changeLanguage("fa")}
          >
            فارسی
          </MenuItem>
          <MenuItem
            fontSize="sm"
            borderRadius="10px"
            color="white"
            bg="transparent"
            px={3}
            py={2}
            _light={{ color: "gray.900" }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              _light: { bg: "rgba(0, 0, 0, 0.05)" },
            }}
            onClick={() => changeLanguage("zh-cn")}
          >
            简体中文
          </MenuItem>
          <MenuItem
            fontSize="sm"
            borderRadius="10px"
            color="white"
            bg="transparent"
            px={3}
            py={2}
            _light={{ color: "gray.900" }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              _light: { bg: "rgba(0, 0, 0, 0.05)" },
            }}
            onClick={() => changeLanguage("ru")}
          >
            Русский
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};
