import {
  Alert,
  AlertDescription,
  Badge,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { GlassCard, CandyButton } from "./common/GlassComponents";
import {
  EyeIcon,
  EyeSlashIcon,
  PlusIcon as HeroIconPlusIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FetchNodesQueryKey,
  getNodeDefaultValues,
  NodeSchema,
  NodeType,
  useNodes,
  useNodesQuery,
} from "contexts/NodesContext";
import { FC, useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { PencilIcon, TrashIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import {
  UseMutateFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { Status } from "types/User";
import {
  generateErrorMessage,
  generateSuccessMessage,
} from "utils/toastHandler";
import { DeleteNodeModal } from "./DeleteNodeModal";
import { DeleteIcon } from "./DeleteUserModal";
import { ReloadIcon } from "./Filters";
import { Icon } from "./Icon";
import { NodeModalStatusBadge } from "./NodeModalStatusBadge";

import { fetch } from "service/http";

// NodeModal Component
const NodeModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  node?: NodeType; // If null, it's add mode
}> = ({ isOpen, onClose, node }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { addNode, updateNode } = useNodes();
  
  const isEdit = !!node;

  const form = useForm<NodeType>({
    resolver: zodResolver(NodeSchema),
    defaultValues: node || { ...getNodeDefaultValues(), add_as_new_host: false },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(node || { ...getNodeDefaultValues(), add_as_new_host: false });
    }
  }, [isOpen, node, form]);

  const mutation = useMutation(isEdit ? updateNode : addNode, {
    onSuccess: () => {
      generateSuccessMessage(
        isEdit ? "Node updated successfully" : t("nodes.addNodeSuccess", { name: form.getValues("name") }),
        toast
      );
      queryClient.invalidateQueries(FetchNodesQueryKey);
      onClose();
    },
    onError: (e) => {
      generateErrorMessage(e, toast, form);
    },
  });

  const { data: nodeSettings } = useQuery({
    queryKey: "node-settings",
    queryFn: () =>
      fetch<{
        min_node_version: string;
        certificate: string;
      }>("/node/settings"),
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent
        bg="rgba(23, 25, 35, 0.85)"
        backdropFilter="blur(16px)"
        border="1px solid rgba(255, 255, 255, 0.1)"
        boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        borderRadius="24px"
        color="white"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.1)">
          {isEdit ? "Редактировать узел" : "Добавить узел"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Certificate Alert if needed */}
            
            <FormControl isRequired>
              <FormLabel>Название</FormLabel>
              <Input
                {...form.register("name")}
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid rgba(255, 255, 255, 0.1)"
                borderRadius="xl"
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
              />
            </FormControl>

            <HStack width="100%">
              <FormControl isRequired>
                <FormLabel>Адрес</FormLabel>
                <Input
                  {...form.register("address")}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Порт</FormLabel>
                <Input
                  {...form.register("port")}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
            </HStack>

            <HStack width="100%">
              <FormControl isRequired>
                <FormLabel>API Порт</FormLabel>
                <Input
                  {...form.register("api_port")}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Коэффициент использования</FormLabel>
                <Input
                  {...form.register("usage_coefficient")}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="xl"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
              </FormControl>
            </HStack>

            {!isEdit && (
              <FormControl>
                <Checkbox {...form.register("add_as_new_host")}>
                  Добавить как новый хост для всех входящих
                </Checkbox>
              </FormControl>
            )}
            
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">
                Статус
              </FormLabel>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    colorScheme="green"
                    isChecked={field.value !== "disabled"}
                    onChange={(e) => field.onChange(e.target.checked ? "connecting" : "disabled")}
                  />
                )}
              />
            </FormControl>

          </VStack>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(255, 255, 255, 0.1)">
          <Button variant="ghost" mr={3} onClick={onClose} color="whiteAlpha.700">
            Отмена
          </Button>
          <CandyButton
            candyVariant="primary"
            onClick={form.handleSubmit((d) => mutation.mutate(d))}
            isLoading={mutation.isLoading}
          >
            Сохранить
          </CandyButton>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// NodeCard Component
const NodeCard: FC<{
  node: NodeType;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ node, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const { reconnectNode } = useNodes();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { isLoading: isReconnecting, mutate: reconnect } = useMutation(
    () => reconnectNode(node),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(FetchNodesQueryKey);
        toast({ title: "Reconnected", status: "success" });
      },
    }
  );

  const nodeStatus: Status = isReconnecting
    ? "connecting"
    : node.status
    ? node.status
    : "error";

  return (
    <GlassCard p={5} display="flex" flexDirection="column" h="full" position="relative">
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
          {node.name}
        </Text>
        <NodeModalStatusBadge status={nodeStatus} compact />
      </HStack>

      <VStack align="start" spacing={2} flex={1} mb={4}>
        <HStack>
          <Badge fontSize="xs" colorScheme="purple">Addr</Badge>
          <Text fontSize="sm" fontFamily="mono">{node.address}</Text>
        </HStack>
        <HStack>
          <Badge fontSize="xs" colorScheme="blue">Port</Badge>
          <Text fontSize="sm" fontFamily="mono">{node.port}</Text>
        </HStack>
        <HStack>
          <Badge fontSize="xs" colorScheme="green">Ver</Badge>
          <Text fontSize="sm" fontFamily="mono">{node.xray_version || "Unknown"}</Text>
        </HStack>
      </VStack>

      <HStack spacing={2} mt="auto" justify="flex-end">
        <Tooltip label="Переподключить">
          <IconButton
            aria-label="reconnect"
            size="sm"
            icon={<ArrowPathIcon style={{ width: '16px' }} />}
            onClick={() => reconnect()}
            isLoading={isReconnecting}
            variant="ghost"
            color="white"
            bg="rgba(255, 255, 255, 0.1)"
            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          />
        </Tooltip>
        <Tooltip label="Удалить">
          <IconButton
            aria-label="delete"
            size="sm"
            icon={<TrashIcon style={{ width: '16px' }} />}
            onClick={onDelete}
            variant="ghost"
            color="white"
            bg="rgba(255, 255, 255, 0.1)"
            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
          />
        </Tooltip>
        <IconButton
          aria-label="edit"
          size="sm"
          icon={<PencilIcon style={{ width: '16px' }} />}
            onClick={onEdit}
            variant="ghost"
            color="white"
            bg="rgba(255, 255, 255, 0.1)"
            _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
        />
      </HStack>
    </GlassCard>
  );
};

