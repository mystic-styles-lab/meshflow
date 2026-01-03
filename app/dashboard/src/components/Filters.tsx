import {
  Box,
  BoxProps,
  Button,
  chakra,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  ChartPieIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useDashboard } from "contexts/DashboardContext";
import debounce from "lodash.debounce";
import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";

const iconProps = {
  baseStyle: {
    w: 4,
    h: 4,
  },
};

const SearchIcon = chakra(MagnifyingGlassIcon, iconProps);
const ClearIcon = chakra(XMarkIcon, iconProps);
export const ReloadIcon = chakra(ArrowPathIcon, iconProps);
const MenuIcon = chakra(EllipsisVerticalIcon, iconProps);
const NodesIcon = chakra(ChartPieIcon, iconProps);
const AddUserIcon = chakra(PlusIcon, {
  baseStyle: {
    w: 4,
    h: 4,
    strokeWidth: 1.5,
  },
});

export type FilterProps = {} & BoxProps;
const setSearchField = debounce((search: string) => {
  useDashboard.getState().onFilterChange({
    ...useDashboard.getState().filters,
    offset: 0,
    search,
  });
}, 300);

export const Filters: FC<FilterProps> = ({ ...props }) => {
  const { 
    loading, 
    filters, 
    onFilterChange, 
    refetchUsers, 
    onCreateUser,
    onResetAllUsage,
    onShowingNodesUsage 
  } = useDashboard();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSearchField(e.target.value);
  };
  const clear = () => {
    setSearch("");
    onFilterChange({
      ...filters,
      offset: 0,
      search: "",
    });
  };

  return (
    <Grid
      id="filters"
      templateColumns={{
        lg: "repeat(3, 1fr)",
        md: "repeat(4, 1fr)",
        base: "repeat(1, 1fr)",
      }}
      position="sticky"
      top={0}
      rowGap={3}
      gap={{
        lg: 4,
        base: 0,
      }}
      py={2}
      zIndex="docked"
      {...props}
    >
      <GridItem colSpan={{ base: 1, md: 2, lg: 1 }} order={{ base: 2, md: 1 }}>
        <InputGroup>
          <InputLeftElement 
            pointerEvents="none" 
            children={<SearchIcon color="gray.400" />} 
          />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={onChange}
            bg="rgba(255, 255, 255, 0.06)"
            backdropFilter="blur(12px)"
            border="none"
            borderRadius="20px"
            color="white"
            boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.15)"
            _placeholder={{ color: "rgba(255, 255, 255, 0.4)" }}
            _light={{
              bg: "rgba(255, 255, 255, 0.7)",
              border: "none",
              color: "gray.900",
              _placeholder: { color: "gray.400" },
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.08)",
            }}
            _focus={{
              bg: "rgba(255, 255, 255, 0.1)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 16px rgba(102, 126, 234, 0.25)",
              _light: {
                bg: "rgba(255, 255, 255, 0.85)",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 4px 16px rgba(102, 126, 234, 0.2)",
              },
            }}
            _hover={{
              bg: "rgba(255, 255, 255, 0.08)",
              _light: { bg: "rgba(255, 255, 255, 0.8)" },
            }}
          />

          <InputRightElement>
            {loading && <Spinner size="xs" />}
            {filters.search && filters.search.length > 0 && (
              <IconButton
                onClick={clear}
                aria-label="clear"
                size="xs"
                variant="ghost"
                borderRadius="full"
                color="gray.400"
                _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              >
                <ClearIcon />
              </IconButton>
            )}
          </InputRightElement>
        </InputGroup>
      </GridItem>
      <GridItem colSpan={2} order={{ base: 1, md: 2 }}>
        <HStack justifyContent="flex-end" alignItems="center" h="full" spacing={3}>
          <Tooltip label={t("refresh")}>
            <Box
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              borderRadius="full"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ 
                bg: "rgba(255, 255, 255, 0.8)", 
                border: "1px solid rgba(0, 0, 0, 0.1)", 
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" 
              }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minW="44px"
              minH="44px"
              boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
            >
              <IconButton
                aria-label="refresh users"
                disabled={loading}
                onClick={refetchUsers}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="white"
                _light={{ color: "gray.500" }}
                minW="auto"
                h="auto"
              >
                <ReloadIcon
                  className={classNames({
                    "animate-spin": loading,
                  })}
                />
              </IconButton>
            </Box>
          </Tooltip>
          
          <Menu>
            <Tooltip label="Дополнительно">
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="full"
                border="1px solid rgba(255, 255, 255, 0.1)"
                _light={{ 
                  bg: "rgba(255, 255, 255, 0.8)", 
                  border: "1px solid rgba(0, 0, 0, 0.1)", 
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)" 
                }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                minW="44px"
                minH="44px"
                boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
              >
                <MenuButton
                  as={IconButton}
                  icon={<MenuIcon />}
                  variant="ghost"
                  size="sm"
                  borderRadius="full"
                  color="white"
                  _light={{ color: "gray.500" }}
                  minW="auto"
                  h="auto"
                  aria-label="Дополнительные действия"
                />
              </Box>
            </Tooltip>
            <Portal>
              <MenuList 
                zIndex={10000}
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
                  onClick={() => onShowingNodesUsage(true)}
                  borderRadius="10px"
                  bg="transparent"
                  color="white"
                  _light={{ color: "gray.900" }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    _light: { bg: "rgba(0, 0, 0, 0.05)" },
                  }}
                >
                  <HStack>
                    <NodesIcon />
                    <span>Использование узлов</span>
                  </HStack>
                </MenuItem>
                <MenuItem 
                  onClick={() => onResetAllUsage(true)} 
                  borderRadius="10px"
                  bg="transparent"
                  color="orange.400"
                  _light={{ color: "orange.500" }}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    _light: { bg: "rgba(0, 0, 0, 0.05)" },
                  }}
                >
                  <HStack>
                    <ReloadIcon />
                    <span>Сбросить использование</span>
                  </HStack>
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
          
          <Button
            leftIcon={<AddIcon />}
            onClick={() => onCreateUser(true)}
            bg="rgba(102, 126, 234, 0.8)"
            backdropFilter="blur(10px)"
            borderRadius="30px"
            border="1px solid rgba(255, 255, 255, 0.2)"
            px="5"
            py="2.5"
            fontSize="sm"
            fontWeight="600"
            color="white"
            boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
            _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
          >
            {t("createUser")}
          </Button>
        </HStack>
      </GridItem>
    </Grid>
  );
};
