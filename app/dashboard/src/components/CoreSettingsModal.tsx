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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  Tooltip,
  useToast,
  useColorMode
} from "@chakra-ui/react";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { joinPaths } from "@remix-run/router";
import classNames from "classnames";
import { useCoreSettings } from "contexts/CoreSettingsContext";
import { useDashboard } from "contexts/DashboardContext";
import debounce from "lodash.debounce";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { ReadyState } from "react-use-websocket";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { getAuthToken } from "utils/authStorage";
import { Icon } from "./Icon";
import { JsonEditor } from "./JsonEditor";
import "./JsonEditor/themes.js";
import { useNodesQuery } from "contexts/NodesContext";

export const MAX_NUMBER_OF_LOGS = 500;

const UsageIcon = chakra(Cog6ToothIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});
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
const CoreSettingModalContent: FC = () => {

  const { colorMode } = useColorMode();

  const { data: nodes } = useNodesQuery();
  const disabled = false;
  const [selectedNode, setNode] = useState<string>("");

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

  const { isEditingCore } = useDashboard();
  const {
    fetchCoreSettings,
    updateConfig,
    isLoading,
    config,
    isPostLoading,
    version,
    restartCore,
  } = useCoreSettings();
  const logsDiv = useRef<HTMLDivElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const { t } = useTranslation();
  const toast = useToast();
  const form = useForm({
    defaultValues: { config: config || {} },
  });

  useEffect(() => {
    if (config) form.setValue("config", config);
  }, [config]);

  useEffect(() => {
    if (isEditingCore) fetchCoreSettings();
  }, [isEditingCore]);
  "".startsWith;
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

  const status = getStatus(readyState.toString());

  const { mutate: handleRestartCore, isLoading: isRestarting } =
    useMutation(restartCore);

  const handleOnSave = ({ config }: any) => {
    updateConfig(config)
      .then(() => {
        toast({
          title: t("core.successMessage"),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .catch((e) => {
        let message = t("core.generalErrorMessage");
        if (typeof e.response._data.detail === "object")
          message =
            e.response._data.detail[Object.keys(e.response._data.detail)[0]];
        if (typeof e.response._data.detail === "string")
          message = e.response._data.detail;

        toast({
          title: message,
          status: "error",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      });
  };
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setFullScreen] = useState(false);
  const handleFullScreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullScreen(false);
    } else {
      editorRef.current?.requestFullscreen();
      setFullScreen(true);
    }
  };
  return (
    <form onSubmit={form.handleSubmit(handleOnSave)}>
      <ModalBody>
        <FormControl>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <FormLabel>
              {t("core.configuration")}{" "}
              {isLoading && <CircularProgress isIndeterminate size="15px" />}
            </FormLabel>
            <HStack gap={0}>
              <Tooltip label="Xray Version" placement="top">
                <Badge height="100%" textTransform="lowercase">
                  {version && `v${version}`}
                </Badge>
              </Tooltip>
            </HStack>
          </HStack>
          <Box position="relative" ref={editorRef} minHeight="300px">
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
        <FormControl mt="4">
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
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 1px blue.400",
                  }}
                  _dark={{
                    bg: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  _light={{
                    bg: "white",
                    border: "1px solid",
                    borderColor: "gray.200",
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
              <FormLabel className="w-au">{t("core.logs")}</FormLabel>
            </HStack>
            <Text as={FormLabel}>{t(`core.socket.${status}`)}</Text>
          </HStack>
          <Box
            bg="rgba(0, 0, 0, 0.3)"
            border="1px solid rgba(255, 255, 255, 0.08)"
            borderRadius="xl"
            _light={{
              bg: "gray.50",
              border: "1px solid",
              borderColor: "gray.200",
            }}
            minHeight="200px"
            maxHeight={"250px"}
            p={2}
            overflowY="auto"
            ref={logsDiv}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
              },
            }}
          >
            {logs.map((message, i) => (
              <Text fontSize="xs" opacity={0.8} key={i} whiteSpace="pre-line">
                {message}
              </Text>
            ))}
          </Box>
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <HStack w="full" justifyContent="space-between">
          <HStack>
            <Box>
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
            </Box>
          </HStack>

          <HStack>
            <Button
              size="sm"
              variant="solid"
              colorScheme="primary"
              px="5"
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
      </ModalFooter>
    </form>
  );
};
export const CoreSettingsModal: FC = () => {
  const { isEditingCore } = useDashboard();
  const onClose = useDashboard.setState.bind(null, { isEditingCore: false });
  const { t } = useTranslation();

  return (
    <Modal isOpen={isEditingCore} onClose={onClose} size="3xl">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent 
        mx="3" 
        w="full"
        bg="rgba(30, 35, 50, 0.95)"
        backdropFilter="blur(20px) saturate(180%)"
        borderRadius="30px"
        border="1px solid rgba(255, 255, 255, 0.1)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        _light={{
          bg: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
        }}
      >
        <ModalHeader pt={6} color="white" _light={{ color: "gray.900" }}>
          <HStack gap={2}>
            <Icon color="primary">
              <UsageIcon color="white" />
            </Icon>
            <Text fontWeight="semibold" fontSize="lg">
              {t("core.title")}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton 
          mt={3} 
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="full"
          color="white"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.600", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
          _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
        />
        <CoreSettingModalContent />
      </ModalContent>
    </Modal>
  );
};
