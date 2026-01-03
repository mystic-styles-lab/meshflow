import {
  Badge,
  Box,
  Button,
  Select as ChakraSelect,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Switch,
  Text,
  Tooltip,
  VStack,
  chakra,
  useToast,
  useColorModeValue,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { GlassCard, CandyButton } from "./common/GlassComponents";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  PencilIcon,
  PlusIcon as HeroIconPlusIcon,
} from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  proxyALPN,
  proxyFingerprint,
  proxyHostSecurity,
} from "constants/Proxies";
import { useHosts } from "contexts/HostsContext";
import { FC, useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { z } from "zod";
import { DeleteIcon } from "./DeleteUserModal";
import { Input as CustomInput } from "./Input";

export const DuplicateIcon = chakra(DocumentDuplicateIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const UpIcon = chakra(ArrowUpIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export const DownIcon = chakra(ArrowDownIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

const EditIcon = chakra(PencilIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

const PlusIcon = chakra(HeroIconPlusIcon, {
  baseStyle: {
    w: 6,
    h: 6,
    strokeWidth: 2,
  },
});

const Select = chakra(ChakraSelect, {
  baseStyle: {
    field: {
      bg: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "20px",
      color: "white",
      _light: {
        bg: "rgba(255, 255, 255, 0.7)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        color: "gray.800",
      },
      _focus: {
        borderColor: "blue.400",
        boxShadow: "0 0 0 1px blue.400",
      },
    },
    icon: {
      color: "whiteAlpha.700",
      _light: { color: "gray.500" }
    }
  },
});

const InfoIcon = chakra(InformationCircleIcon, {
  baseStyle: {
    w: 5,
    h: 5,
    cursor: "pointer",
  },
});

const Input = chakra(CustomInput, {
  baseStyle: {
    bg: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    color: "white",
    _light: {
      bg: "rgba(255, 255, 255, 0.7)",
      border: "1px solid rgba(0, 0, 0, 0.1)",
      color: "gray.800",
    },
    _focus: {
      borderColor: "blue.400",
      boxShadow: "0 0 0 1px blue.400",
    },
    _placeholder: {
      color: "whiteAlpha.400",
      _light: { color: "gray.400" }
    }
  },
});

const InboundHostSchema = z.object({
  remark: z.string(),
  address: z.string(),
  port: z.number().nullable().optional(),
  sni: z.string(),
  host: z.string(),
  path: z.string().optional().nullable(),
  security: z.string(),
  alpn: z.string(),
  fingerprint: z.string(),
  allowinsecure: z.boolean(),
  is_disabled: z.boolean(),
  mux_enable: z.boolean(),
  fragment_setting: z.string().optional().nullable(),
  noise_setting: z.string().optional().nullable(),
  random_user_agent: z.boolean().optional().nullable(),
});

const hostsSchema = z.object({
  VMess: z.array(InboundHostSchema).optional(),
  VLess: z.array(InboundHostSchema).optional(),
  Trojan: z.array(InboundHostSchema).optional(),
  Shadowsocks: z.array(InboundHostSchema).optional(),
});

type InboundHostType = z.infer<typeof InboundHostSchema>;
type HostsFormType = z.infer<typeof hostsSchema>;

const getErrors = (errors: any, hostKey: string, index: number) => errors?.[hostKey]?.[index];

const HostForm: FC<{ hostKey: string; index: number }> = ({ hostKey, index }) => {
  const { t } = useTranslation();
  const form = useFormContext<HostsFormType>();
  const fieldErrors = getErrors(form.formState.errors, hostKey, index);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <FormControl
        isInvalid={!!fieldErrors?.remark}
        gridColumn={{ md: "span 2" }}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          {t("hostsDialog.remark")}
        </FormLabel>
        <InputGroup>
          <Input
            {...form.register(`${hostKey}.${index}.remark` as any)}
            size="sm"
            placeholder="Примечание"
          />
          <InputRightElement>
            <Popover isLazy placement="right">
              <PopoverTrigger>
                <Box mt="-8px">
                  <InfoIcon />
                </Box>
              </PopoverTrigger>
              <Portal>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverBody>
                    <Box fontSize="xs">
                      <Text pr="20px">Примечание к хосту</Text>
                    </Box>
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </Popover>
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage>
          {fieldErrors?.remark?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.address}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Адрес
        </FormLabel>
        <Input
          {...form.register(`${hostKey}.${index}.address` as any)}
          size="sm"
          placeholder="Адрес"
        />
        <FormErrorMessage>
          {fieldErrors?.address?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.port}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Порт
        </FormLabel>
        <Controller
          control={form.control}
          name={`${hostKey}.${index}.port` as any}
          render={({ field }) => (
            <Input
              {...field}
              onChange={(e) => {
                if (e.target.value === "") field.onChange(e.target.value);
                else if (!isNaN(Number(e.target.value)))
                  field.onChange(Number(e.target.value));
              }}
              size="sm"
              placeholder="Порт"
            />
          )}
        />
        <FormErrorMessage>
          {fieldErrors?.port?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.sni}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          SNI
        </FormLabel>
        <Input
          {...form.register(`${hostKey}.${index}.sni` as any)}
          size="sm"
          placeholder="SNI"
        />
        <FormErrorMessage>
          {fieldErrors?.sni?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.host}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Хост
        </FormLabel>
        <Input
          {...form.register(`${hostKey}.${index}.host` as any)}
          size="sm"
          placeholder="Хост"
        />
        <FormErrorMessage>
          {fieldErrors?.host?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.path}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Путь
        </FormLabel>
        <Input
          {...form.register(`${hostKey}.${index}.path` as any)}
          size="sm"
          placeholder="Путь"
        />
        <FormErrorMessage>
          {fieldErrors?.path?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.security}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Безопасность
        </FormLabel>
        <Select
          {...form.register(`${hostKey}.${index}.security` as any)}
          size="sm"
          sx={{
            option: {
              bg: "rgba(30, 35, 50, 0.98)",
              color: "white",
              _light: { bg: "white", color: "gray.800" }
            }
          }}
        >
          {proxyHostSecurity.map((s) => (
            <option key={s.value} value={s.value}>
              {s.title}
            </option>
          ))}
        </Select>
        <FormErrorMessage>
          {fieldErrors?.security?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.alpn}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          ALPN
        </FormLabel>
        <Select
          {...form.register(`${hostKey}.${index}.alpn` as any)}
          size="sm"
          sx={{
            option: {
              bg: "rgba(30, 35, 50, 0.98)",
              color: "white",
              _light: { bg: "white", color: "gray.800" }
            }
          }}
        >
          {proxyALPN.map((s) => (
            <option key={s.value} value={s.value}>
              {s.title}
            </option>
          ))}
        </Select>
        <FormErrorMessage>
          {fieldErrors?.alpn?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl
        isInvalid={!!fieldErrors?.fingerprint}
      >
        <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
          Отпечаток
        </FormLabel>
        <Select
          {...form.register(`${hostKey}.${index}.fingerprint` as any)}
          size="sm"
          sx={{
            option: {
              bg: "rgba(30, 35, 50, 0.98)",
              color: "white",
              _light: { bg: "white", color: "gray.800" }
            }
          }}
        >
          {proxyFingerprint.map((s) => (
            <option key={s.value} value={s.value}>
              {s.title}
            </option>
          ))}
        </Select>
        <FormErrorMessage>
          {fieldErrors?.fingerprint?.message}
        </FormErrorMessage>
      </FormControl>

      <FormControl>
        <HStack justifyContent="space-between" w="full">
          <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
            Разрешить небезопасные
          </FormLabel>
          <Controller
            control={form.control}
            name={`${hostKey}.${index}.allowinsecure` as any}
            render={({ field }) => (
              <Switch
                colorScheme="primary"
                isChecked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </HStack>
      </FormControl>

      <FormControl>
        <HStack justifyContent="space-between" w="full">
          <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
            Мультиплексирование
          </FormLabel>
          <Controller
            control={form.control}
            name={`${hostKey}.${index}.mux_enable` as any}
            render={({ field }) => (
              <Switch
                colorScheme="primary"
                isChecked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </HStack>
      </FormControl>

      <FormControl>
        <HStack justifyContent="space-between" w="full">
          <FormLabel ms="4px" fontSize="sm" fontWeight="normal">
            Отключено
          </FormLabel>
          <Controller
            control={form.control}
            name={`${hostKey}.${index}.is_disabled` as any}
            render={({ field }) => (
              <Switch
                colorScheme="red"
                isChecked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </HStack>
      </FormControl>
    </SimpleGrid>
  );
};

const HostModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  hostKey: string;
  index: number;
}> = ({ isOpen, onClose, hostKey, index }) => {
  const { t } = useTranslation();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
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
        <ModalHeader borderBottom="1px solid rgba(255, 255, 255, 0.1)" color="white" _light={{ color: "gray.900" }}>
          {hostKey} #{index + 1}
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
        <ModalBody pb={6}>
          <HostForm hostKey={hostKey} index={index} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const HostCard: FC<{
  hostKey: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ hostKey, index, onEdit, onDelete, onDuplicate }) => {
  const form = useFormContext<HostsFormType>();
  const { t } = useTranslation();
  
  const remark = form.watch(`${hostKey}.${index}.remark` as any);
  const address = form.watch(`${hostKey}.${index}.address` as any);
  const port = form.watch(`${hostKey}.${index}.port` as any);
  const isDisabled = form.watch(`${hostKey}.${index}.is_disabled` as any);

  return (
    <GlassCard p={5} display="flex" flexDirection="column" h="full" opacity={isDisabled ? 0.6 : 1}>
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold" fontSize="md" noOfLines={1}>
          {remark || `Host #${index + 1}`}
        </Text>
        {isDisabled && <Badge colorScheme="red">{t("disabled")}</Badge>}
      </HStack>

      <VStack align="start" spacing={2} flex={1} mb={4}>
        <HStack>
          <Badge fontSize="xs" colorScheme="purple">Addr</Badge>
          <Text fontSize="sm" fontFamily="mono" noOfLines={1}>{address}</Text>
        </HStack>
        <HStack>
          <Badge fontSize="xs" colorScheme="blue">Port</Badge>
          <Text fontSize="sm" fontFamily="mono">{port}</Text>
        </HStack>
      </VStack>

      <HStack spacing={2} mt="auto" justify="flex-end">
        <Tooltip label="Дублировать">
          <IconButton
            aria-label="duplicate"
            size="sm"
            icon={<DuplicateIcon />}
            onClick={onDuplicate}
            variant="ghost"
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            color="white"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.600", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
          />
        </Tooltip>
        <Tooltip label="Удалить">
          <IconButton
            aria-label="delete"
            size="sm"
            icon={<DeleteIcon />}
            onClick={onDelete}
            variant="ghost"
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            color="white"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.600", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
          />
        </Tooltip>
        <IconButton
          aria-label="edit"
          size="sm"
          icon={<EditIcon />}
          onClick={onEdit}
          variant="ghost"
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.05)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          color="white"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.600", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
          _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
        />
      </HStack>
    </GlassCard>
  );
};

const AddHostCard: FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <GlassCard 
      p={5} 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      h="full" 
      minH="150px"
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
      borderStyle="dashed"
      bg="transparent"
    >
      <Box 
        p={3} 
        borderRadius="full" 
        bg="whiteAlpha.100" 
        _light={{ bg: "blackAlpha.50" }}
        mb={3}
      >
        <PlusIcon />
      </Box>
      <Text fontWeight="medium" fontSize="sm">Добавить</Text>
    </GlassCard>
  );
};

const HostList: FC<{ hostKey: string }> = ({ hostKey }) => {
  const form = useFormContext<HostsFormType>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: hostKey as any,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    onOpen();
  };

  const handleDuplicate = (index: number) => {
    const item = form.getValues(`${hostKey}.${index}` as any);
    append(item);
  };

  const handleAdd = () => {
    append({
      remark: "",
      address: "",
      port: null,
      sni: "",
      host: "",
      security: "inbound_default",
      alpn: "",
      fingerprint: "",
      allowinsecure: false,
      is_disabled: false,
      mux_enable: false,
    });
    // Optionally open modal immediately
    setEditingIndex(fields.length); 
    onOpen();
  };

  return (
    <>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4} mt={4}>
        {fields.map((field, index) => (
          <HostCard
            key={field.id}
            hostKey={hostKey}
            index={index}
            onEdit={() => handleEdit(index)}
            onDelete={() => remove(index)}
            onDuplicate={() => handleDuplicate(index)}
          />
        ))}
        <AddHostCard onClick={handleAdd} />
      </SimpleGrid>

      {editingIndex !== null && (
        <HostModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setEditingIndex(null);
          }}
          hostKey={hostKey}
          index={editingIndex}
        />
      )}
    </>
  );
};

export const Hosts: FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isLoading, fetchHosts, hosts, setHosts, isPostLoading } = useHosts();
  
  const form = useForm<HostsFormType>({
    resolver: zodResolver(hostsSchema),
  });

  useEffect(() => {
    fetchHosts();
  }, []);

  useEffect(() => {
    if (hosts) {
      form.reset(hosts);
    }
  }, [hosts]);

  const handleFormSubmit = (values: HostsFormType) => {
    setHosts(values as any)
      .then(() => {
        toast({
          title: t("hostsDialog.hostsUpdated"),
          status: "success",
          isClosable: true,
          position: "top",
          duration: 3000,
        });
      })
      .catch((err: any) => {
        if (err?.response?.status === 409 || err?.response?.status === 400) {
          Object.keys(err.response._data.detail).map((key) => {
            toast({
              title: err.response._data.detail[key] + " (" + key + ")",
              status: "error",
              isClosable: true,
              position: "top",
              duration: 3000,
            });
          });
        }
      });
  };

  return (
    <Box maxW="1400px" mx="auto">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          {isLoading && <Text>{t("hostsDialog.loading")}</Text>}
          
          {!isLoading && hosts && (
            <Tabs variant="soft-rounded" colorScheme="purple">
              <TabList overflowX="auto" py={2}>
                {Object.keys(hosts).map((hostKey) => (
                  <Tab key={hostKey} whiteSpace="nowrap">
                    {hostKey}
                    <Badge ml={2} colorScheme="gray" borderRadius="full">
                      {form.watch(hostKey as any)?.length || 0}
                    </Badge>
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                {Object.keys(hosts).map((hostKey) => (
                  <TabPanel key={hostKey} px={0}>
                    <HostList hostKey={hostKey} />
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          )}

          <HStack justifyContent="flex-end" py={4} mt={4} position="sticky" bottom={0} bg="transparent" backdropFilter="blur(5px)" zIndex={10}>
            <CandyButton
              type="submit"
              candyVariant="primary"
              size="lg"
              px={10}
              borderRadius="full"
              isLoading={isPostLoading}
              disabled={isPostLoading}
              boxShadow="xl"
            >
              {t("hostsDialog.apply")}
            </CandyButton>
          </HStack>
        </form>
      </FormProvider>
    </Box>
  );
};
