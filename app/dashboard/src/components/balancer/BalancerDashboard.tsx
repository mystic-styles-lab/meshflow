import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Spinner,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Switch,
  Flex,
  Progress,
  Tooltip,
  Show,
  Hide,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { balancerApi } from "service/balancer";
import { AddIcon, DeleteIcon, CheckIcon, CloseIcon, RepeatIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { 
  ServerIcon, 
  SignalIcon, 
  ArrowPathIcon as ArrowPathIconOutline,
  CheckCircleIcon 
} from "@heroicons/react/24/outline";
import { chakra } from "@chakra-ui/react";
import classNames from "classnames";

const ServerIconStyled = chakra(ServerIcon, { baseStyle: { w: 7, h: 7 } });
const SignalIconStyled = chakra(SignalIcon, { baseStyle: { w: 7, h: 7 } });
const ArrowPathIconStyled = chakra(ArrowPathIconOutline, { baseStyle: { w: 7, h: 7 } });
const CheckCircleIconStyled = chakra(CheckCircleIcon, { baseStyle: { w: 7, h: 7 } });
const ReloadIcon = chakra(ArrowPathIconOutline, { baseStyle: { w: 4, h: 4 } });

interface Proxy {
  id: number;
  name: string;
  protocol: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  enabled: boolean;
  priority: number;
  healthy: boolean;
  activeConnections: number;
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  avgResponseTime?: number;
}

interface Statistics {
  totalProxies: number;
  activeProxies: number;
  totalConnections: number;
  activeConnections: number;
  successRate: number;
}

export const BalancerDashboard: FC = () => {
  const [proxyList, setProxyList] = useState<Proxy[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const toast = useToast();
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    protocol: "socks5",
    host: "",
    port: "",
    username: "",
    password: "",
    priority: "1",
    maxConnections: "100",
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
    name: "",
    protocol: "socks5",
    host: "",
    port: "",
    username: "",
    password: "",
    priority: "1",
    maxConnections: "100",
  });

  const cardBg = "rgba(30, 41, 59, 0.4)";
  const statCardBg = "rgba(30, 41, 59, 0.4)";
  const borderColor = "rgba(255, 255, 255, 0.08)";
  const hoverBg = "rgba(255, 255, 255, 0.05)";
  const proxyCardBg = "rgba(30, 41, 59, 0.4)";
  const proxyCardHoverBg = "rgba(255, 255, 255, 0.05)";

  // Группировка прокси по типу
  const tcpProxies = proxyList.filter(p => ['socks5', 'http', 'https'].includes(p.protocol.toLowerCase()));
  const udpProxies = proxyList.filter(p => ['shadowsocks', 'ss', 'vless', 'vmess', 'trojan'].includes(p.protocol.toLowerCase()));

  useEffect(() => {
    loadData();
    const dataInterval = setInterval(() => loadData(true), 5000);
    const pingInterval = setInterval(() => testAllProxies(), 10000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(pingInterval);
    };
  }, []);

  const testAllProxies = async () => {
    try {
      await balancerApi.proxies.testAll();
      // Reload data to get updated ping times
      await loadData(true);
    } catch (error) {
      console.error('[BalancerDashboard] Error testing all proxies:', error);
    }
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      console.log('[BalancerDashboard] Loading data...');
      console.log('[BalancerDashboard] API endpoint: /balancer-api/proxies');
      
      const proxiesRes = await balancerApi.proxies.getAll();
      const statsRes = await balancerApi.stats.get();
      
      console.log('[BalancerDashboard] Raw proxies response:', proxiesRes);
      console.log('[BalancerDashboard] Raw stats response:', statsRes);
      
      const proxies = Array.isArray(proxiesRes) ? proxiesRes : (proxiesRes.data || []);
      const stats = statsRes.data || statsRes;
      
      console.log('[BalancerDashboard] Final proxies count:', proxies.length);
      console.log('[BalancerDashboard] Final stats:', stats);
      
      setProxyList(proxies);
      setStatistics(stats);
    } catch (error) {
      console.error('[BalancerDashboard] Error loading data:', error);
      console.error('[BalancerDashboard] Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleProxy = async (id: number) => {
    try {
      const proxy = proxyList.find(p => p.id === id);
      if (!proxy) return;
      
      await balancerApi.proxies.toggle(id, !proxy.enabled);
      toast({
        title: "Успешно",
        description: `Прокси ${!proxy.enabled ? 'включен' : 'выключен'}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      loadData();
    } catch (error) {
      console.error('Error toggling proxy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteProxy = async (id: number) => {
    if (!window.confirm('Удалить прокси?')) return;
    try {
      await balancerApi.proxies.delete(id);
      toast({
        title: "Успешно",
        description: "Прокси удален",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      loadData();
    } catch (error) {
      console.error('Error deleting proxy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleTestProxy = async (id: number) => {
    try {
      setTestingProxyId(id.toString());
      const result = await balancerApi.proxies.test(id);
      setTestingProxyId(null);
      
      if (result.success) {
        toast({
          title: "Прокси работает",
          description: `Время отклика: ${result.responseTime}ms`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Прокси не работает",
          description: result.error || "Не удалось подключиться",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Error testing proxy:', error);
      setTestingProxyId(null);
      toast({
        title: "Ошибка",
        description: "Не удалось протестировать прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddProxy = async () => {
    try {
      await balancerApi.proxies.create({
        name: formData.name,
        protocol: formData.protocol,
        host: formData.host,
        port: parseInt(formData.port),
        username: formData.username || undefined,
        password: formData.password || undefined,
        priority: parseInt(formData.priority),
        maxConnections: parseInt(formData.maxConnections),
      });
      onClose();
      setFormData({
        name: "",
        protocol: "socks5",
        host: "",
        port: "",
        username: "",
        password: "",
        priority: "1",
        maxConnections: "100",
      });
      loadData();
    } catch (error) {
      console.error('Error adding proxy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditProxy = (proxy: Proxy) => {
    setEditFormData({
      id: proxy.id,
      name: proxy.name,
      protocol: proxy.protocol,
      host: proxy.host,
      port: proxy.port.toString(),
      username: proxy.username || "",
      password: proxy.password || "",
      priority: proxy.priority?.toString() || "1",
      maxConnections: (proxy as any).maxConnections?.toString() || "100",
    });
    onEditOpen();
  };

  const handleUpdateProxy = async () => {
    try {
      await balancerApi.proxies.update(editFormData.id, {
        name: editFormData.name,
        protocol: editFormData.protocol,
        host: editFormData.host,
        port: parseInt(editFormData.port),
        username: editFormData.username,
        password: editFormData.password,
        priority: parseInt(editFormData.priority),
        maxConnections: parseInt(editFormData.maxConnections),
      });
      toast({
        title: "Успешно",
        description: "Прокси обновлен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      loadData();
    } catch (error) {
      console.error('Error updating proxy:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }


  return (
    <VStack spacing={6} align="stretch">
      {/* Statistics */}
      {statistics && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3} w="full">
          <Box
            bg="rgba(255, 255, 255, 0.03)"
            backdropFilter="blur(20px) saturate(180%)"
            p={4}
            borderRadius="24px"
            border="1px solid rgba(255, 255, 255, 0.08)"
            boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)"
            transition="all 0.3s ease"
            _light={{
              bg: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            <HStack spacing={3} align="center">
              <Box color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.6)" }}>
                <ServerIconStyled />
              </Box>
              <VStack align="start" spacing={0}>
                <Text 
                  fontSize="xs" 
                  color="rgba(255, 255, 255, 0.5)"
                  _light={{ color: "rgba(0, 0, 0, 0.5)" }}
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Всего прокси
                </Text>
                <HStack spacing={2} align="baseline">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    _light={{ color: "gray.900" }}
                  >
                    {statistics.totalProxies}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
          <Box
            bg="rgba(255, 255, 255, 0.03)"
            backdropFilter="blur(20px) saturate(180%)"
            p={4}
            borderRadius="24px"
            border="1px solid rgba(255, 255, 255, 0.08)"
            boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)"
            transition="all 0.3s ease"
            _light={{
              bg: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            <HStack spacing={3} align="center">
              <Box color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.6)" }}>
                <CheckCircleIconStyled />
              </Box>
              <VStack align="start" spacing={0}>
                <Text 
                  fontSize="xs" 
                  color="rgba(255, 255, 255, 0.5)"
                  _light={{ color: "rgba(0, 0, 0, 0.5)" }}
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Активные
                </Text>
                <HStack spacing={2} align="baseline">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    _light={{ color: "gray.900" }}
                  >
                    {statistics.activeProxies}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
          <Box
            bg="rgba(255, 255, 255, 0.03)"
            backdropFilter="blur(20px) saturate(180%)"
            p={4}
            borderRadius="24px"
            border="1px solid rgba(255, 255, 255, 0.08)"
            boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)"
            transition="all 0.3s ease"
            _light={{
              bg: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            <HStack spacing={3} align="center">
              <Box color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.6)" }}>
                <ArrowPathIconStyled />
              </Box>
              <VStack align="start" spacing={0}>
                <Text 
                  fontSize="xs" 
                  color="rgba(255, 255, 255, 0.5)"
                  _light={{ color: "rgba(0, 0, 0, 0.5)" }}
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Подключения
                </Text>
                <HStack spacing={2} align="baseline">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    _light={{ color: "gray.900" }}
                  >
                    {statistics.activeConnections}
                  </Text>
                  <Text 
                    fontSize="xs" 
                    color="rgba(255, 255, 255, 0.5)" 
                    _light={{ color: "rgba(0, 0, 0, 0.5)" }}
                  >
                    Всего: {statistics.totalConnections}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
          <Box
            bg="rgba(255, 255, 255, 0.03)"
            backdropFilter="blur(20px) saturate(180%)"
            p={4}
            borderRadius="24px"
            border="1px solid rgba(255, 255, 255, 0.08)"
            boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)"
            transition="all 0.3s ease"
            _light={{
              bg: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.9)",
            }}
          >
            <HStack spacing={3} align="center">
              <Box color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.6)" }}>
                <SignalIconStyled />
              </Box>
              <VStack align="start" spacing={0}>
                <Text 
                  fontSize="xs" 
                  color="rgba(255, 255, 255, 0.5)"
                  _light={{ color: "rgba(0, 0, 0, 0.5)" }}
                  fontWeight="medium"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Успешность
                </Text>
                <HStack spacing={2} align="baseline">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    _light={{ color: "gray.900" }}
                  >
                    {statistics.successRate != null ? statistics.successRate.toFixed(1) : "0"}%
                  </Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
        </SimpleGrid>
      )}

      {/* Proxy List - Table for Desktop, Cards for Mobile */}
      <VStack spacing={6} align="stretch">
        {/* Прокси */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <HStack spacing={3}>
              <Text fontSize="xl" fontWeight="bold" color="white" _light={{ color: "gray.800" }}>
                Прокси
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Tooltip label="Обновить">
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
                    aria-label="Refresh"
                    disabled={refreshing}
                    onClick={() => loadData()}
                    variant="ghost"
                    size="sm"
                    borderRadius="full"
                    color="white"
                    _light={{ color: "gray.500" }}
                    minW="auto"
                    h="auto"
                  >
                    <ReloadIcon className={classNames({ "animate-spin": refreshing })} />
                  </IconButton>
                </Box>
              </Tooltip>
              <Button
                leftIcon={<AddIcon />}
                onClick={onOpen}
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
                Добавить
              </Button>
            </HStack>
          </HStack>

          {/* Desktop Table View */}
          <Hide below="md">
            <Box
              overflowX="auto"
              borderRadius="30px"
              bg="rgba(255, 255, 255, 0.03)"
              backdropFilter="blur(20px) saturate(180%)"
              border="1px solid rgba(255, 255, 255, 0.08)"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                  height: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                  height: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                },
              }}
              _light={{
                bg: "white",
                border: "1px solid",
                borderColor: "gray.200",
                boxShadow: "sm",
              }}
            >
              <Box>
                <Table variant="unstyled" size="md">
                  <Thead 
                    bg="linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(128, 90, 213, 0.12) 100%)"
                    backdropFilter="blur(10px)"
                    _light={{ bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(128, 90, 213, 0.08) 100%)" }}
                  >
                    <Tr>
                      <Th 
                        color="rgba(255, 255, 255, 0.7)"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        py={3}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                        pl={4}
                      >Статус</Th>
                      <Th 
                        color="rgba(255, 255, 255, 0.7)"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        py={3}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                      >Имя / Адрес</Th>
                      <Th 
                        color="rgba(255, 255, 255, 0.7)"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        py={3}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                      >Здоровье</Th>
                      <Th 
                        color="rgba(255, 255, 255, 0.7)"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        py={3}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                      >Подключения</Th>
                      <Th 
                        color="rgba(255, 255, 255, 0.7)"
                        fontSize="xs"
                        fontWeight="600"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                        py={3}
                        borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                        _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                        textAlign="right"
                      ></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {proxyList.map((proxy) => (
                    <Tr
                      key={proxy.id}
                      transition="all 0.25s ease"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.08)",
                        _light: { bg: "rgba(0, 0, 0, 0.03)" },
                      }}
                      borderBottom="1px solid rgba(255, 255, 255, 0.06)"
                      _light={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
                    >
                      <Td py={4} borderBottom={0} pl={4}>
                        <Switch
                          size="md"
                          colorScheme="green"
                          isChecked={proxy.enabled}
                          onChange={() => handleToggleProxy(proxy.id)}
                        />
                      </Td>
                      <Td py={4} borderBottom={0}>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="semibold" fontSize="md" color="white" _light={{ color: "gray.800" }}>
                              {proxy.name}
                            </Text>
                            <Badge
                              bg="rgba(59, 130, 246, 0.2)"
                              color="blue.300"
                              fontSize="2xs"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              border="1px solid rgba(59, 130, 246, 0.3)"
                              _light={{ bg: "rgba(59, 130, 246, 0.15)", color: "blue.600" }}
                            >
                              {proxy.protocol.toUpperCase()}
                            </Badge>
                            <Badge
                              bg="rgba(168, 85, 247, 0.2)"
                              color="purple.300"
                              fontSize="2xs"
                              px={2}
                              py={0.5}
                              borderRadius="md"
                              border="1px solid rgba(168, 85, 247, 0.3)"
                              _light={{ bg: "rgba(168, 85, 247, 0.15)", color: "purple.600" }}
                            >
                              P{proxy.priority}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)" _light={{ color: "gray.500" }}>
                            {proxy.host}:{proxy.port}
                          </Text>
                        </VStack>
                      </Td>
                      <Td py={4} borderBottom={0}>
                        {proxy.avgResponseTime ? (
                          <Text 
                            fontSize="sm" 
                            fontWeight="medium"
                            color={
                              proxy.avgResponseTime < 100 ? "green.400" :
                              proxy.avgResponseTime < 300 ? "yellow.400" :
                              "red.400"
                            }
                            _light={{
                              color: proxy.avgResponseTime < 100 ? "green.600" :
                                     proxy.avgResponseTime < 300 ? "yellow.600" :
                                     "red.600"
                            }}
                          >
                            {Math.round(proxy.avgResponseTime)}ms
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.4)" _light={{ color: "gray.400" }}>N/A</Text>
                        )}
                      </Td>
                      <Td py={4} borderBottom={0}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium" color="white" _light={{ color: "gray.800" }}>
                            {proxy.activeConnections || 0} / {proxy.totalConnections || 0}
                          </Text>
                          {proxy.totalConnections > 0 && (
                            <Progress
                              value={(proxy.activeConnections / proxy.totalConnections) * 100}
                              size="sm"
                              colorScheme="blue"
                              borderRadius="full"
                              w="80px"
                            />
                          )}
                        </VStack>
                      </Td>
                      <Td py={4} textAlign="right" borderBottom={0}>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<HamburgerIcon />}
                            w="40px"
                            h="40px"
                            minW="unset"
                            p={0}
                            bg="rgba(255, 255, 255, 0.05)"
                            backdropFilter="blur(10px)"
                            border="1px solid rgba(255, 255, 255, 0.1)"
                            color="white"
                            borderRadius="full"
                            boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                            _light={{ bg: "rgba(255, 255, 255, 0.8)", color: "gray.700", border: "1px solid rgba(0, 0, 0, 0.1)", _hover: { bg: "rgba(255, 255, 255, 0.95)" } }}
                            aria-label="Действия"
                          />
                          <MenuList
                            bg="rgba(30, 41, 59, 0.95)"
                            backdropFilter="blur(40px) saturate(180%)"
                            border="1px solid rgba(255, 255, 255, 0.08)"
                            borderRadius="20px"
                            boxShadow="0 8px 32px rgba(0, 0, 0, 0.3)"
                            _light={{ bg: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(0, 0, 0, 0.08)" }}
                          >
                            <MenuItem
                              icon={<RepeatIcon />}
                              onClick={() => handleTestProxy(proxy.id)}
                              isDisabled={testingProxyId === proxy.id.toString()}
                              bg="transparent"
                              color="white"
                              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                              _light={{ color: "gray.700", _hover: { bg: "rgba(0, 0, 0, 0.05)" } }}
                            >
                              Проверить
                            </MenuItem>
                            <MenuItem
                              icon={<EditIcon />}
                              onClick={() => handleEditProxy(proxy)}
                              bg="transparent"
                              color="white"
                              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                              _light={{ color: "gray.700", _hover: { bg: "rgba(0, 0, 0, 0.05)" } }}
                            >
                              Редактировать
                            </MenuItem>
                            <MenuItem
                              icon={<DeleteIcon />}
                              onClick={() => handleDeleteProxy(proxy.id)}
                              color="red.500"
                            >
                              Удалить
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Hide>

        {/* Mobile Card View */}
        <Show below="md">
          <SimpleGrid columns={1} spacing={3}>
            {proxyList.map((proxy) => (
              <Box
                key={proxy.id}
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(20px) saturate(180%)"
                borderRadius="20px"
                border="1px solid rgba(255, 255, 255, 0.1)"
                p={5}
                boxShadow="0 4px 15px rgba(0, 0, 0, 0.2)"
                transition="all 0.2s"
                _hover={{ bg: "rgba(255, 255, 255, 0.08)", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)" }}
                _light={{
                  bg: "rgba(255, 255, 255, 0.8)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                  _hover: { bg: "rgba(255, 255, 255, 0.95)", boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)" }
                }}
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <HStack spacing={3}>
                    <Switch
                      size="md"
                      colorScheme="green"
                      isChecked={proxy.enabled}
                      onChange={() => handleToggleProxy(proxy.id)}
                    />
                    <Badge
                      colorScheme={proxy.enabled ? "green" : "gray"}
                      fontSize="sm"
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg={proxy.enabled ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.1)"}
                      color={proxy.enabled ? "green.300" : "gray.400"}
                      border="1px solid"
                      borderColor={proxy.enabled ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.2)"}
                      _light={{
                        bg: proxy.enabled ? "rgba(34, 197, 94, 0.1)" : "rgba(0, 0, 0, 0.05)",
                        color: proxy.enabled ? "green.600" : "gray.600",
                        borderColor: proxy.enabled ? "rgba(34, 197, 94, 0.2)" : "rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      {proxy.enabled ? "ВКЛ" : "ВЫКЛ"}
                    </Badge>
                  </HStack>
                  <HStack spacing={2}>
                    <Tooltip label="Проверить">
                      <IconButton
                        aria-label="Test"
                        icon={<RepeatIcon />}
                        size="sm"
                        bg="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        color="white"
                        borderRadius="full"
                        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        _light={{
                          bg: "rgba(255, 255, 255, 0.8)",
                          color: "gray.700",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" }
                        }}
                        onClick={() => handleTestProxy(proxy.id)}
                        isLoading={testingProxyId === proxy.id.toString()}
                      />
                    </Tooltip>
                    <Tooltip label="Редактировать">
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="sm"
                        bg="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        color="white"
                        borderRadius="full"
                        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        _light={{
                          bg: "rgba(255, 255, 255, 0.8)",
                          color: "gray.700",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" }
                        }}
                        onClick={() => handleEditProxy(proxy)}
                      />
                    </Tooltip>
                    <Tooltip label="Удалить">
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="sm"
                        bg="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        color="white"
                        borderRadius="full"
                        boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        _light={{
                          bg: "rgba(255, 255, 255, 0.8)",
                          color: "gray.700",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" }
                        }}
                        onClick={() => handleDeleteProxy(proxy.id)}
                      />
                    </Tooltip>
                  </HStack>
                </Flex>

                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="bold" color="white" _light={{ color: "gray.800" }}>
                      {proxy.name}
                    </Text>
                  </HStack>

                  <HStack spacing={2}>
                    <Badge
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="rgba(59, 130, 246, 0.15)"
                      color="blue.300"
                      border="1px solid rgba(59, 130, 246, 0.3)"
                      _light={{
                        bg: "rgba(59, 130, 246, 0.1)",
                        color: "blue.600",
                        borderColor: "rgba(59, 130, 246, 0.2)"
                      }}
                    >
                      {proxy.protocol.toUpperCase()}
                    </Badge>
                    <Badge
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg="rgba(168, 85, 247, 0.15)"
                      color="purple.300"
                      border="1px solid rgba(168, 85, 247, 0.3)"
                      _light={{
                        bg: "rgba(168, 85, 247, 0.1)",
                        color: "purple.600",
                        borderColor: "rgba(168, 85, 247, 0.2)"
                      }}
                    >
                      P{proxy.priority}
                    </Badge>
                  </HStack>

                  <Text fontSize="md" color="gray.400" _light={{ color: "gray.600" }}>
                    {proxy.host}:{proxy.port}
                  </Text>

                  <Box mt={2} pt={3} borderTopWidth="1px" borderColor="rgba(255, 255, 255, 0.1)" _light={{ borderColor: "rgba(0, 0, 0, 0.1)" }}>
                    <HStack justify="space-between" fontSize="sm">
                      <Text color="gray.400" _light={{ color: "gray.600" }}>Подключения:</Text>
                      <Text fontWeight="medium" color="white" _light={{ color: "gray.800" }}>
                        {proxy.activeConnections || 0} / {proxy.totalConnections || 0}
                      </Text>
                    </HStack>
                    {proxy.totalConnections > 0 && (
                      <Progress
                        value={(proxy.activeConnections / proxy.totalConnections) * 100}
                        size="sm"
                        colorScheme="blue"
                        borderRadius="full"
                        mt={2}
                        bg="rgba(255, 255, 255, 0.1)"
                        _light={{ bg: "rgba(0, 0, 0, 0.1)" }}
                      />
                    )}
                  </Box>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Show>
      </Box>


      </VStack>

      {/* Modals */}
      {/* Add Proxy Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
        <ModalContent 
          mx="3"
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
          <ModalHeader pt={6} fontSize="lg" fontWeight="bold" color="white" _light={{ color: "gray.900" }}>
            Добавить прокси
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
          <ModalBody pb={4}>
            <VStack spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" mb={1}>Название</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Мой прокси"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" mb={1}>Протокол</FormLabel>
                <Select
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  sx={{
                    option: {
                      bg: "rgba(30, 35, 50, 0.98)",
                      color: "white",
                      _light: { bg: "white", color: "gray.800" }
                    }
                  }}
                >
                  <option value="socks5">SOCKS5</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </Select>
              </FormControl>
              <HStack width="100%" spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" mb={1}>Хост</FormLabel>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="127.0.0.1"
                    size="md"
                    borderRadius="20px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  />
                </FormControl>
                <FormControl isRequired width="30%">
                  <FormLabel fontSize="sm" mb={1}>Порт</FormLabel>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    placeholder="1080"
                    size="md"
                    borderRadius="20px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  />
                </FormControl>
              </HStack>
              <HStack width="100%" spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>Логин</FormLabel>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    size="md"
                    borderRadius="20px"
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>Пароль</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    size="md"
                    borderRadius="20px"
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  />
                </FormControl>
              </HStack>
              <FormControl isRequired>
                <FormLabel fontSize="sm" mb={1}>Приоритет</FormLabel>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="1"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm" mb={1}>Макс. подключений</FormLabel>
                <Input
                  type="number"
                  value={formData.maxConnections}
                  onChange={(e) => setFormData({ ...formData, maxConnections: e.target.value })}
                  placeholder="100"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              mr={2} 
              onClick={onClose} 
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              color="white"
              borderRadius="30px"
              px={5}
              py={2}
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              _light={{ bg: "rgba(255, 255, 255, 0.8)", color: "gray.700", border: "1px solid rgba(0, 0, 0, 0.1)", _hover: { bg: "rgba(255, 255, 255, 0.95)" } }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleAddProxy} 
              bg="rgba(102, 126, 234, 0.8)"
              backdropFilter="blur(10px)"
              borderRadius="30px"
              border="1px solid rgba(255, 255, 255, 0.2)"
              px={5}
              py={2}
              color="white"
              boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
              _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
              _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
            >
              Добавить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Proxy Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="4xl">
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
        <ModalContent 
          mx="3"
          bg="rgba(30, 35, 50, 0.95)"
          backdropFilter="blur(20px) saturate(180%)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="30px"
          maxW="900px"
          boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
          _light={{
            bg: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
          }}
        >
          <ModalHeader pt={6} fontSize="lg" fontWeight="bold" color="white" _light={{ color: "gray.900" }}>
            Редактировать прокси
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
          <ModalBody pb={4}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Название</FormLabel>
                <Input
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  placeholder="Имя прокси"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Протокол</FormLabel>
                <Select
                  value={editFormData.protocol}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, protocol: e.target.value })
                  }
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  sx={{
                    option: {
                      bg: "rgba(30, 35, 50, 0.98)",
                      color: "white",
                      _light: { bg: "white", color: "gray.800" }
                    }
                  }}
                >
                  <option value="socks5">SOCKS5</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="vless">VLESS</option>
                  <option value="vmess">VMESS</option>
                  <option value="trojan">Trojan</option>
                  <option value="shadowsocks">Shadowsocks</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Хост</FormLabel>
                <Input
                  value={editFormData.host}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, host: e.target.value })
                  }
                  placeholder="127.0.0.1"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Порт</FormLabel>
                <Input
                  value={editFormData.port}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, port: e.target.value })
                  }
                  placeholder="1080"
                  type="number"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Логин</FormLabel>
                <Input
                  value={editFormData.username}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, username: e.target.value })
                  }
                  placeholder="необязательно"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Пароль</FormLabel>
                <Input
                  value={editFormData.password}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, password: e.target.value })
                  }
                  type="password"
                  placeholder="необязательно"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Приоритет</FormLabel>
                <Input
                  value={editFormData.priority}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, priority: e.target.value })
                  }
                  placeholder="1"
                  type="number"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>Макс. подключений</FormLabel>
                <Input
                  value={editFormData.maxConnections}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, maxConnections: e.target.value })
                  }
                  placeholder="100"
                  type="number"
                  size="md"
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button 
              mr={2} 
              onClick={onEditClose} 
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              color="white"
              borderRadius="30px"
              px={5}
              py={2}
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              _light={{ bg: "rgba(255, 255, 255, 0.8)", color: "gray.700", border: "1px solid rgba(0, 0, 0, 0.1)", _hover: { bg: "rgba(255, 255, 255, 0.95)" } }}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateProxy} 
              bg="rgba(102, 126, 234, 0.8)"
              backdropFilter="blur(10px)"
              borderRadius="30px"
              border="1px solid rgba(255, 255, 255, 0.2)"
              px={5}
              py={2}
              color="white"
              boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
              _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
              _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
            >
              Сохранить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};
