import {
  Box,
  HStack,
  VStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Spinner,
  SimpleGrid,
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
  GlassCard,
  CandyButton,
  CandyBadge,
  GlassStatCard,
  SectionHeader,
} from "../common/GlassComponents";

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
      await loadData(true);
    } catch (error) {
      console.error('Error testing all proxies:', error);
    }
  };

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      
      const proxiesRes = await balancerApi.proxies.getAll();
      const statsRes = await balancerApi.stats.get();
      
      const proxies = Array.isArray(proxiesRes) ? proxiesRes : (proxiesRes.data || []);
      const stats = statsRes.data || statsRes;
      
      setProxyList(proxies);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading data:', error);
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
        position: "top-right",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleDeleteProxy = async (id: number) => {
    if (!window.confirm("Удалить прокси?")) return;
    
    try {
      await balancerApi.proxies.delete(id);
      toast({
        title: "Успешно",
        description: "Прокси удален",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const handleTestProxy = async (id: number) => {
    setTestingProxyId(id.toString());
    try {
      const result = await balancerApi.proxies.test(id);
      toast({
        title: result.healthy ? "Прокси работает" : "Прокси не работает",
        description: result.avgResponseTime 
          ? `Время отклика: ${Math.round(result.avgResponseTime)}ms`
          : "Нет ответа",
        status: result.healthy ? "success" : "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setTestingProxyId(null);
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
      
      toast({
        title: "Успешно",
        description: "Прокси добавлен",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      
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
      
      onClose();
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
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
      priority: proxy.priority.toString(),
      maxConnections: "100",
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
        username: editFormData.username || undefined,
        password: editFormData.password || undefined,
        priority: parseInt(editFormData.priority),
        maxConnections: parseInt(editFormData.maxConnections),
      });
      
      toast({
        title: "Успешно",
        description: "Прокси обновлен",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
      
      onEditClose();
      loadData();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прокси",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const renderProxyRow = (proxy: Proxy) => (
    <Tr
      key={proxy.id}
      transition="all 0.2s"
      _hover={{ 
        bg: "rgba(255, 255, 255, 0.03)",
        transform: "translateX(4px)",
      }}
    >
      <Td py={4}>
        <Switch
          size="md"
          colorScheme="green"
          isChecked={proxy.enabled}
          onChange={() => handleToggleProxy(proxy.id)}
          sx={{
            "span": {
              bg: proxy.enabled 
                ? "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                : "rgba(255, 255, 255, 0.1)",
            }
          }}
        />
      </Td>
      <Td py={4}>
        <VStack align="start" spacing={1}>
          <HStack spacing={2}>
            <Text fontWeight="600" fontSize="md" color="white">
              {proxy.name}
            </Text>
            <CandyBadge candyVariant="info" fontSize="2xs">
              {proxy.protocol.toUpperCase()}
            </CandyBadge>
            <CandyBadge candyVariant="secondary" fontSize="2xs">
              P{proxy.priority}
            </CandyBadge>
          </HStack>
          <Text fontSize="sm" color="whiteAlpha.600">
            {proxy.host}:{proxy.port}
          </Text>
        </VStack>
      </Td>
      <Td py={4}>
        {proxy.healthy ? (
          <HStack spacing={2}>
            <CheckIcon color="green.400" boxSize={4} />
            {proxy.avgResponseTime && (
              <Text 
                fontSize="sm" 
                fontWeight="600"
                color={
                  proxy.avgResponseTime < 100 ? "green.400" :
                  proxy.avgResponseTime < 300 ? "yellow.400" :
                  "red.400"
                }
              >
                {Math.round(proxy.avgResponseTime)}ms
              </Text>
            )}
          </HStack>
        ) : (
          <HStack spacing={2}>
            <CloseIcon color="red.400" boxSize={3} />
            <Text fontSize="sm" color="red.400">Offline</Text>
          </HStack>
        )}
      </Td>
      <Td py={4}>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" fontWeight="600" color="white">
            {proxy.activeConnections} / {proxy.totalConnections}
          </Text>
          {proxy.totalConnections > 0 && (
            <Progress
              value={(proxy.activeConnections / proxy.totalConnections) * 100}
              size="sm"
              bgGradient="linear-gradient(90deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))"
              sx={{
                "& > div": {
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                }
              }}
              borderRadius="full"
              width="100px"
            />
          )}
        </VStack>
      </Td>
      <Td py={4} textAlign="right">
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<HamburgerIcon />}
            variant="ghost"
            size="sm"
            color="white"
            _hover={{ 
              bg: "rgba(102, 126, 234, 0.2)",
              transform: "scale(1.1)",
            }}
            borderRadius="lg"
          />
          <MenuList
            bg="rgba(26, 32, 44, 0.95)"
            backdropFilter="blur(20px)"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="xl"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
          >
            <MenuItem
              icon={<RepeatIcon />}
              onClick={() => handleTestProxy(proxy.id)}
              isDisabled={testingProxyId === proxy.id.toString()}
              bg="transparent"
              color="white"
              _hover={{ bg: "rgba(102, 126, 234, 0.2)" }}
            >
              Проверить
            </MenuItem>
            <MenuItem
              icon={<EditIcon />}
              onClick={() => handleEditProxy(proxy)}
              bg="transparent"
              color="white"
              _hover={{ bg: "rgba(102, 126, 234, 0.2)" }}
            >
              Редактировать
            </MenuItem>
            <MenuItem
              icon={<DeleteIcon />}
              onClick={() => handleDeleteProxy(proxy.id)}
              bg="transparent"
              color="red.400"
              _hover={{ bg: "rgba(255, 107, 107, 0.2)" }}
            >
              Удалить
            </MenuItem>
          </MenuList>
        </Menu>
      </Td>
    </Tr>
  );

  const renderProxyCard = (proxy: Proxy) => (
    <GlassCard key={proxy.id} p={5}>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack spacing={3}>
          <Switch
            size="md"
            colorScheme="green"
            isChecked={proxy.enabled}
            onChange={() => handleToggleProxy(proxy.id)}
          />
          <CandyBadge candyVariant={proxy.enabled ? "success" : "danger"}>
            {proxy.enabled ? "ВКЛ" : "ВЫКЛ"}
          </CandyBadge>
        </HStack>
        <HStack spacing={2}>
          <Tooltip label="Проверить">
            <IconButton
              aria-label="Test"
              icon={<RepeatIcon />}
              size="sm"
              variant="ghost"
              color="white"
              borderRadius="lg"
              onClick={() => handleTestProxy(proxy.id)}
              isLoading={testingProxyId === proxy.id.toString()}
              _hover={{ bg: "rgba(102, 126, 234, 0.2)" }}
            />
          </Tooltip>
          <Tooltip label="Редактировать">
            <IconButton
              aria-label="Edit"
              icon={<EditIcon />}
              size="sm"
              variant="ghost"
              color="white"
              borderRadius="lg"
              onClick={() => handleEditProxy(proxy)}
              _hover={{ bg: "rgba(102, 126, 234, 0.2)" }}
            />
          </Tooltip>
          <Tooltip label="Удалить">
            <IconButton
              aria-label="Delete"
              icon={<DeleteIcon />}
              size="sm"
              variant="ghost"
              color="red.400"
              borderRadius="lg"
              onClick={() => handleDeleteProxy(proxy.id)}
              _hover={{ bg: "rgba(255, 107, 107, 0.2)" }}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold" color="white">
            {proxy.name}
          </Text>
          {proxy.healthy ? (
            <CheckIcon color="green.400" boxSize={4} />
          ) : (
            <CloseIcon color="red.400" boxSize={4} />
          )}
        </HStack>

        <HStack spacing={2}>
          <CandyBadge candyVariant="info">
            {proxy.protocol.toUpperCase()}
          </CandyBadge>
          <CandyBadge candyVariant="secondary">
            P{proxy.priority}
          </CandyBadge>
        </HStack>

        <Text fontSize="md" color="whiteAlpha.700">
          {proxy.host}:{proxy.port}
        </Text>

        <Box 
          mt={2} 
          pt={3} 
          borderTopWidth="1px" 
          borderColor="rgba(255, 255, 255, 0.1)"
        >
          <HStack justify="space-between" fontSize="sm" mb={2}>
            <Text color="whiteAlpha.600">Подключения:</Text>
            <Text fontWeight="600" color="white">
              {proxy.activeConnections || 0} / {proxy.totalConnections || 0}
            </Text>
          </HStack>
          {proxy.totalConnections > 0 && (
            <Progress
              value={(proxy.activeConnections / proxy.totalConnections) * 100}
              size="sm"
              bgGradient="linear-gradient(90deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))"
              sx={{
                "& > div": {
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                }
              }}
              borderRadius="full"
            />
          )}
        </Box>
      </VStack>
    </GlassCard>
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" thickness="4px" />
          <Text color="white" fontSize="lg">Загрузка данных...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box>
      {/* Statistics */}
      {statistics && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <GlassStatCard
            label="Всего прокси"
            value={statistics.totalProxies}
            trend={statistics.activeProxies > 0 ? "up" : "neutral"}
            trendValue={`${statistics.activeProxies} активных`}
          />
          <GlassStatCard
            label="Активные прокси"
            value={statistics.activeProxies}
            trend="up"
          />
          <GlassStatCard
            label="Подключения"
            value={statistics.activeConnections}
            trendValue={`Всего: ${statistics.totalConnections}`}
          />
          <GlassStatCard
            label="Успешность"
            value={`${statistics.successRate?.toFixed(1) || 0}%`}
            trend={
              statistics.successRate >= 90 ? "up" :
              statistics.successRate >= 70 ? "neutral" : "down"
            }
          />
        </SimpleGrid>
      )}

      {/* TCP Proxies Section */}
      <VStack spacing={6} align="stretch" mb={8}>
        <SectionHeader
          title="TCP Прокси"
          subtitle="SOCKS5, HTTP"
          action={
            <HStack spacing={3}>
              <Tooltip label="Обновить">
                <IconButton
                  aria-label="Refresh"
                  icon={<RepeatIcon />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="lg"
                  onClick={() => loadData()}
                  isLoading={refreshing}
                  _hover={{ bg: "rgba(102, 126, 234, 0.2)" }}
                />
              </Tooltip>
              <CandyButton
                leftIcon={<AddIcon />}
                size="sm"
                onClick={onOpen}
              >
                Добавить
              </CandyButton>
            </HStack>
          }
        />

        {/* Desktop Table */}
        <Hide below="md">
          <GlassCard p={0} overflow="hidden">
            <Table variant="unstyled" size="md">
              <Thead bg="rgba(102, 126, 234, 0.1)">
                <Tr>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Статус</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Имя / Адрес</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Здоровье</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Подключения</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase" textAlign="right"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {tcpProxies.length > 0 ? (
                  tcpProxies.map(renderProxyRow)
                ) : (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={8}>
                      <Text color="whiteAlpha.600">Нет TCP прокси</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </GlassCard>
        </Hide>

        {/* Mobile Cards */}
        <Show below="md">
          <SimpleGrid columns={1} spacing={4}>
            {tcpProxies.length > 0 ? (
              tcpProxies.map(renderProxyCard)
            ) : (
              <GlassCard p={8}>
                <Text color="whiteAlpha.600" textAlign="center">Нет TCP прокси</Text>
              </GlassCard>
            )}
          </SimpleGrid>
        </Show>
      </VStack>

      {/* UDP Proxies Section */}
      <VStack spacing={6} align="stretch">
        <SectionHeader
          title="UDP Прокси"
          subtitle="Shadowsocks, VLESS, VMESS"
        />

        {/* Desktop Table */}
        <Hide below="md">
          <GlassCard p={0} overflow="hidden">
            <Table variant="unstyled" size="md">
              <Thead bg="rgba(118, 75, 162, 0.1)">
                <Tr>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Статус</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Имя / Адрес</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Здоровье</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">Подключения</Th>
                  <Th color="whiteAlpha.700" fontSize="xs" textTransform="uppercase" textAlign="right"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {udpProxies.length > 0 ? (
                  udpProxies.map(renderProxyRow)
                ) : (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={8}>
                      <Text color="whiteAlpha.600">Нет UDP прокси</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </GlassCard>
        </Hide>

        {/* Mobile Cards */}
        <Show below="md">
          <SimpleGrid columns={1} spacing={4}>
            {udpProxies.length > 0 ? (
              udpProxies.map(renderProxyCard)
            ) : (
              <GlassCard p={8}>
                <Text color="whiteAlpha.600" textAlign="center">Нет UDP прокси</Text>
              </GlassCard>
            )}
          </SimpleGrid>
        </Show>
      </VStack>

      {/* Add Proxy Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.7)" />
        <ModalContent
          bg="rgba(26, 32, 44, 0.95)"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.1)"
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.5)"
        >
          <ModalHeader color="white" fontSize="xl" fontWeight="bold">
            Добавить прокси
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "rgba(255, 255, 255, 0.1)" }} />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="whiteAlpha.700">Название</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Мой прокси"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                  _focus={{ 
                    borderColor: "rgba(102, 126, 234, 0.8)",
                    boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                  }}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="whiteAlpha.700">Протокол</FormLabel>
                <Select
                  value={formData.protocol}
                  onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                >
                  <option value="socks5" style={{ background: "#1a202c" }}>SOCKS5</option>
                  <option value="http" style={{ background: "#1a202c" }}>HTTP</option>
                  <option value="https" style={{ background: "#1a202c" }}>HTTPS</option>
                  <option value="shadowsocks" style={{ background: "#1a202c" }}>Shadowsocks</option>
                  <option value="vless" style={{ background: "#1a202c" }}>VLESS</option>
                </Select>
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Хост</FormLabel>
                  <Input
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="127.0.0.1"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Порт</FormLabel>
                  <Input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    placeholder="1080"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Логин</FormLabel>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Пароль</FormLabel>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Приоритет</FormLabel>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    placeholder="1"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Макс. подключений</FormLabel>
                  <Input
                    type="number"
                    value={formData.maxConnections}
                    onChange={(e) => setFormData({ ...formData, maxConnections: e.target.value })}
                    placeholder="100"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <CandyButton
                candyVariant="danger"
                size="sm"
                onClick={onClose}
              >
                Отмена
              </CandyButton>
              <CandyButton
                candyVariant="primary"
                size="sm"
                onClick={handleAddProxy}
              >
                Добавить
              </CandyButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Proxy Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl" isCentered>
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.7)" />
        <ModalContent
          bg="rgba(26, 32, 44, 0.95)"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.1)"
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.5)"
        >
          <ModalHeader color="white" fontSize="xl" fontWeight="bold">
            Редактировать прокси
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "rgba(255, 255, 255, 0.1)" }} />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="whiteAlpha.700">Название</FormLabel>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Мой прокси"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                  _focus={{ 
                    borderColor: "rgba(102, 126, 234, 0.8)",
                    boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                  }}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel fontSize="sm" color="whiteAlpha.700">Протокол</FormLabel>
                <Select
                  value={editFormData.protocol}
                  onChange={(e) => setEditFormData({ ...editFormData, protocol: e.target.value })}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                >
                  <option value="socks5" style={{ background: "#1a202c" }}>SOCKS5</option>
                  <option value="http" style={{ background: "#1a202c" }}>HTTP</option>
                  <option value="https" style={{ background: "#1a202c" }}>HTTPS</option>
                  <option value="shadowsocks" style={{ background: "#1a202c" }}>Shadowsocks</option>
                  <option value="vless" style={{ background: "#1a202c" }}>VLESS</option>
                </Select>
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Хост</FormLabel>
                  <Input
                    value={editFormData.host}
                    onChange={(e) => setEditFormData({ ...editFormData, host: e.target.value })}
                    placeholder="127.0.0.1"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Порт</FormLabel>
                  <Input
                    type="number"
                    value={editFormData.port}
                    onChange={(e) => setEditFormData({ ...editFormData, port: e.target.value })}
                    placeholder="1080"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Логин</FormLabel>
                  <Input
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Пароль</FormLabel>
                  <Input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="необязательно"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Приоритет</FormLabel>
                  <Input
                    type="number"
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    placeholder="1"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="whiteAlpha.700">Макс. подключений</FormLabel>
                  <Input
                    type="number"
                    value={editFormData.maxConnections}
                    onChange={(e) => setEditFormData({ ...editFormData, maxConnections: e.target.value })}
                    placeholder="100"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    _hover={{ borderColor: "rgba(102, 126, 234, 0.5)" }}
                    _focus={{ 
                      borderColor: "rgba(102, 126, 234, 0.8)",
                      boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.8)",
                    }}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <CandyButton
                candyVariant="danger"
                size="sm"
                onClick={onEditClose}
              >
                Отмена
              </CandyButton>
              <CandyButton
                candyVariant="primary"
                size="sm"
                onClick={handleUpdateProxy}
              >
                Сохранить
              </CandyButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