export const Nodes: FC = () => {
  const { t } = useTranslation();
  const { data: nodes, isLoading } = useNodesQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingNode, setEditingNode] = useState<NodeType | undefined>(undefined);
  const { setDeletingNode } = useNodes();

  const handleAdd = () => {
    setEditingNode(undefined);
    onOpen();
  };

  const handleEdit = (node: NodeType) => {
    setEditingNode(node);
    onOpen();
  };

  return (
    <Box maxW="1400px" mx="auto">
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {nodes?.map((node) => (
            <NodeCard
              key={node.id || node.name}
              node={node}
              onEdit={() => handleEdit(node)}
              onDelete={() => setDeletingNode(node)}
            />
          ))}
          
          <GlassCard
            p={5}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            h="200px"
            cursor="pointer"
            onClick={handleAdd}
            transition="all 0.2s"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            borderStyle="dashed"
            bg="rgba(255, 255, 255, 0.05)"
          >
            <VStack spacing={3}>
              <Box
                p={3}
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.1)"
                color="white"
              >
                <PlusIcon style={{ width: '24px' }} />
              </Box>
              <Text fontWeight="bold">Добавить узел</Text>
            </VStack>
          </GlassCard>
        </SimpleGrid>
      )}

      <NodeModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingNode(undefined);
        }}
        node={editingNode}
      />
      
      <DeleteNodeModal deleteCallback={() => {}} />
    </Box>
  );
};
