import {
  Box,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { fetch } from "service/http";
import { GlassCard, GlassStatCard } from "./common/GlassComponents";
import { glassTheme } from "../theme/glassTheme";

const StatCard: FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}> = ({ title, value, subtitle, icon }) => {
  return (
    <GlassCard
      variant="default"
      elevated
      p={6}
      transition="all 0.3s ease"
      cursor="default"
    >
      <VStack align="start" spacing={3}>
        {icon && (
          <Text fontSize="2xl" mb={-2}>
            {icon}
          </Text>
        )}
        <Text 
          fontSize="sm" 
          color="rgba(255, 255, 255, 0.5)"
          _light={{ color: "rgba(0, 0, 0, 0.5)" }}
          fontWeight="medium"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {title}
        </Text>
        <Text 
          fontSize="3xl" 
          fontWeight="bold" 
          color="white"
          _light={{ color: "gray.900" }}
        >
          {value}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" _light={{ color: "rgba(0, 0, 0, 0.6)" }}>
            {subtitle}
          </Text>
        )}
      </VStack>
    </GlassCard>
  );
};

export const UserCabinet: FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const info = await fetch("/user-cabinet/info");
      setUserInfo(info);
    } catch (error) {
      console.error("Failed to load user cabinet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (loading || !userInfo) {
    return (
      <Box p={6}>
        <GlassCard
          variant="default"
          borderRadius="20px"
          p={8}
          textAlign="center"
        >
          <Text color="white">Загрузка...</Text>
        </GlassCard>
      </Box>
    );
  }

  const trafficPercent = (userInfo.trafficUsed / userInfo.tariff.trafficLimit) * 100;
  const daysLeft = Math.ceil(
    (new Date(userInfo.subscriptionExpiry).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Box p={6} minH="100vh">
      <VStack spacing={6} align="stretch" maxW="1200px" mx="auto">
        {/* Header */}
        <GlassCard
          variant="default"
          elevated
          borderRadius="30px"
          p={6}
          overflow="hidden"
          position="relative"
        >
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Text 
                fontSize="3xl" 
                fontWeight="bold"
                color="white"
                _light={{ color: "gray.900" }}
              >
                Личный кабинет
              </Text>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.7)" }}>
                {userInfo.username}
              </Text>
            </VStack>
            <Badge
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
              bg={userInfo.isActive 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)'
              }
              color={userInfo.isActive 
                ? '#10b981' 
                : '#ef4444'
              }
              border="1px solid"
              borderColor={userInfo.isActive 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'
              }
            >
              {userInfo.isActive ? "✓ Активен" : "✗ Неактивен"}
            </Badge>
          </HStack>
        </GlassCard>

        {/* Tariff Info */}
        <GlassCard
          variant="accent"
          elevated
          borderRadius="30px"
          p={8}
          position="relative"
          overflow="hidden"
          border="2px solid"
          borderColor="rgba(102, 126, 234, 0.3)"
          _before={{
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'rgba(102, 126, 234, 0.1)',
            opacity: 1,
            borderRadius: '30px',
            zIndex: -1,
          }}
        >
          <VStack align="stretch" spacing={5}>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text fontSize="2xl">💎</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="white" _light={{ color: "gray.900" }}>
                    {userInfo.tariff.name}
                  </Text>
                </HStack>
                <Text fontSize="md" color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.7)" }}>
                  {userInfo.tariff.description}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text 
                  fontSize="4xl" 
                  fontWeight="bold"
                  color="white"
                  _light={{ color: "gray.900" }}
                >
                  {userInfo.tariff.price} ₽
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.5)" _light={{ color: "rgba(0, 0, 0, 0.5)" }}>
                  за {userInfo.tariff.durationDays} дней
                </Text>
              </VStack>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="30px"
                p={4}
                border="1px solid rgba(255, 255, 255, 0.1)"
                transition="all 0.3s ease"
                _light={{ bg: "rgba(0, 0, 0, 0.03)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  _light: { bg: "rgba(0, 0, 0, 0.05)" },
                }}
              >
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)" _light={{ color: "rgba(0, 0, 0, 0.5)" }} mb={2}>
                  📊 Трафик
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="white" _light={{ color: "gray.900" }}>
                  {formatBytes(userInfo.tariff.trafficLimit)}
                </Text>
              </Box>
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="30px"
                p={4}
                border="1px solid rgba(255, 255, 255, 0.1)"
                transition="all 0.3s ease"
                _light={{ bg: "rgba(0, 0, 0, 0.03)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  _light: { bg: "rgba(0, 0, 0, 0.05)" },
                }}
              >
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)" _light={{ color: "rgba(0, 0, 0, 0.5)" }} mb={2}>
                  📱 Подключения
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="white" _light={{ color: "gray.900" }}>
                  До {userInfo.tariff.maxConnections} устройств
                </Text>
              </Box>
              <Box
                bg="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                borderRadius="30px"
                p={4}
                border="1px solid rgba(255, 255, 255, 0.1)"
                transition="all 0.3s ease"
                _light={{ bg: "rgba(0, 0, 0, 0.03)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
                _hover={{
                  bg: "rgba(255, 255, 255, 0.08)",
                  _light: { bg: "rgba(0, 0, 0, 0.05)" },
                }}
              >
                <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)" _light={{ color: "rgba(0, 0, 0, 0.5)" }} mb={2}>
                  ⚡ Скорость
                </Text>
                <Text fontSize="lg" fontWeight="semibold" color="white" _light={{ color: "gray.900" }}>
                  {userInfo.tariff.speedLimit === 0 
                    ? "Безлимит" 
                    : `${userInfo.tariff.speedLimit} Мбит/с`}
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </GlassCard>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <StatCard
            icon="📈"
            title="Использовано трафика"
            value={formatBytes(userInfo.trafficUsed)}
            subtitle={`из ${formatBytes(userInfo.tariff.trafficLimit)}`}
          />
          <StatCard
            icon="📅"
            title="Подписка действует"
            value={new Date(userInfo.subscriptionExpiry).toLocaleDateString('ru-RU')}
            subtitle={`Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`}
          />
          <StatCard
            icon="🗓️"
            title="Аккаунт создан"
            value={new Date(userInfo.createdAt).toLocaleDateString('ru-RU')}
            subtitle={`${Math.ceil((Date.now() - new Date(userInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24))} дней назад`}
          />
        </SimpleGrid>

        {/* Traffic Progress */}
        <GlassCard
          variant="default"
          elevated
          borderRadius="30px"
          p={6}
        >
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <HStack>
                <Text fontSize="xl">📊</Text>
                <Text 
                  fontSize="lg" 
                  fontWeight="semibold"
                  color="white"
                  _light={{ color: "gray.900" }}
                >
                  Использование трафика
                </Text>
              </HStack>
              <Text 
                fontSize="2xl" 
                fontWeight="bold"
                color={
                  trafficPercent > 90 
                    ? '#ef4444'
                    : trafficPercent > 70 
                    ? '#f59e0b'
                    : '#10b981'
                }
              >
                {trafficPercent.toFixed(1)}%
              </Text>
            </HStack>
            
            <Box position="relative">
              <Box
                height="24px"
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.05)"
                overflow="hidden"
                border="1px solid rgba(255, 255, 255, 0.1)"
              >
                <Box
                  height="100%"
                  width={`${Math.min(trafficPercent, 100)}%`}
                  bg={
                    trafficPercent > 90 
                      ? '#ef4444'
                      : trafficPercent > 70 
                      ? '#f59e0b'
                      : '#10b981'
                  }
                  transition="width 0.5s ease"
                  position="relative"
                />
              </Box>
            </Box>
            
            <HStack justify="space-between" px={2}>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.7)" }}>
                {formatBytes(userInfo.trafficUsed)} использовано
              </Text>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" _light={{ color: "rgba(0, 0, 0, 0.7)" }}>
                {formatBytes(userInfo.tariff.trafficLimit - userInfo.trafficUsed)} осталось
              </Text>
            </HStack>
          </VStack>
        </GlassCard>
      </VStack>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Box>
  );
};
