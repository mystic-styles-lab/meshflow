import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  Input,
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
  useToast,
  VStack,
} from "@chakra-ui/react";
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
import { FC, ReactNode, useState } from "react";
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
import { useDashboard } from "../contexts/DashboardContext";
import { DeleteNodeModal } from "./DeleteNodeModal";
import { DeleteIcon } from "./DeleteUserModal";
import { ReloadIcon } from "./Filters";
import { Icon } from "./Icon";
import { NodeModalStatusBadge } from "./NodeModalStatusBadge";

import { fetch } from "service/http";

const ModalIcon = chakra(SquaresPlusIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

const PlusIcon = chakra(HeroIconPlusIcon, {
  baseStyle: {
    w: 5,
    h: 5,
    strokeWidth: 2,
  },
});

type AccordionInboundType = {
  toggleAccordion: () => void;
  node: NodeType;
};

const NodeAccordion: FC<AccordionInboundType> = ({ toggleAccordion, node }) => {
  const { updateNode, reconnectNode, setDeletingNode } = useNodes();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const form = useForm<NodeType>({
    defaultValues: node,
    resolver: zodResolver(NodeSchema),
  });
  const handleDeleteNode = setDeletingNode.bind(null, node);

  const { isLoading, mutate } = useMutation(updateNode, {
    onSuccess: () => {
      generateSuccessMessage("Node updated successfully", toast);
      queryClient.invalidateQueries(FetchNodesQueryKey);
    },
    onError: (e) => {
      generateErrorMessage(e, toast, form);
    },
  });

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
    <AccordionItem
      bg="rgba(255, 255, 255, 0.05)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="20px"
      mb={2}
      color="white"
      _light={{
        bg: "rgba(255, 255, 255, 0.6)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        color: "gray.800",
      }}
      p={1}
      w="full"
    >
      <AccordionButton px={2} borderRadius="15px" onClick={toggleAccordion} _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}>
        <HStack w="full" justifyContent="space-between" pr={2}>
          <Text
            as="span"
            fontWeight="medium"
            fontSize="sm"
            flex="1"
            textAlign="left"
          >
            {node.name}
          </Text>
          <HStack>
            {node.xray_version && (
              <Badge
                rounded="full"
                display="inline-flex"
                px={3}
                py={1}
                bg="rgba(59, 130, 246, 0.15)"
                color="blue.300"
                border="1px solid rgba(59, 130, 246, 0.3)"
                _light={{
                  bg: "rgba(59, 130, 246, 0.1)",
                  color: "blue.600",
                  borderColor: "rgba(59, 130, 246, 0.2)"
                }}
              >
                <Text
                  textTransform="capitalize"
                  fontSize="0.7rem"
                  fontWeight="medium"
                  letterSpacing="tighter"
                >
                  Xray {node.xray_version}
                </Text>
              </Badge>
            )}
            {node.status && <NodeModalStatusBadge status={nodeStatus} compact />}
          </HStack>
        </HStack>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel px={4} py={4}>
        {nodeStatus === "error" && (
          <Alert
              status="error"
              size="xs"
              bg="rgba(30, 35, 50, 0.8)"
              backdropFilter="blur(10px)"
              borderRadius="20px"
              border="1px solid rgba(255, 255, 255, 0.1)"
              boxShadow="0 4px 15px rgba(0, 0, 0, 0.2)"
              color="white"
              _light={{
                bg: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                color: "gray.800",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Box>
                <HStack w="full">
                  <AlertIcon w={4} />
                  <Text marginInlineEnd={0}>{node.message}</Text>
                </HStack>
                <HStack justifyContent="flex-end" w="full">
                  <Button
                    size="sm"
                    aria-label="reconnect node"
                    leftIcon={<ReloadIcon />}
                    onClick={() => reconnect()}
                    disabled={isReconnecting}
                    bg="rgba(255, 255, 255, 0.05)"
                    backdropFilter="blur(10px)"
                    borderRadius="30px"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                    _light={{ 
                      bg: "rgba(255, 255, 255, 0.8)", 
                      color: "gray.700", 
                      border: "1px solid rgba(0, 0, 0, 0.1)", 
                      _hover: { bg: "rgba(255, 255, 255, 0.95)" } 
                    }}
                  >
                    {isReconnecting
                      ? t("nodes.reconnecting")
                      : t("nodes.reconnect")}
                  </Button>
                </HStack>
              </Box>
            </Alert>
        )}
        <NodeForm
          form={form}
          mutate={mutate}
          isLoading={isLoading}
          submitBtnText={t("nodes.editNode")}
          btnLeftAdornment={
            <Tooltip label={t("delete")} placement="top">
              <IconButton
                size="sm"
                aria-label="delete node"
                onClick={handleDeleteNode}
                bg="rgba(239, 68, 68, 0.15)"
                backdropFilter="blur(10px)"
                borderRadius="full"
                border="1px solid rgba(239, 68, 68, 0.3)"
                color="red.400"
                boxShadow="0 2px 8px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                _hover={{ bg: "rgba(239, 68, 68, 0.25)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}
                _light={{
                  bg: "rgba(239, 68, 68, 0.1)",
                  color: "red.600",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  _hover: { bg: "rgba(239, 68, 68, 0.15)" }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
        />
      </AccordionPanel>
    </AccordionItem>
  );
};

type AddNodeFormType = {
  toggleAccordion: () => void;
  resetAccordions: () => void;
};

const AddNodeForm: FC<AddNodeFormType> = ({
  toggleAccordion,
  resetAccordions,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addNode } = useNodes();
  const form = useForm<NodeType>({
    resolver: zodResolver(NodeSchema),
    defaultValues: {
      ...getNodeDefaultValues(),
      add_as_new_host: false,
    },
  });
  const { isLoading, mutate } = useMutation(addNode, {
    onSuccess: () => {
      generateSuccessMessage(
        t("nodes.addNodeSuccess", { name: form.getValues("name") }),
        toast
      );
      queryClient.invalidateQueries(FetchNodesQueryKey);
      form.reset();
      resetAccordions();
    },
    onError: (e) => {
      generateErrorMessage(e, toast, form);
    },
  });
  return (
    <AccordionItem
      bg="rgba(255, 255, 255, 0.05)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="20px"
      mb={2}
      color="white"
      _light={{
        bg: "rgba(255, 255, 255, 0.6)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        color: "gray.800",
      }}
      p={1}
      w="full"
    >
      <AccordionButton px={2} borderRadius="15px" onClick={toggleAccordion} _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}>
        <Text
          as="span"
          fontWeight="medium"
          fontSize="sm"
          flex="1"
          textAlign="left"
          display="flex"
          gap={1}
        >
          <PlusIcon display={"inline-block"} />{" "}
          <span>{t("nodes.addNewMarzbanNode")}</span>
        </Text>
      </AccordionButton>
      <AccordionPanel px={4} py={4}>
        <NodeForm
          form={form}
          mutate={mutate}
          isLoading={isLoading}
          submitBtnText={t("nodes.addNode")}
          btnProps={{ variant: "solid" }}
          addAsHost
        />
      </AccordionPanel>
    </AccordionItem>
  );
};

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
      <VStack w="full" spacing={4} align="stretch">
        {nodeSettings && nodeSettings.certificate && (
          <Alert
            status="info"
            alignItems="start"
            bg="rgba(30, 35, 50, 0.8)"
            backdropFilter="blur(10px)"
            borderRadius="20px"
            border="1px solid rgba(255, 255, 255, 0.1)"
            boxShadow="0 4px 15px rgba(0, 0, 0, 0.2)"
            color="white"
            _light={{
              bg: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              color: "gray.800",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
            }}
          >
            <AlertDescription
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <span>{t("nodes.connection-hint")}</span>
              <HStack justify="end" py={2}>
                <Button
                  as="a"
                  size="xs"
                  download="ssl_client_cert.pem"
                  href={URL.createObjectURL(
                    new Blob([nodeSettings.certificate], { type: "text/plain" })
                  )}
                  bg="rgba(102, 126, 234, 0.8)"
                  backdropFilter="blur(10px)"
                  borderRadius="20px"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  color="white"
                  fontSize="xs"
                  px={3}
                  boxShadow="0 2px 8px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)" }}
                  _light={{
                    bg: "rgba(102, 126, 234, 0.9)",
                    _hover: { bg: "rgba(102, 126, 234, 1)" }
                  }}
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
                    backdropFilter="blur(10px)"
                    borderRadius="full"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                    _light={{
                      bg: "rgba(255, 255, 255, 0.8)",
                      color: "gray.700",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      _hover: { bg: "rgba(255, 255, 255, 0.95)" }
                    }}
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
                  bg="rgba(0, 0, 0, 0.2)"
                  _dark={{
                    bg: "rgba(0, 0, 0, 0.2)",
                  }}
                  _light={{
                    bg: "rgba(255, 255, 255, 0.4)",
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

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>{t("nodes.nodeName")}</FormLabel>
            <Input
              size="md"
              placeholder="Marzban-S2"
              {...form.register("name")}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </FormControl>
          <FormControl display="flex" alignItems="flex-end">
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => {
                return (
                  <HStack w="full" justify="space-between">
                    <FormLabel fontSize="sm" mb={0}>{t("usersTable.status")}</FormLabel>
                    <Switch
                      colorScheme="green"
                      isChecked={field.value !== "disabled"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          field.onChange("connecting");
                        } else {
                          field.onChange("disabled");
                        }
                      }}
                    />
                  </HStack>
                );
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>{t("nodes.nodeAddress")}</FormLabel>
            <Input
              size="md"
              placeholder="51.20.12.13"
              {...form.register("address")}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>{t("nodes.nodePort")}</FormLabel>
            <Input
              size="md"
              placeholder="62050"
              {...form.register("port")}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>{t("nodes.nodeAPIPort")}</FormLabel>
            <Input
              size="md"
              placeholder="62051"
              {...form.register("api_port")}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" mb={1}>{t("nodes.usageCoefficient")}</FormLabel>
            <Input
              size="md"
              placeholder="1"
              {...form.register("usage_coefficient")}
              borderRadius="20px"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ bg: "rgba(255, 255, 255, 0.7)", border: "1px solid rgba(0, 0, 0, 0.1)" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
            />
          </FormControl>
        </SimpleGrid>
        {addAsHost && (
          <FormControl py={1}>
            <Checkbox {...form.register("add_as_new_host")}>
              <FormLabel m={0}>{t("nodes.addHostForEveryInbound")}</FormLabel>
            </Checkbox>
          </FormControl>
        )}
        <HStack w="full" justify="flex-end" pt={2}>
          {btnLeftAdornment}
          <Button 
            mr={2}
            px={5}
            py={2}
            bg="rgba(255, 255, 255, 0.05)"
            backdropFilter="blur(10px)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            color="white"
            borderRadius="30px"
            _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
            _light={{ bg: "rgba(255, 255, 255, 0.8)", color: "gray.700", border: "1px solid rgba(0, 0, 0, 0.1)", _hover: { bg: "rgba(255, 255, 255, 0.95)" } }}
            onClick={() => form.reset()}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            px={5}
            py={2}
            isLoading={isLoading}
            bg="rgba(102, 126, 234, 0.8)"
            backdropFilter="blur(10px)"
            borderRadius="30px"
            border="1px solid rgba(255, 255, 255, 0.2)"
            fontSize="sm"
            fontWeight="600"
            color="white"
            boxShadow="0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            _hover={{ bg: "rgba(102, 126, 234, 0.9)", boxShadow: "0 6px 20px rgba(102, 126, 234, 0.5)" }}
            _light={{ bg: "rgba(102, 126, 234, 0.9)", _hover: { bg: "rgba(102, 126, 234, 1)" } }}
            {...btnProps}
          >
            {submitBtnText}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

export const NodesDialog: FC = () => {
  const { isEditingNodes, onEditingNodes } = useDashboard();
  const { t } = useTranslation();
  const [openAccordions, setOpenAccordions] = useState<any>({});
  const { data: nodes, isLoading } = useNodesQuery();

  const onClose = () => {
    setOpenAccordions({});
    onEditingNodes(false);
  };

  const toggleAccordion = (index: number | string) => {
    if (openAccordions[String(index)]) {
      delete openAccordions[String(index)];
    } else openAccordions[String(index)] = {};

    setOpenAccordions({ ...openAccordions });
  };

  return (
    <>
      <Modal isOpen={isEditingNodes} onClose={onClose}>
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
        <ModalContent 
          mx="3" 
          maxW="900px"
          minW="800px"
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
            {t("nodes.title")}
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
            {isLoading && "loading..."}

            <Accordion
              w="full"
              allowToggle
              index={Object.keys(openAccordions).map((i) => parseInt(i))}
            >
              <VStack w="full">
                {!isLoading &&
                  nodes &&
                  nodes.map((node, index) => {
                    return (
                      <NodeAccordion
                        toggleAccordion={() => toggleAccordion(index)}
                        key={node.name}
                        node={node}
                      />
                    );
                  })}

                <AddNodeForm
                  toggleAccordion={() => toggleAccordion((nodes || []).length)}
                  resetAccordions={() => setOpenAccordions({})}
                />
              </VStack>
            </Accordion>
          </ModalBody>
        </ModalContent>
      </Modal>
      <DeleteNodeModal deleteCallback={() => setOpenAccordions({})} />
    </>
  );
};
