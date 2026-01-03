import { 
  Box, 
  BoxProps, 
  chakra,
  HStack, 
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import {
  ChartBarIcon,
  ChartPieIcon,
  UsersIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "contexts/DashboardContext";
import { FC, ReactElement, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "react-query";
import { fetch } from "service/http";
import { formatBytes, numberWithCommas } from "utils/formatByte";

// Chakra-обёртки для иконок
const UsersIconStyled = chakra(UsersIcon, {
  baseStyle: { w: 7, h: 7 },
});
const ChartBarIconStyled = chakra(ChartBarIcon, {
  baseStyle: { w: 7, h: 7 },
});
const CircleStackIconStyled = chakra(CircleStackIcon, {
  baseStyle: { w: 7, h: 7 },
});

type StatisticCardProps = {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
};

const StatisticCard: FC<StatisticCardProps> = ({
  title,
  value,
  subValue,
  icon,
}) => {
  return (
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
        {icon && (
          <Box 
            color="rgba(255, 255, 255, 0.7)"
            _light={{ color: "rgba(0, 0, 0, 0.6)" }}
          >
            {icon}
          </Box>
        )}
        <VStack align="start" spacing={0}>
          <Text 
            fontSize="xs" 
            color="rgba(255, 255, 255, 0.5)"
            _light={{ color: "rgba(0, 0, 0, 0.5)" }}
            fontWeight="medium"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {title}
          </Text>
          <HStack spacing={2} align="baseline">
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              color="white"
              _light={{ color: "gray.900" }}
            >
              {value}
            </Text>
            {subValue && (
              <Text 
                fontSize="xs" 
                color="rgba(255, 255, 255, 0.5)" 
                _light={{ color: "rgba(0, 0, 0, 0.5)" }}
              >
                {subValue}
              </Text>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};
export const StatisticsQueryKey = "statistics-query-key";
export const Statistics: FC<BoxProps> = (props) => {
  const { version } = useDashboard();
  const { data: systemData } = useQuery({
    queryKey: StatisticsQueryKey,
    queryFn: () => fetch("/system"),
    refetchInterval: 5000,
    onSuccess: ({ version: currentVersion }) => {
      if (version !== currentVersion)
        useDashboard.setState({ version: currentVersion });
    },
  });
  const { t } = useTranslation();
  
  return (
    <SimpleGrid 
      columns={{ base: 1, md: 2, lg: 3 }} 
      spacing={3}
      w="full"
      {...props}
    >
      <StatisticCard
        icon={<UsersIconStyled />}
        title={t("activeUsers")}
        value={systemData ? String(numberWithCommas(systemData.users_active)) : "0"}
        subValue={systemData ? `Всего: ${numberWithCommas(systemData.total_user)}` : undefined}
      />
      <StatisticCard
        icon={<ChartBarIconStyled />}
        title={t("dataUsage")}
        value={
          systemData
            ? String(formatBytes(
                systemData.incoming_bandwidth + systemData.outgoing_bandwidth
              ))
            : "0 B"
        }
      />
      <StatisticCard
        icon={<CircleStackIconStyled />}
        title={t("memoryUsage")}
        value={systemData ? String(formatBytes(systemData.mem_used, 1, true)) : "0 B"}
        subValue={systemData ? `Всего: ${formatBytes(systemData.mem_total, 1)}` : undefined}
      />
    </SimpleGrid>
  );
};
