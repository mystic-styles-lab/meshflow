import React, { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Badge,
  Progress,
  Button,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { fetch } from "../service/http";

// Telegram Mini App SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
      };
    };
  }
}

interface TelegramUser {
  telegram_id: number;
  username?: string;
  is_linked: boolean;
  vpn_username?: string;
  status?: string;
  used_traffic?: number;
  data_limit?: number;
  expire?: number;
}

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

const StatCard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
  subtitle?: string;
}> = ({ title, value, color = "blue", subtitle }) => {
  return (
    <Box
      bg="white"
      borderRadius="12px"
      p={4}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
    >
      <VStack align="start" spacing={2}>
        <Text fontSize="sm" color="gray.500" fontWeight="medium">
          {title}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color={`${color}.500`}>
          {value}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="gray.500">
            {subtitle}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export const TelegramMiniApp: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);

  useEffect(() => {
    // Инициализация Telegram Mini App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      // Применяем тему Telegram
      if (tg.themeParams.bg_color) {
        document.body.style.backgroundColor = tg.themeParams.bg_color;
      }
    }

    // Авторизация через Telegram
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initDataUnsafe.user) {
      toast({
        title: "Ошибка",
        description: "Откройте приложение через Telegram",
        status: "error",
        duration: 5000,
      });
      setLoading(false);
      return;
    }

    try {
      // Отправляем данные авторизации на сервер
      const authData = {
        id: tg.initDataUnsafe.user.id,
        first_name: tg.initDataUnsafe.user.first_name,
        last_name: tg.initDataUnsafe.user.last_name,
        username: tg.initDataUnsafe.user.username,
        photo_url: tg.initDataUnsafe.user.photo_url,
        auth_date: tg.initDataUnsafe.auth_date,
        hash: tg.initDataUnsafe.hash,
      };

      const response = await fetch("/telegram/auth", {
        method: "POST",
        body: JSON.stringify(authData),
      });

      setTelegramUser(response);

      if (response.is_linked) {
        // Загружаем тарифы
        loadTariffs();
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      toast({
        title: "Ошибка авторизации",
        description: "Не удалось войти в систему",
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTariffs = async () => {
    try {
      const data = await fetch("/tariffs/?enabled_only=true");
      setTariffs(data);
    } catch (error) {
      console.error("Failed to load tariffs:", error);
    }
  };

  const handleBuyTariff = (tariff: Tariff) => {
    setSelectedTariff(tariff);
    const tg = window.Telegram?.WebApp;
    if (tg?.MainButton) {
      tg.MainButton.setText(`Купить за ${tariff.price} ₽`);
      tg.MainButton.show();
      tg.MainButton.onClick(() => {
        // Здесь будет интеграция с платежной системой
        toast({
          title: "Оплата",
          description: "Функция оплаты будет добавлена",
          status: "info",
          duration: 3000,
        });
      });
    }
  };

  const formatBytes = (bytes: number, unlimited: boolean = false) => {
    if (unlimited) return "∞ Бесконечный";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Text>Загрузка...</Text>
      </Box>
    );
  }

  if (!telegramUser) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Ошибка авторизации</Text>
      </Box>
    );
  }

  if (!telegramUser.is_linked) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold">
            Аккаунт не активирован
          </Text>
          <Text color="gray.600" textAlign="center">
            Ваш Telegram ID: <Text as="span" fontWeight="bold">{telegramUser.telegram_id}</Text>
          </Text>
          <Text color="gray.600" textAlign="center">
            Отправьте этот ID администратору для активации доступа
          </Text>
        </VStack>
      </Box>
    );
  }

  const trafficPercent = telegramUser.data_limit
    ? ((telegramUser.used_traffic || 0) / telegramUser.data_limit) * 100
    : 0;
  
  const expireDate = telegramUser.expire
    ? new Date(telegramUser.expire * 1000).toLocaleDateString("ru-RU")
    : "Не указана";

  return (
    <Box p={4} minH="100vh">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Личный кабинет
          </Text>
          <Badge
            colorScheme={telegramUser.status === "active" ? "green" : "red"}
            fontSize="md"
            p={2}
            borderRadius="md"
          >
            {telegramUser.status === "active" ? "Активен" : "Неактивен"}
          </Badge>
        </HStack>

        {/* Stats */}
        <SimpleGrid columns={2} spacing={3}>
          <StatCard
            title="Использовано"
            value={formatBytes(telegramUser.used_traffic || 0)}
            color="blue"
          />
          <StatCard
            title="Лимит"
            value={formatBytes(telegramUser.data_limit || 0)}
            color="green"
          />
        </SimpleGrid>

        {/* Traffic Progress */}
        <Box bg="white" borderRadius="12px" p={4} boxShadow="sm">
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="medium">
                Использование трафика
              </Text>
              <Text fontSize="sm" color="gray.500">
                {trafficPercent.toFixed(1)}%
              </Text>
            </HStack>
            <Progress
              value={trafficPercent}
              colorScheme={
                trafficPercent > 90 ? "red" : trafficPercent > 70 ? "orange" : "green"
              }
              borderRadius="full"
              size="lg"
            />
          </VStack>
        </Box>

        <StatCard
          title="Срок действия"
          value={expireDate}
          color="purple"
        />

        {/* Tariffs */}
        {tariffs.length > 0 && (
          <>
            <Text fontSize="lg" fontWeight="bold" mt={4}>
              Доступные тарифы
            </Text>
            <VStack spacing={3}>
              {tariffs.map((tariff) => (
                <Box
                  key={tariff.id}
                  bg="white"
                  borderRadius="12px"
                  p={4}
                  boxShadow="sm"
                  border="2px solid"
                  borderColor="blue.200"
                  w="full"
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="lg" fontWeight="bold">
                        {tariff.name}
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="blue.500">
                        {tariff.price} ₽
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      {tariff.description}
                    </Text>
                    <SimpleGrid columns={2} spacing={2}>
                      <Text fontSize="xs" color="gray.500">
                        📊 {formatBytes(tariff.trafficLimit, tariff.unlimitedTraffic)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        📅 {tariff.durationDays} дней
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        📱 {tariff.maxConnections} устройств
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ⚡ {tariff.speedLimit === 0 ? "Безлимит" : `${tariff.speedLimit} Мбит/с`}
                      </Text>
                    </SimpleGrid>
                    <Button
                      colorScheme="blue"
                      onClick={() => handleBuyTariff(tariff)}
                      w="full"
                    >
                      Купить
                    </Button>
                  </VStack>
                </Box>
              ))}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
};
