import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  chakra,
  Checkbox,
  FormControl,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Select,
  SimpleGrid,
  Text,
  useCheckbox,
  useCheckboxGroup,
  UseRadioProps,
  VStack,
} from "@chakra-ui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { shadowsocksMethods, XTLSFlows } from "constants/Proxies";
import {
  InboundType,
  ProtocolType,
  useDashboard,
} from "contexts/DashboardContext";
import { t } from "i18next";
import { FC, forwardRef, PropsWithChildren, useState } from "react";
import {
  ControllerRenderProps,
  useFormContext,
  useWatch,
} from "react-hook-form";

const SettingsIcon = chakra(EllipsisVerticalIcon, {
  baseStyle: {
    strokeWidth: "2px",
    w: 5,
    h: 5,
  },
});

const InboundCard: FC<
  PropsWithChildren<UseRadioProps & { inbound: InboundType }>
> = ({ inbound, ...props }) => {
  const { getCheckboxProps, getInputProps, getLabelProps, htmlProps } =
    useCheckbox(props);
  const inputProps = getInputProps();
  return (
    <Box as="label">
      <input {...inputProps} />
      <Box
        w="fll"
        position="relative"
        {...htmlProps}
        cursor="pointer"
        borderRadius="12px"
        border="none"
        bg="rgba(255, 255, 255, 0.04)"
        transition="all 0.2s"
        _light={{
          bg: "rgba(255, 255, 255, 0.5)",
        }}
        _hover={{
          bg: "rgba(255, 255, 255, 0.08)",
          _light: { bg: "rgba(255, 255, 255, 0.7)" },
        }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        overflow="hidden"
        _checked={{
          bg: "rgba(72, 187, 120, 0.12)",
          boxShadow: "none",
          fontWeight: "medium",
          _light: {
            bg: "rgba(72, 187, 120, 0.1)",
            boxShadow: "none",
          },
          "& p": {
            opacity: 1,
          },
        }}
        __css={{
          "& p": {
            opacity: 0.8,
          },
        }}
        textTransform="capitalize"
        px={3}
        py={2}
        fontWeight="medium"
        {...getCheckboxProps()}
      >
        <Checkbox
          size="sm"
          w="full"
          maxW="full"
          color="gray.700"
          _dark={{ color: "gray.300" }}
          textTransform="uppercase"
          colorScheme="primary"
          className="inbound-item"
          isChecked={inputProps.checked}
          pointerEvents="none"
          flexGrow={1}
        >
          <HStack
            justify="space-between"
            w="full"
            maxW="calc(100% - 20px)"
            spacing={0}
            gap={2}
            overflow="hidden"
          >
            <Text isTruncated {...getLabelProps()} fontSize="xs">
              {inbound.tag} <Text as="span">({inbound.network})</Text>
            </Text>
          </HStack>
        </Checkbox>
        {inbound.tls && inbound.tls != "none" && (
          <Badge fontSize="xs" opacity=".8" size="xs">
            {inbound.tls}
          </Badge>
        )}
      </Box>
    </Box>
  );
};

const RadioCard: FC<
  PropsWithChildren<
    UseRadioProps & {
      disabled?: boolean;
      title: string;
      description: string;
      toggleAccordion: () => void;
      isSelected: boolean;
    }
  >
> = ({
  disabled,
  title,
  description,
  toggleAccordion,
  isSelected,
  ...props
}) => {
  const form = useFormContext();
  const { inbounds } = useDashboard();
  const { getCheckboxProps, getInputProps, getLabelProps, htmlProps } =
    useCheckbox(props);

  const inputProps = getInputProps();

  const [inBoundDefaultValue] = useWatch({
    name: [`inbounds.${title}`],
    control: form.control,
  });

  const { getCheckboxProps: getInboundCheckboxProps } = useCheckboxGroup({
    value: inBoundDefaultValue,
    onChange: (selectedInbounds) => {
      form.setValue(`inbounds.${title}`, selectedInbounds);
      if (selectedInbounds.length === 0) {
        const selected_proxies = form.getValues("selected_proxies");
        form.setValue(
          `selected_proxies`,
          selected_proxies.filter((p: string) => p !== title)
        );
        toggleAccordion();
      }
    },
  });

  const isPartialSelected =
    inBoundDefaultValue &&
    isSelected &&
    (useDashboard.getState().inbounds.get(title as ProtocolType) || [])
      .length !== inBoundDefaultValue.length;

  const protocolHasInbound =
    (useDashboard.getState().inbounds.get(title as ProtocolType) || []).length >
    0;

  const shouldBeDisabled = !isSelected && !protocolHasInbound;

  return (
    <AccordionItem
      isDisabled={!protocolHasInbound}
      borderRadius="16px"
      border="none"
      overflow="hidden"
      bg={shouldBeDisabled ? "rgba(255, 255, 255, 0.02)" : isSelected ? "rgba(72, 187, 120, 0.1)" : "rgba(255, 255, 255, 0.04)"}
      boxShadow="none"
      transition="all 0.2s ease"
      _light={{
        bg: shouldBeDisabled ? "rgba(0, 0, 0, 0.02)" : isSelected ? "rgba(72, 187, 120, 0.08)" : "rgba(255, 255, 255, 0.6)",
        boxShadow: "none",
      }}
      _checked={{
        bg: "rgba(72, 187, 120, 0.12)",
        boxShadow: "none",
        _light: {
          bg: "rgba(72, 187, 120, 0.1)",
          boxShadow: "none",
        },
      }}
      {...getCheckboxProps()}
    >
      <Box as={shouldBeDisabled ? "span" : "label"} position="relative">
        {isPartialSelected && (
          <Box
            position="absolute"
            w="2"
            h="2"
            bg="yellow.500"
            top="-1"
            right="-1"
            rounded="full"
            zIndex={999}
          />
        )}
        <input {...inputProps} />
        <Box
          w="fll"
          position="relative"
          {...htmlProps}
          borderRadius="md"
          cursor={shouldBeDisabled ? "not-allowed" : "pointer"}
          _checked={{
            fontWeight: "medium",
            _dark: {
              bg: "gray.750",
              borderColor: "transparent",
            },
            "& > svg": {
              opacity: 1,
              "&.checked": {
                display: "block",
              },
              "&.unchecked": {
                display: "none",
              },
            },
            "& p": {
              opacity: 1,
            },
          }}
          __css={{
            "& > svg": {
              opacity: 0.3,
              "&.checked": {
                display: "none",
              },
              "&.unchecked": {
                display: "block",
              },
            },
            "& p": {
              opacity: 0.8,
            },
          }}
          textTransform="capitalize"
          px={3}
          py={2}
          fontWeight="medium"
          {...getCheckboxProps()}
        >
          <AccordionButton
            display={
              inputProps.checked && protocolHasInbound ? "block" : "none"
            }
            as="span"
            className="checked"
            color="primary.200"
            position="absolute"
            right="3"
            top="3"
            w="auto"
            p={0}
            onClick={toggleAccordion}
          >
            <IconButton size="sm" aria-label="inbound settings">
              <SettingsIcon />
            </IconButton>
          </AccordionButton>

          <Text
            fontSize="sm"
            color={shouldBeDisabled ? "gray.500" : "white"}
            _light={{ color: shouldBeDisabled ? "gray.400" : "gray.700" }}
            {...getLabelProps()}
          >
            {title}
          </Text>
          <Text
            fontWeight="medium"
            color={shouldBeDisabled ? "gray.500" : "gray.400"}
            _light={{ color: shouldBeDisabled ? "gray.400" : "gray.600" }}
            fontSize="xs"
          >
            {description}
          </Text>
        </Box>
      </Box>
      <AccordionPanel
        px={3}
        pb={3}
        roundedBottom="16px"
        pt={3}
        bg="transparent"
      >
        <VStack
          w="full"
          rowGap={2}
          borderRadius="12px"
          border="none"
          bg="rgba(255, 255, 255, 0.03)"
          pl={3}
          pr={3}
          pt={1.5}
          pb={2}
          _light={{ 
            bg: "rgba(255, 255, 255, 0.4)",
          }}
        >
          <VStack alignItems="flex-start" w="full">
            <Text fontSize="sm">{t("inbound")}</Text>
            <SimpleGrid
              gap={2}
              alignItems="flex-start"
              w="full"
              columns={1}
              spacing={1}
            >
              {(
                (inbounds.get(title as ProtocolType) as InboundType[]) || []
              ).map((inbound) => {
                return (
                  <InboundCard
                    key={inbound.tag}
                    {...getInboundCheckboxProps({ value: inbound.tag })}
                    inbound={inbound}
                  />
                );
              })}
            </SimpleGrid>
          </VStack>
          {title === "vmess" && isSelected && (
            <VStack alignItems="flex-start" w="full">
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  ID
                </Text>
                <Input
                  fontSize="xs"
                  size="sm"
                  borderRadius="20px"
                  pl={2}
                  pr={2}
                  placeholder={t("userDialog.generatedByDefault")}
                  {...form.register("proxies.vmess.id")}
                />
              </FormControl>
            </VStack>
          )}
          {title === "vless" && isSelected && (
            <VStack alignItems="flex-start" w="full">
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  ID
                </Text>
                <Input
                  fontSize="xs"
                  size="sm"
                  borderRadius="20px"
                  pl={2}
                  pr={2}
                  placeholder={t("userDialog.generatedByDefault")}
                  {...form.register("proxies.vless.id")}
                />
              </FormControl>
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  Flow
                </Text>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    w="full"
                    textAlign="left"
                    fontWeight="normal"
                    fontSize="xs"
                    borderRadius="20px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    _light={{
                      bg: "rgba(255, 255, 255, 0.7)",
                      color: "gray.800",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    }}
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.08)",
                      _light: { bg: "rgba(255, 255, 255, 0.8)" },
                    }}
                    rightIcon={<chakra.span fontSize="xs" opacity={0.6}>▼</chakra.span>}
                  >
                    {form.watch("proxies.vless.flow") || XTLSFlows[0]?.title || "Select Flow"}
                  </MenuButton>
                  <Portal>
                    <MenuList
                      bg="rgba(26, 32, 44, 0.98)"
                      backdropFilter="blur(20px)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="16px"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                      py={2}
                      _light={{
                        bg: "rgba(255, 255, 255, 0.98)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                      }}
                      zIndex={9999}
                    >
                      {XTLSFlows.map((entry) => (
                        <MenuItem
                          key={entry.title}
                          bg={form.watch("proxies.vless.flow") === entry.value ? "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(128, 90, 213, 0.3))" : "transparent"}
                          color="white"
                          fontSize="xs"
                          _hover={{
                            bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(128, 90, 213, 0.3))",
                          }}
                          _light={{
                            color: "gray.800",
                            bg: form.watch("proxies.vless.flow") === entry.value ? "linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(128, 90, 213, 0.2))" : "transparent",
                            _hover: {
                              bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(128, 90, 213, 0.15))",
                            },
                          }}
                          borderRadius="8px"
                          mx={2}
                          onClick={() => form.setValue("proxies.vless.flow", entry.value)}
                        >
                          {entry.title}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Portal>
                </Menu>
              </FormControl>
            </VStack>
          )}
          {title === "trojan" && isSelected && (
            <VStack alignItems="flex-start" w="full">
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  {t("password")}
                </Text>
                <Input
                  fontSize="xs"
                  size="sm"
                  borderRadius="20px"
                  pl={2}
                  pr={2}
                  placeholder={t("userDialog.generatedByDefault")}
                  {...form.register("proxies.trojan.password")}
                />
              </FormControl>
            </VStack>
          )}
          {title === "shadowsocks" && isSelected && (
            <VStack alignItems="flex-start" w="full">
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  {t("password")}
                </Text>
                <Input
                  fontSize="xs"
                  size="sm"
                  borderRadius="20px"
                  pl={2}
                  pr={2}
                  placeholder={t("userDialog.generatedByDefault")}
                  {...form.register("proxies.shadowsocks.password")}
                />
              </FormControl>
              <FormControl height="66px">
                <Text fontSize="sm" pb={1}>
                  {t("userDialog.method")}
                </Text>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    w="full"
                    textAlign="left"
                    fontWeight="normal"
                    fontSize="xs"
                    borderRadius="20px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    color="white"
                    boxShadow="inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    _light={{
                      bg: "rgba(255, 255, 255, 0.7)",
                      color: "gray.800",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    }}
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.08)",
                      _light: { bg: "rgba(255, 255, 255, 0.8)" },
                    }}
                    rightIcon={<chakra.span fontSize="xs" opacity={0.6}>▼</chakra.span>}
                  >
                    {form.watch("proxies.shadowsocks.method") || shadowsocksMethods[0] || "Select Method"}
                  </MenuButton>
                  <Portal>
                    <MenuList
                      bg="rgba(26, 32, 44, 0.98)"
                      backdropFilter="blur(20px)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="16px"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                      py={2}
                      maxH="250px"
                      overflowY="auto"
                      _light={{
                        bg: "rgba(255, 255, 255, 0.98)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
                      }}
                      zIndex={9999}
                    >
                      {shadowsocksMethods.map((method) => (
                        <MenuItem
                          key={method}
                          bg={form.watch("proxies.shadowsocks.method") === method ? "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(128, 90, 213, 0.3))" : "transparent"}
                          color="white"
                          fontSize="xs"
                          _hover={{
                            bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(128, 90, 213, 0.3))",
                          }}
                          _light={{
                            color: "gray.800",
                            bg: form.watch("proxies.shadowsocks.method") === method ? "linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(128, 90, 213, 0.2))" : "transparent",
                            _hover: {
                              bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(128, 90, 213, 0.15))",
                            },
                          }}
                          borderRadius="8px"
                          mx={2}
                          onClick={() => form.setValue("proxies.shadowsocks.method", method)}
                        >
                          {method}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Portal>
                </Menu>
              </FormControl>
            </VStack>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
};

