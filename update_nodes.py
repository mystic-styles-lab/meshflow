
import os

content = r'''import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  ButtonProps,
  chakra,
  Checkbox,
  Collapse,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Switch,
  Text,
  Tooltip,
  useColorModeValue,
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
  PencilIcon,
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
import { FC, ReactNode, useEffect, useState } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
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
import { Input } from "./Input";

const CustomInput = chakra(Input, {
  baseStyle: {
    bg: "white",
    _dark: {
      bg: "gray.700",
    },
  },
});

const PlusIcon = chakra(HeroIconPlusIcon, {
  baseStyle: {
    w: 6,
    h: 6,
    strokeWidth: 2,
  },
});

const EditIcon = chakra(PencilIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

type NodeFormType = FC<{
  form: UseFormReturn<NodeType>;
  mutate: UseMutateFunction<unknown, unknown, any>;
  isLoading: boolean;
  submitBtnText: string;
  btnProps?: Partial<ButtonProps>;
  btnLeftAdornment?: ReactNode;
  addAsHost?: boolean;
}>;

const NodeForm: NodeFormType = ({
  form,
  mutate,
  isLoading,
  submitBtnText,
  btnProps = {},
  btnLeftAdornment,
  addAsHost = false,
}) => {
  const { t } = useTranslation();
  const [showCertificate, setShowCertificate] = useState(false);
  const { data: nodeSettings, isLoading: nodeSettingsLoading } = useQuery({
    queryKey: "node-settings",
    queryFn: () =>
      fetch<{
        min_node_version: string;
        certificate: string;
      }>("/node/settings"),
  });
  function selectText(node: HTMLElement) {
    // @ts-ignore
    if (document.body.createTextRange) {
      // @ts-ignore
      const range = document.body.createTextRange();
      range.moveToElementText(node);
      range.select();
    } else if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection!.removeAllRanges();
      selection!.addRange(range);
    } else {
      console.warn("Could not select text in node: Unsupported browser.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit((v) => mutate(v))}>
      <VStack spacing={4}>
        {nodeSettings && nodeSettings.certificate && (
          <Alert status="info" alignItems="start" borderRadius="md">
            <AlertDescription
              display="flex"
              flexDirection="column"
              overflow="hidden"
              w="full"
            >
              <Text fontSize="sm" mb={2}>{t("nodes.connection-hint")}</Text>
              <HStack justify="end" py={2}>
                <Button
                  as="a"
                  size="xs"
                  download="ssl_client_cert.pem"
                  href={URL.createObjectURL(
                    new Blob([nodeSettings.certificate], { type: "text/plain" })
                  )}
                  bg="rgba(102, 126, 234, 0.8)"
                  color="white"
                  borderRadius="20px"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  px={4}
                  boxShadow="0 2px 8px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 4px 12px rgba(102, 126, 234, 0.5)" }}
                  _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
                >
                  {t("nodes.download-certificate")}
                </Button>
                <Tooltip
                  placement="top"
                  label={t(
                    !showCertificate
                      ? "nodes.show-certificate"
                      : "nodes.show-certificate"
                  )}
                >
                  <IconButton
                    aria-label={t(
                      !showCertificate
                        ? "nodes.show-certificate"
                        : "nodes.show-certificate"
                    )}
                    onClick={setShowCertificate.bind(null, !showCertificate)}
                    size="xs"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    borderRadius="full"
                    boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                    _light={{ bg: "rgba(255, 255, 255, 0.8)", color: "gray.700", border: "1px solid rgba(0, 0, 0, 0.1)", _hover: { bg: "rgba(255, 255, 255, 0.95)" } }}
                  >
                    {!showCertificate ? (
                      <EyeIcon width="15px" />
                    ) : (
                      <EyeSlashIcon width="15px" />
                    )}
                  </IconButton>
                </Tooltip>
              </HStack>
              <Collapse in={showCertificate} animateOpacity>
                <Text
                  bg="rgba(255,255,255,.5)"
                  _dark={{
                    bg: "rgba(255,255,255,.2)",
                  }}
                  rounded="md"
                  p="2"
                  lineHeight="1.2"
                  fontSize="10px"
                  fontFamily="Courier"
                  whiteSpace="pre"
                  overflow="auto"
                  onClick={(e) => {
                    selectText(e.target as HTMLElement);
                  }}
                >
                  {nodeSettings.certificate}
                </Text>
              </Collapse>
            </AlertDescription>
          </Alert>
        )}

        <HStack w="full" spacing={4}>
          <FormControl flex={1}>
            <CustomInput
              label={t("nodes.nodeName")}
              size="sm"
              placeholder="Marzban-S2"
              {...form.register("name")}
              error={form.formState?.errors?.name?.message}
            />
          </FormControl>
          <HStack px={1} pt={6}>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => {
                return (
                  <Tooltip
                    key={field.value}
                    placement="top"
                    label={
                      `${t("usersTable.status")}: ` +
                      (field.value !== "disabled" ? t("active") : t("disabled"))
                    }
                    textTransform="capitalize"
                  >
                    <Box>
                      <Switch
                        colorScheme="primary"
                        isChecked={field.value !== "disabled"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            field.onChange("connecting");
                          } else {
                            field.onChange("disabled");
                          }
                        }}
                      />
                    </Box>
                  </Tooltip>
                );
              }}
            />
          </HStack>
        </HStack>
        <HStack alignItems="flex-start" w="100%" spacing={4}>
          <Box w="100%">
            <CustomInput
              label={t("nodes.nodeAddress")}
              size="sm"
              placeholder="51.20.12.13"
              {...form.register("address")}
              error={form.formState?.errors?.address?.message}
            />
          </Box>
        </HStack>
        <HStack alignItems="flex-start" w="100%" spacing={4}>
          <Box flex={1}>
            <CustomInput
              label={t("nodes.nodePort")}
              size="sm"
              placeholder="62050"
              {...form.register("port")}
              error={form.formState?.errors?.port?.message}
            />
          </Box>
          <Box flex={1}>
            <CustomInput
              label={t("nodes.nodeAPIPort")}
              size="sm"
              placeholder="62051"
              {...form.register("api_port")}
              error={form.formState?.errors?.api_port?.message}
            />
          </Box>
          <Box flex={1}>
            <CustomInput
              label={t("nodes.usageCoefficient")}
              size="sm"
              placeholder="1"
              {...form.register("usage_coefficient")}
              error={form.formState?.errors?.usage_coefficient?.message}
            />
          </Box>
        </HStack>
        {addAsHost && (
          <FormControl py={1}>
            <Checkbox {...form.register("add_as_new_host")}>
              <FormLabel m={0}>{t("nodes.addHostForEveryInbound")}</FormLabel>
            </Checkbox>
          </FormControl>
        )}
        <HStack w="full" pt={4}>
          {btnLeftAdornment}
          <CandyButton
            flexGrow={1}
            type="submit"
            size="sm"
            px={5}
            w="full"
            isLoading={isLoading}
            candyVariant="primary"
            {...btnProps}
          >
            {submitBtnText}
          </CandyButton>
        </HStack>
      </VStack>
    </form>
  );
};

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node?: NodeType | null;
}

const NodeModal: FC<NodeModalProps> = ({ isOpen, onClose, node }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { addNode, updateNode, setDeletingNode } = useNodes();

  const isEdit = !!node;

  const form = useForm<NodeType>({
    resolver: zodResolver(NodeSchema),
    defaultValues: isEdit ? node : {
      ...getNodeDefaultValues(),
      add_as_new_host: false,
    },
  });

  // Reset form when node changes or modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset(isEdit ? node : {
        ...getNodeDefaultValues(),
        add_as_new_host: false,
      });
    }
  }, [isOpen, node, isEdit, form]);

  const mutationFn = isEdit ? updateNode : addNode;

  const { isLoading, mutate } = useMutation(mutationFn, {
    onSuccess: () => {
      generateSuccessMessage(
        isEdit 
          ? "Node updated successfully" 
          : t("nodes.addNodeSuccess", { name: form.getValues("name") }),
        toast
      );
      queryClient.invalidateQueries(FetchNodesQueryKey);
      onClose();
    },
    onError: (e) => {
      generateErrorMessage(e, toast, form);
    },
  });

  const handleDeleteNode = () => {
    if (node) {
      setDeletingNode(node);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent 
        bg="rgba(255, 255, 255, 0.8)" 
        backdropFilter="blur(20px)" 
        _dark={{ bg: "rgba(26, 32, 44, 0.8)" }}
        borderRadius="2xl"
        boxShadow="xl"
      >
        <ModalHeader>
          {isEdit ? t("nodes.editNode") : t("nodes.addNewMarzbanNode")}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <NodeForm
            form={form}
            mutate={mutate}
            isLoading={isLoading}
            submitBtnText={isEdit ? t("nodes.editNode") : t("nodes.addNode")}
            btnLeftAdornment={isEdit && (
              <Tooltip label={t("delete")} placement="top">
                <IconButton
                  size="sm"
                  aria-label="delete node"
                  onClick={handleDeleteNode}
                  bg="rgba(220, 38, 38, 0.8)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="white"
                  borderRadius="full"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  _hover={{ bg: "rgba(220, 38, 38, 0.9)" }}
                  _light={{ bg: "rgba(220, 38, 38, 0.9)", _hover: { bg: "rgba(220, 38, 38, 1)" } }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const NodeCard: FC<{ node: NodeType; onEdit: (node: NodeType) => void }> = ({ node, onEdit }) => {
  const { t } = useTranslation();
  const { reconnectNode } = useNodes();
  const queryClient = useQueryClient();
  
  const { isLoading: isReconnecting, mutate: reconnect } = useMutation(
    reconnectNode.bind(null, node),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(FetchNodesQueryKey);
      },
    }
  );

  const nodeStatus: Status = isReconnecting
    ? "connecting"
    : node.status
    ? node.status
    : "error";

  return (
    <GlassCard p={5} display="flex" flexDirection="column" h="full">
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
          {node.name}
        </Text>
        <NodeModalStatusBadge status={nodeStatus} compact />
      </HStack>

      <VStack align="start" spacing={2} flex={1} mb={4}>
        <HStack>
          <Badge fontSize="xs" colorScheme="purple">IP</Badge>
          <Text fontSize="sm" fontFamily="mono">{node.address}</Text>
        </HStack>
        <HStack>
          <Badge fontSize="xs" colorScheme="blue">Port</Badge>
          <Text fontSize="sm" fontFamily="mono">{node.port}</Text>
        </HStack>
        {node.xray_version && (
          <HStack>
            <Badge fontSize="xs" colorScheme="green">Xray</Badge>
            <Text fontSize="sm">{node.xray_version}</Text>
          </HStack>
        )}
        {nodeStatus === "error" && (
          <Alert status="error" size="xs" borderRadius="md" mt={2}>
            <AlertIcon />
            <Text fontSize="xs" noOfLines={2}>{node.message}</Text>
          </Alert>
        )}
      </VStack>

      <HStack spacing={2} mt="auto">
        <Button
          size="sm"
          flex={1}
          leftIcon={<ReloadIcon />}
          onClick={() => reconnect()}
          isLoading={isReconnecting}
          variant="outline"
          colorScheme="blue"
          fontSize="xs"
        >
          {t("nodes.reconnect")}
        </Button>
        <Button
          size="sm"
          flex={1}
          leftIcon={<EditIcon />}
          onClick={() => onEdit(node)}
          variant="solid"
          colorScheme="gray"
          bg="whiteAlpha.200"
          _hover={{ bg: "whiteAlpha.300" }}
          _light={{ bg: "blackAlpha.100", _hover: { bg: "blackAlpha.200" } }}
          fontSize="xs"
        >
          {t("edit")}
        </Button>
      </HStack>
    </GlassCard>
  );
};

const AddNodeCard: FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <GlassCard 
      p={5} 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      h="full" 
      minH="200px"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
      borderStyle="dashed"
      bg="transparent"
    >
      <Box 
        p={4} 
        borderRadius="full" 
        bg="whiteAlpha.100" 
        _light={{ bg: "blackAlpha.50" }}
        mb={3}
      >
        <PlusIcon />
      </Box>
      <Text fontWeight="medium">{t("nodes.addNewMarzbanNode")}</Text>
    </GlassCard>
  );
};

export const Nodes: FC = () => {
  const { t } = useTranslation();
  const { data: nodes, isLoading } = useNodesQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const { setDeletingNode } = useNodes();

  const handleAddNode = () => {
    setSelectedNode(null);
    onOpen();
  };

  const handleEditNode = (node: NodeType) => {
    setSelectedNode(node);
    onOpen();
  };

  return (
    <>
      <Box maxW="1400px" mx="auto">
        <Text mb={2} fontSize="2xl" fontWeight="bold">
          {t("nodes.title")}
        </Text>
        <Text mb={6} opacity={0.8}>
          Управление узлами Marzban
        </Text>

        {isLoading ? (
          <Text>Loading...</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
            {nodes?.map((node) => (
              <NodeCard key={node.name} node={node} onEdit={handleEditNode} />
            ))}
            <AddNodeCard onClick={handleAddNode} />
          </SimpleGrid>
        )}
      </Box>

      <NodeModal 
        isOpen={isOpen} 
        onClose={onClose} 
        node={selectedNode} 
      />
      <DeleteNodeModal deleteCallback={() => {}} />
    </>
  );
};
'''

with open('d:/Desktop/Marzban-master/app/dashboard/src/components/Nodes.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
