import {
  Box,
  Button,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
  useDisclosure,
  VStack,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  useToast,
  Show,
  Hide,
  Badge,
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { PlusIcon } from "@heroicons/react/24/outline";
import { FC, useEffect, useState } from "react";
import { fetch } from "service/http";

interface Tariff {
  id: number;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  trafficLimit: number;
  unlimitedTraffic: boolean;
  maxConnections: number;
  speedLimit: number;
  enabled: boolean;
}

export const TariffManagement: FC = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    durationDays: 30,
    trafficLimit: 100 * 1024 * 1024 * 1024, // 100GB in bytes
    unlimitedTraffic: false,
    maxConnections: 3,
    speedLimit: 0,
  });

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const data = await fetch("/tariffs/");
      setTariffs(data);
    } catch (error) {
      console.error("Failed to load tariffs:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить список тарифов",
        status: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tariff?: Tariff) => {
    if (tariff) {
      setEditingTariff(tariff);
      setFormData({
        name: tariff.name,
        description: tariff.description,
        price: tariff.price,
        durationDays: tariff.durationDays,
        trafficLimit: tariff.trafficLimit,
        unlimitedTraffic: tariff.unlimitedTraffic,
        maxConnections: tariff.maxConnections,
        speedLimit: tariff.speedLimit,
      });
    } else {
      setEditingTariff(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        unlimitedTraffic: false,
        maxConnections: 3,
        speedLimit: 0,
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingTariff) {
        await fetch(`/tariffs/${editingTariff.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast({
          title: "Тариф обновлён",
          status: "success",
          duration: 2000,
        });
      } else {
        await fetch("/tariffs/", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast({
          title: "Тариф создан",
          status: "success",
          duration: 2000,
        });
      }
      onClose();
      loadTariffs();
    } catch (error) {
      console.error("Failed to save tariff:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить тариф",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот тариф?")) return;
    
    try {
      await fetch(`/tariffs/${id}`, {
        method: "DELETE",
      });
      toast({
        title: "Тариф удалён",
        status: "success",
        duration: 2000,
      });
      loadTariffs();
    } catch (error) {
      console.error("Failed to delete tariff:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить тариф",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/tariffs/${id}/toggle`, {
        method: "POST",
      });
      toast({
        title: "Статус изменён",
        status: "success",
        duration: 2000,
      });
      loadTariffs();
    } catch (error) {
      console.error("Failed to toggle tariff:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус",
        status: "error",
        duration: 3000,
      });
    }
  };

  const formatBytes = (bytes: number, unlimited: boolean = false) => {
    if (unlimited) return "∞";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Загрузка...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="white" _light={{ color: "gray.800" }}>
            Управление тарифами
          </Text>
          <Button
            leftIcon={<Box as={PlusIcon} w={5} h={5} strokeWidth={2} />}
            bg="rgba(102, 126, 234, 0.8)"
            color="white"
            borderRadius="30px"
            border="1px solid rgba(255, 255, 255, 0.2)"
            px={6}
            py={2.5}
            boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
            _light={{
              bg: "rgba(102, 126, 234, 0.9)",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
              _hover: { bg: "rgba(102, 126, 234, 1)" },
            }}
            onClick={() => handleOpenModal()}
          >
            Добавить тариф
          </Button>
        </HStack>

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
            <Table variant="unstyled">
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
                >
                  Название
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Цена
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Срок
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Трафик
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Подключений
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Скорость
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Статус
                </Th>
                <Th 
                  color="rgba(255, 255, 255, 0.7)"
                  fontSize="xs"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  py={3}
                  borderBottom="1px solid rgba(255, 255, 255, 0.1)"
                  _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
                >
                  Действия
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {tariffs.length === 0 ? (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={8}>
                    <Text color="gray.500">Тарифы не найдены</Text>
                  </Td>
                </Tr>
              ) : (
                tariffs.map((tariff) => (
                  <Tr
                    key={tariff.id}
                    transition="all 0.25s ease"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.08)",
                      _light: { bg: "rgba(0, 0, 0, 0.03)" },
                    }}
                    borderBottom="1px solid rgba(255, 255, 255, 0.06)"
                    _light={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
                  >
                    <Td borderBottom={0} pl={4}>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>{tariff.name}</Text>
                        <Text fontSize="xs" color="gray.400" _light={{ color: "gray.500" }}>
                          {tariff.description}
                        </Text>
                      </VStack>
                    </Td>
                    <Td borderBottom={0}>
                      <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>{tariff.price} ₽</Text>
                    </Td>
                    <Td borderBottom={0} color="white" _light={{ color: "gray.800" }}>{tariff.durationDays} дн.</Td>
                    <Td borderBottom={0} color="white" _light={{ color: "gray.800" }}>{formatBytes(tariff.trafficLimit, tariff.unlimitedTraffic)}</Td>
                    <Td borderBottom={0} color="white" _light={{ color: "gray.800" }}>{tariff.maxConnections}</Td>
                    <Td borderBottom={0} color="white" _light={{ color: "gray.800" }}>
                      {tariff.speedLimit === 0
                        ? "Безлимит"
                        : `${tariff.speedLimit} Мбит/с`}
                    </Td>
                    <Td borderBottom={0}>
                      <Switch
                        isChecked={tariff.enabled}
                        onChange={() => handleToggle(tariff.id)}
                        colorScheme="green"
                      />
                    </Td>
                    <Td borderBottom={0}>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit"
                          icon={<EditIcon />}
                          w={{ base: "32px", md: "40px" }}
                          h={{ base: "32px", md: "40px" }}
                          minW="unset"
                          p={0}
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
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                            _hover: { bg: "rgba(255, 255, 255, 0.95)" } 
                          }}
                          onClick={() => handleOpenModal(tariff)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<DeleteIcon />}
                          w={{ base: "32px", md: "40px" }}
                          h={{ base: "32px", md: "40px" }}
                          minW="unset"
                          p={0}
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
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                            _hover: { bg: "rgba(255, 255, 255, 0.95)" } 
                          }}
                          onClick={() => handleDelete(tariff.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
        </Box>
        </Hide>

        {/* Mobile version - Cards */}
        <Show below="md">
          <VStack spacing={4} w="full">
            {tariffs.length === 0 ? (
              <Box
                p={8}
                textAlign="center"
                bg="rgba(255, 255, 255, 0.03)"
                backdropFilter="blur(20px)"
                border="1px solid rgba(255, 255, 255, 0.08)"
                borderRadius="20px"
                _light={{
                  bg: "rgba(255, 255, 255, 0.8)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <Text color="gray.500">Тарифы не найдены</Text>
              </Box>
            ) : (
              tariffs.map((tariff) => (
                <Box
                  key={tariff.id}
                  bg="rgba(255, 255, 255, 0.05)"
                  backdropFilter="blur(20px) saturate(180%)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="20px"
                  p={4}
                  w="full"
                  boxShadow="0 4px 15px rgba(0, 0, 0, 0.2)"
                  _light={{
                    bg: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" fontSize="lg" color="white" _light={{ color: "gray.800" }}>
                          {tariff.name}
                        </Text>
                        <Text fontSize="sm" color="gray.400" _light={{ color: "gray.600" }}>
                          {tariff.description}
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={tariff.enabled}
                        onChange={() => handleToggle(tariff.id)}
                        colorScheme="green"
                      />
                    </HStack>

                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>Цена</Text>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>
                          {tariff.price} ₽
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>Срок</Text>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>
                          {tariff.durationDays} дн.
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>Трафик</Text>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>
                          {formatBytes(tariff.trafficLimit, tariff.unlimitedTraffic)}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>Подключений</Text>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>
                          {tariff.maxConnections}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>Скорость</Text>
                        <Text fontWeight="semibold" color="white" _light={{ color: "gray.800" }}>
                          {tariff.speedLimit === 0 ? "Безлимит" : `${tariff.speedLimit} Мбит/с`}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <HStack spacing={2} justify="flex-end" pt={2}>
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="md"
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
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" },
                        }}
                        onClick={() => handleOpenModal(tariff)}
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="md"
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
                          _hover: { bg: "rgba(255, 255, 255, 0.95)" },
                        }}
                        onClick={() => handleDelete(tariff.id)}
                      />
                    </HStack>
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        </Show>
      </VStack>

      {/* Modal for Add/Edit */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
        <ModalContent
          bg="rgba(30, 41, 59, 0.95)"
          backdropFilter="blur(40px) saturate(180%)"
          border="1px solid rgba(255, 255, 255, 0.08)"
          borderRadius="30px"
          boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
          _light={{
            bg: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.15)",
          }}
        >
          <ModalHeader color="white" _light={{ color: "gray.800" }}>
            {editingTariff ? "Редактировать тариф" : "Добавить тариф"}
          </ModalHeader>
          <ModalCloseButton color="white" _light={{ color: "gray.800" }} />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Название</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Например: Premium"
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
                />
              </FormControl>

              <FormControl>
                <FormLabel>Описание</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Краткое описание тарифа"
                  rows={3}
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
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Цена (₽)</FormLabel>
                  <NumberInput
                    value={formData.price}
                    onChange={(_, value) =>
                      setFormData({ ...formData, price: value })
                    }
                    min={0}
                  >
                    <NumberInputField 
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
                    />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Срок (дней)</FormLabel>
                  <NumberInput
                    value={formData.durationDays}
                    onChange={(_, value) =>
                      setFormData({ ...formData, durationDays: value })
                    }
                    min={1}
                  >
                    <NumberInputField 
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
                    />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Трафик (ГБ)</FormLabel>
                  <NumberInput
                    value={formData.trafficLimit / (1024 * 1024 * 1024)}
                    onChange={(_, value) =>
                      setFormData({
                        ...formData,
                        trafficLimit: value * 1024 * 1024 * 1024,
                      })
                    }
                    min={1}
                    isDisabled={formData.unlimitedTraffic}
                  >
                    <NumberInputField 
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
                    />
                  </NumberInput>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Бесконечный трафик</FormLabel>
                  <Switch
                    isChecked={formData.unlimitedTraffic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unlimitedTraffic: e.target.checked,
                      })
                    }
                    colorScheme="purple"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Макс. подключений</FormLabel>
                  <NumberInput
                    value={formData.maxConnections}
                    onChange={(_, value) =>
                      setFormData({ ...formData, maxConnections: value })
                    }
                    min={1}
                  >
                    <NumberInputField 
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
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Скорость (Мбит/с, 0 = безлимит)</FormLabel>
                  <NumberInput
                    value={formData.speedLimit}
                    onChange={(_, value) =>
                      setFormData({ ...formData, speedLimit: value })
                    }
                    min={0}
                  >
                    <NumberInputField 
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
                    />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              color="white"
              _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
              _light={{ color: "gray.700", _hover: { bg: "rgba(0, 0, 0, 0.05)" } }}
            >
              Отмена
            </Button>
            <Button
              bg="rgba(102, 126, 234, 0.8)"
              color="white"
              borderRadius="20px"
              border="1px solid rgba(255, 255, 255, 0.2)"
              px={6}
              boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"
              _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
              _light={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
              onClick={handleSave}
            >
              {editingTariff ? "Сохранить" : "Создать"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