export type RadioListType = {
  title: string;
  description: string;
};

export type RadioGroupProps = ControllerRenderProps & {
  list: RadioListType[];
  disabled?: boolean;
};

export const RadioGroup = forwardRef<any, RadioGroupProps>(
  ({ name, list, onChange, disabled, ...props }, ref) => {
    const form = useFormContext();
    const [expandedAccordions, setExpandedAccordions] = useState<number[]>([]);

    const toggleAccordion = (i: number) => {
      if (expandedAccordions.includes(i))
        expandedAccordions.splice(expandedAccordions.indexOf(i), 1);
      else expandedAccordions.push(i);
      setExpandedAccordions([...expandedAccordions]);
    };

    const { getCheckboxProps } = useCheckboxGroup({
      value: props.value,
      onChange: (value) => {
        // active all inbounds when a proxy selected
        const selectedItem = value.filter((el) => !props.value.includes(el));
        if (selectedItem[0]) {
          form.setValue(
            `inbounds.${selectedItem[0]}`,
            useDashboard
              .getState()
              .inbounds.get(selectedItem[0] as ProtocolType)
              ?.map((i) => i.tag)
          );
        }

        setExpandedAccordions(
          expandedAccordions.filter((i) => {
            return value.find((title) => title === list[i].title);
          })
        );

        onChange({
          target: {
            value,
            name,
          },
        });
      },
    });

    return (
      <Accordion allowToggle index={expandedAccordions}>
        <SimpleGrid
          ref={ref}
          gap={2}
          alignItems="flex-start"
          columns={1}
          spacing={1}
        >
          {list.map((value, index) => {
            return (
              <RadioCard
                toggleAccordion={toggleAccordion.bind(null, index)}
                disabled={disabled}
                key={value.title}
                title={value.title}
                description={value.description}
                isSelected={
                  !!(props.value as string[]).find((v) => v === value.title)
                }
                {...getCheckboxProps({ value: value.title })}
              />
            );
          })}
        </SimpleGrid>
      </Accordion>
    );
  }
);
