import {
  Badge,
  Box,
  Button,
  chakra,
  CircularProgress,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Text,
  Tooltip,
  useToast,
  VStack,
  useColorModeValue,
  SimpleGrid,
  Select,
  FormControl as ChakraFormControl,
  Switch,
  Show,
  Hide,
} from "@chakra-ui/react";
import { GlassCard } from "./common/GlassComponents";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useCoreSettings } from "contexts/CoreSettingsContext";
import { FC, useRef, useState, useEffect, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { JsonEditor } from "./JsonEditor";
import "./JsonEditor/themes.js";
import { useNodesQuery } from "contexts/NodesContext";
import debounce from "lodash.debounce";
import { joinPaths } from "@remix-run/router";
import { ReadyState } from "react-use-websocket";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { getAuthToken } from "utils/authStorage";
import { useColorMode } from "@chakra-ui/react";
import { ConfigHistory } from "./ConfigHistory";

export const MAX_NUMBER_OF_LOGS = 500;

const getStatus = (status: string) => {
  return {
    [ReadyState.CONNECTING]: "connecting",
    [ReadyState.OPEN]: "connected",
    [ReadyState.CLOSING]: "closed",
    [ReadyState.CLOSED]: "closed",
    [ReadyState.UNINSTANTIATED]: "closed",
  }[status];
};

const getWebsocketUrl = (nodeID: string) => {
  try {
    let baseURL = new URL(
      import.meta.env.VITE_BASE_API.startsWith("/")
        ? window.location.origin + import.meta.env.VITE_BASE_API
        : import.meta.env.VITE_BASE_API
    );

    return (
      (baseURL.protocol === "https:" ? "wss://" : "ws://") +
      joinPaths([
        baseURL.host + baseURL.pathname,
        !nodeID ? "/core/logs" : `/node/${nodeID}/logs`,
      ]) +
      "?interval=1&token=" +
      getAuthToken()
    );
  } catch (e) {
    console.error("Unable to generate websocket url");
    console.error(e);
    return null;
  }
};

let logsTmp: string[] = [];

export const ReloadIcon = chakra(ArrowPathIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const FullScreenIcon = chakra(ArrowsPointingOutIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const ExitFullScreenIcon = chakra(ArrowsPointingInIcon, {
  baseStyle: {
    w: 3,
    h: 3,
  },
});

export const Settings: FC = () => {
  const disabled = false;
  const { colorMode } = useColorMode();
  const { data: nodes } = useNodesQuery();
  const [selectedNode, setNode] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleLog = (id: string, title: string) => {
    if (id === selectedNode) return;
    else if (id === "host") {
      setNode("");
      setLogs([]);
    } else {
      setNode(id);
      setLogs([]);
    }
  };

  const logsDiv = useRef<HTMLDivElement | null>(null);
  const scrollShouldStayOnEnd = useRef(true);
  const updateLogs = useCallback(
    debounce((logs: string[]) => {
      const isScrollOnEnd =
        Math.abs(
          (logsDiv.current?.scrollTop || 0) -
            (logsDiv.current?.scrollHeight || 0) +
            (logsDiv.current?.offsetHeight || 0)
        ) < 10;
      if (logsDiv.current && isScrollOnEnd)
        scrollShouldStayOnEnd.current = true;
      else scrollShouldStayOnEnd.current = false;
      if (logs.length < 40) setLogs(logs);
    }, 300),
    []
  );

  const { readyState } = useWebSocket(getWebsocketUrl(selectedNode), {
    onMessage: (e: any) => {
      logsTmp.push(e.data);
      if (logsTmp.length > MAX_NUMBER_OF_LOGS)
        logsTmp = logsTmp.splice(0, logsTmp.length - MAX_NUMBER_OF_LOGS);
      updateLogs([...logsTmp]);
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 1000,
  });

  useEffect(() => {
    if (logsDiv.current && scrollShouldStayOnEnd.current)
      logsDiv.current.scrollTop = logsDiv.current?.scrollHeight;
  }, [logs]);

  useEffect(() => {
    return () => {
      logsTmp = [];
    };
  }, []);

  const {
    fetchCoreSettings,
    updateConfig,
    isLoading,
    config,
    isPostLoading,
    version,
    restartCore,
  } = useCoreSettings();
  const { t } = useTranslation();
  const toast = useToast();
  const form = useForm({
    defaultValues: { config: config || {} },
  });

  useEffect(() => {
    if (config) form.setValue("config", config);
  }, [config]);

  useEffect(() => {
    fetchCoreSettings();
  }, []);

  const { mutate: handleRestartCore, isLoading: isRestarting } =
    useMutation(restartCore);

  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleFullScreen = () => {
    if (!editorRef.current) return;
    if (!isFullScreen) {
      editorRef.current.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleOnSave = ({ config }: any) => {
    updateConfig(config);
  };

  const status = getStatus(readyState.toString());

  return (
    <form onSubmit={form.handleSubmit(handleOnSave)} style={{ height: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} minH="500px">
        {/* Configuration Section - LEFT COLUMN */}
        <VStack spacing={4} align="stretch" h="full">
          <GlassCard
            p={6}
            display="flex"
            flexDirection="column"
            h="full"
          >
            <FormControl h="full" display="flex" flexDirection="column">
              <VStack spacing={3} align="stretch" mb={4}>
                <HStack justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <HStack flexWrap="wrap">
                    <FormLabel fontSize={{ base: "md", md: "lg" }} fontWeight="bold" mb={0}>
                      {t("core.configuration")}{" "}
                      {isLoading && <CircularProgress isIndeterminate size="15px" />}
                    </FormLabel>
                    <Tooltip label="Xray Version" placement="top">
                      <Badge height="100%" textTransform="lowercase">
                        {version && `v${version}`}
                      </Badge>
                    </Tooltip>
                  </HStack>
                  <HStack gap={2} flexWrap="wrap">
                    <Tooltip label={t("core.restartCore")}>
                      <IconButton
                        aria-label="Restart Core"
                        icon={
                          <ReloadIcon
                            className={classNames({
                              "animate-spin": isRestarting,
                            })}
                          />
                        }
                        onClick={() => handleRestartCore()}
                        size="sm"
                        borderRadius="full"
                        bg="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        color="white"
                        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        _light={{ 
                          bg: "rgba(255, 255, 255, 0.8)", 
                          color: "gray.700", 
                          border: "1px solid rgba(0, 0, 0, 0.1)", 
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" } 
                        }}
                      />
                    </Tooltip>
                    <Button
                      size={{ base: "xs", md: "sm" }}
                      variant="solid"
                      colorScheme="primary"
                      px={{ base: "3", md: "5" }}
                      type="submit"
                      isDisabled={isLoading || isPostLoading}
                      isLoading={isPostLoading}
                      bg="rgba(102, 126, 234, 0.8)"
                      backdropFilter="blur(10px)"
                      borderRadius="30px"
                      border="1px solid rgba(255, 255, 255, 0.2)"
                      fontSize="sm"
                      fontWeight="600"
                      color="white"
                      boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
                      _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
                    >
                      {t("core.save")}
                    </Button>
                  </HStack>
                </HStack>
              </VStack>
              <Box 
                position="relative" 
                ref={editorRef} 
                flex={1}
                minHeight={{ base: "300px", md: "400px" }} 
                overflowY="auto"
                borderRadius="xl"
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                _light={{
                  bg: "gray.50",
                  border: "1px solid",
                  borderColor: "gray.200",
                }}
              >
                <Controller
                  control={form.control}
                  name="config"
                  render={({ field }) => (
                    <JsonEditor json={config} onChange={field.onChange} />
                  )}
                />
                <IconButton
                  size="xs"
                  aria-label="full screen"
                  variant="ghost"
                  position="absolute"
                  top="2"
                  right="4"
                  onClick={handleFullScreen}
                >
                  {!isFullScreen ? <FullScreenIcon /> : <ExitFullScreenIcon />}
                </IconButton>
              </Box>
            </FormControl>
          </GlassCard>
        </VStack>

        {/* Configuration Logs - RIGHT COLUMN */}
        <VStack spacing={4} align="stretch" h="full">
          <GlassCard
            p={6}
            display="flex"
            flexDirection="column"
            h="full"
          >
            <ChakraFormControl h="full" display="flex" flexDirection="column">
              <HStack
                justifyContent="space-between"
                style={{ paddingBottom: "1rem" }}
              >
                <HStack>
                  {nodes?.[0] && (
                    <Select
                      size="sm"
                      style={{ width: "auto" }}
                      disabled={disabled}
                      bg={disabled ? "gray.100" : "transparent"}
                      _dark={{
                        bg: disabled ? "gray.600" : "transparent",
                      }}
                      sx={{
                        option: {
                          backgroundColor: colorMode === "dark" ? "#222C3B" : "white"
                        }
                      }}
                      onChange={(v) =>
                        handleLog(
                          v.currentTarget.value,
                          v.currentTarget.selectedOptions[0].text
                        )
                      }
                    >
                      <option key={"host"} value={"host"} defaultChecked>
                        Master
                      </option>
                      {nodes &&
                        nodes.map((s) => {
                          return (
                            <option key={s.address} value={String(s.id)}>
                              {t(s.name)}
                            </option>
                          );
                        })}
                    </Select>
                  )}
                  <FormLabel fontSize="lg" fontWeight="bold" mb={0}>
                    Логи конфигурации
                  </FormLabel>
                </HStack>
                <Text as={FormLabel} fontSize="sm" mb={0}>
                  {t(`core.socket.${status}`)}
                </Text>
              </HStack>
              <Box
                borderRadius="xl"
                bg="rgba(0, 0, 0, 0.3)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                _light={{
                  bg: "gray.900",
                  border: "1px solid",
                  borderColor: "gray.200",
                  color: "gray.100"
                }}
                flex={1}
                minHeight={{ base: "300px", md: "400px" }}
                p={4}
                overflowY="auto"
                ref={logsDiv}
                fontFamily="monospace"
              >
                {logs.map((message, i) => (
                  <Text fontSize="xs" opacity={0.8} key={i} whiteSpace="pre-line">
                    {message}
                  </Text>
                ))}
              </Box>
            </ChakraFormControl>
          </GlassCard>
        </VStack>
      </SimpleGrid>
      <ConfigHistory />
    </form>
  );
};
