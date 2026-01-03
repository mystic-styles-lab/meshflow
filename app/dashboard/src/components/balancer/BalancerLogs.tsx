import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Switch,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FC, useState, useEffect, useRef } from "react";

export const BalancerLogs: FC = () => {
  const [connectionLogs, setConnectionLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(26, 32, 44, 0.6)");
  const logBg = useColorModeValue("gray.900", "gray.950");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const tabSelectedBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [connectionLogs, errorLogs, autoScroll]);

  const connectSSE = () => {
    const eventSource = new EventSource("http://localhost:9000/api/logs/stream");

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener("connection", (event: any) => {
      if (!isPaused) {
        const data = JSON.parse(event.data);
        setConnectionLogs((prev) => [...prev.slice(-99), data]);
      }
    });

    eventSource.addEventListener("error_log", (event: any) => {
      if (!isPaused) {
        const data = JSON.parse(event.data);
        setErrorLogs((prev) => [...prev.slice(-99), data]);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      setTimeout(connectSSE, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  const filteredConnectionLogs = connectionLogs.filter((log) =>
    JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
  );

  const filteredErrorLogs = errorLogs.filter((log) =>
    JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
  );

  const clearLogs = (type: "connection" | "error") => {
    if (type === "connection") {
      setConnectionLogs([]);
    } else {
      setErrorLogs([]);
    }
  };

  return (
    <Box
      bg="rgba(30, 35, 50, 0.7)"
      backdropFilter="blur(20px) saturate(180%)"
      borderRadius="30px"
      border="1px solid rgba(255, 255, 255, 0.08)"
      overflow="hidden"
      boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      minH="600px"
      _light={{
        bg: "rgba(255, 255, 255, 0.8)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
      }}
    >
      <VStack spacing={0} align="stretch">
        {/* Header */}
        <HStack justify="space-between" p={6} borderBottom="1px solid rgba(255, 255, 255, 0.1)" _light={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
          <HStack spacing={4}>
            <Text fontSize="2xl" fontWeight="bold" color="white" _light={{ color: "gray.800" }}>
              Логи балансера
            </Text>
            <Badge
              colorScheme={isConnected ? "green" : "red"}
              fontSize="xs"
              px={3}
              py={1}
              borderRadius="full"
              fontWeight="semibold"
            >
              {isConnected ? "Подключено" : "Отключено"}
            </Badge>
          </HStack>
          <HStack spacing={4}>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.400" _light={{ color: "gray.600" }}>
                Авто-прокрутка
              </Text>
              <Switch
                isChecked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                colorScheme="blue"
              />
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="medium" color="gray.400" _light={{ color: "gray.600" }}>
                Пауза
              </Text>
              <Switch
                isChecked={isPaused}
                onChange={(e) => setIsPaused(e.target.checked)}
                colorScheme="orange"
              />
            </HStack>
          </HStack>
        </HStack>

        {/* Filter */}
        <Box p={4} borderBottom="1px solid rgba(255, 255, 255, 0.1)" _light={{ borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Фильтр логов..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              color="white"
              _light={{
                bg: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                color: "gray.800",
              }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </InputGroup>
        </Box>

        {/* Tabs */}
        <Tabs variant="unstyled">
          <HStack spacing={2} px={6} pt={4} pb={2}>
            <Tab
              borderRadius="20px"
              px={6}
              py={2}
              fontSize="sm"
              fontWeight="600"
              transition="all 0.3s"
              color="gray.400"
              _light={{ color: "gray.600" }}
              _selected={{
                bg: "rgba(255, 255, 255, 0.1)",
                color: "blue.300",
                _light: { bg: "white", color: "blue.600", boxShadow: "sm" }
              }}
            >
              Подключения ({filteredConnectionLogs.length})
            </Tab>
            <Tab
              borderRadius="20px"
              px={6}
              py={2}
              fontSize="sm"
              fontWeight="600"
              transition="all 0.3s"
              color="gray.400"
              _light={{ color: "gray.600" }}
              _selected={{
                bg: "rgba(255, 255, 255, 0.1)",
                color: "red.300",
                _light: { bg: "white", color: "red.600", boxShadow: "sm" }
              }}
            >
              Ошибки ({filteredErrorLogs.length})
            </Tab>
          </HStack>

          <TabPanels>
            <TabPanel px={6} pb={6}>
              <VStack align="stretch" spacing={3}>
                <HStack justify="flex-end">
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => clearLogs("connection")}
                    borderRadius="lg"
                  >
                    Очистить
                  </Button>
                </HStack>
                <Box
                  ref={consoleRef}
                  bg="rgba(0, 0, 0, 0.3)"
                  borderRadius="xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  p={4}
                  maxH="500px"
                  overflowY="auto"
                  fontFamily="mono"
                  fontSize="xs"
                  color="green.300"
                  css={{
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "4px",
                    },
                  }}
                >
                  {filteredConnectionLogs.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      Нет логов подключений
                    </Text>
                  ) : (
                    filteredConnectionLogs.map((log, index) => (
                      <Box 
                        key={index} 
                        mb={3} 
                        _hover={{ bg: "whiteAlpha.100" }} 
                        p={3} 
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="whiteAlpha.200"
                      >
                        <VStack align="stretch" spacing={1}>
                          <HStack justify="space-between" flexWrap="wrap">
                            <HStack spacing={3}>
                              <Badge colorScheme="green" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                {log.protocol?.toUpperCase() || "SOCKS5"}
                              </Badge>
                              <Text color="gray.400" fontSize="xs">
                                {new Date(log.timestamp).toLocaleString()}
                              </Text>
                            </HStack>
                            {log.duration && (
                              <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                {log.duration}ms
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={2} color="cyan.300" fontSize="sm">
                            <Text fontWeight="bold">{log.clientIp}</Text>
                            <Text color="gray.500">→</Text>
                            <Text color="yellow.300">{log.target || log.destination}</Text>
                            <Text color="gray.500">через</Text>
                            <Text color="green.300" fontWeight="semibold">{log.proxy}</Text>
                          </HStack>
                          {(log.bytesTransferred || log.dataSize) && (
                            <HStack spacing={4} fontSize="xs" color="gray.400">
                              <Text>
                                <Text as="span" color="purple.300">Данные:</Text> {log.bytesTransferred || log.dataSize}
                              </Text>
                              {log.responseTime && (
                                <Text>
                                  <Text as="span" color="blue.300">Ответ:</Text> {log.responseTime}ms
                                </Text>
                              )}
                            </HStack>
                          )}
                        </VStack>
                      </Box>
                    ))
                  )}
                </Box>
              </VStack>
            </TabPanel>

            <TabPanel px={6} pb={6}>
              <VStack align="stretch" spacing={3}>
                <HStack justify="flex-end">
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => clearLogs("error")}
                    borderRadius="lg"
                  >
                    Очистить
                  </Button>
                </HStack>
                <Box
                  ref={consoleRef}
                  bg="rgba(0, 0, 0, 0.3)"
                  borderRadius="xl"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  p={4}
                  maxH="500px"
                  overflowY="auto"
                  fontFamily="mono"
                  fontSize="xs"
                  color="red.300"
                  css={{
                    "&::-webkit-scrollbar": {
                      width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255, 255, 255, 0.2)",
                      borderRadius: "4px",
                    },
                  }}
                >
                  {filteredErrorLogs.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      Нет ошибок
                    </Text>
                  ) : (
                    filteredErrorLogs.map((log, index) => (
                      <Box 
                        key={index} 
                        mb={3} 
                        _hover={{ bg: "whiteAlpha.100" }} 
                        p={3} 
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="red.900"
                        bg="red.950"
                      >
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between" flexWrap="wrap">
                            <HStack spacing={3}>
                              <Badge colorScheme="red" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                ERROR
                              </Badge>
                              <Text color="gray.400" fontSize="xs">
                                {new Date(log.timestamp).toLocaleString()}
                              </Text>
                            </HStack>
                            {log.errorCode && (
                              <Badge colorScheme="orange" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                {log.errorCode}
                              </Badge>
                            )}
                          </HStack>
                          <Text color="red.300" fontSize="sm" fontWeight="semibold">
                            {log.message || log.error}
                          </Text>
                          {log.proxy && (
                            <HStack spacing={2} fontSize="xs">
                              <Text color="gray.400">Прокси:</Text>
                              <Text color="yellow.300">{log.proxy}</Text>
                            </HStack>
                          )}
                          {log.target && (
                            <HStack spacing={2} fontSize="xs">
                              <Text color="gray.400">Цель:</Text>
                              <Text color="cyan.300">{log.target}</Text>
                            </HStack>
                          )}
                          {log.clientIp && (
                            <HStack spacing={2} fontSize="xs">
                              <Text color="gray.400">Клиент:</Text>
                              <Text color="purple.300">{log.clientIp}</Text>
                            </HStack>
                          )}
                          {log.stack && (
                            <Box
                              mt={2}
                              p={2}
                              bg="blackAlpha.500"
                              borderRadius="md"
                              fontSize="10px"
                              color="gray.500"
                              maxH="100px"
                              overflowY="auto"
                            >
                              <Text whiteSpace="pre-wrap">{log.stack}</Text>
                            </Box>
                          )}
                        </VStack>
                      </Box>
                    ))
                  )}
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};
