import { Box, Button, HStack, Text, VStack, useColorModeValue, Spinner, IconButton, Tooltip } from "@chakra-ui/react";
import { FC, useEffect, useState } from "react";
import { fetch } from "service/http";
import { useCoreSettings } from "contexts/CoreSettingsContext";
import { ArrowPathIcon, ClockIcon } from "@heroicons/react/24/outline";

interface ConfigHistoryItem {
  id: number;
  created_at: string;
  content: string;
  admin_id?: number;
  note?: string;
}

export const ConfigHistory: FC = () => {
  const [history, setHistory] = useState<ConfigHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { updateConfig } = useCoreSettings();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetch<ConfigHistoryItem[]>("/api/core/config/history");
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRestore = async (content: string) => {
    if (confirm("Вы уверены, что хотите восстановить эту конфигурацию?")) {
        try {
            await updateConfig(content);
            loadHistory(); 
        } catch (e) {
            console.error(e);
        }
    }
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px) saturate(180%)"
      borderRadius="30px"
      border="1px solid rgba(255, 255, 255, 0.08)"
      p={6}
      mt={6}
      _light={{
        bg: "white",
        border: "1px solid",
        borderColor: "gray.200",
        boxShadow: "sm",
      }}
    >
      <HStack justify="space-between" mb={4}>
        <HStack>
            <ClockIcon style={{width: 20}} />
            <Text fontSize="lg" fontWeight="bold">История конфигураций</Text>
        </HStack>
        <IconButton aria-label="Refresh" icon={<ArrowPathIcon style={{width: 20}} />} onClick={loadHistory} size="sm" variant="ghost" />
      </HStack>
      
      <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto" pr={2} css={{
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
      }}>
        {loading && history.length === 0 ? <Spinner /> : history.map(item => (
            <HStack key={item.id} justify="space-between" p={3} bg="rgba(255,255,255,0.05)" borderRadius="xl" _light={{ bg: "gray.50" }}>
                <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">{new Date(item.created_at).toLocaleString()}</Text>
                    <Text fontSize="xs" color="gray.500">{item.note || "Обновление конфигурации"}</Text>
                </VStack>
                <Button size="sm" colorScheme="blue" variant="ghost" onClick={() => handleRestore(item.content)}>Восстановить</Button>
            </HStack>
        ))}
        {!loading && history.length === 0 && <Text color="gray.500">История пуста</Text>}
      </VStack>
    </Box>
  );
};
