import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  chakra,
  ExpandedIndex,
  HStack,
  IconButton,
  Select,
  Slider,
  SliderFilledTrack,
  SliderProps,
  SliderTrack,
  Table,
  TableProps,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { GlassCard, CandyButton, CandyBadge } from "./common/GlassComponents";
import { glassTheme } from "../theme/glassTheme";
import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  LinkIcon,
  PencilIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { ReactComponent as AddFileIcon } from "assets/add_file.svg";
import classNames from "classnames";
import { resetStrategy, statusColors } from "constants/UserSettings";
import { useDashboard } from "contexts/DashboardContext";
import { t } from "i18next";
import { FC, Fragment, useEffect, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { useTranslation } from "react-i18next";
import { User } from "types/User";
import { formatBytes } from "utils/formatByte";
import { OnlineBadge } from "./OnlineBadge";
import { OnlineStatus } from "./OnlineStatus";
import { Pagination } from "./Pagination";
import { StatusBadge } from "./StatusBadge";

const EmptySectionIcon = chakra(AddFileIcon);

const iconProps = {
  baseStyle: {
    w: {
      base: 4,
      md: 5,
    },
    h: {
      base: 4,
      md: 5,
    },
  },
};
const CopyIcon = chakra(ClipboardIcon, iconProps);
const AccordionArrowIcon = chakra(ChevronDownIcon, iconProps);
const CopiedIcon = chakra(CheckIcon, iconProps);
const SubscriptionLinkIcon = chakra(LinkIcon, iconProps);
const QRIcon = chakra(QrCodeIcon, iconProps);
const EditIcon = chakra(PencilIcon, iconProps);
const SortIcon = chakra(ChevronDownIcon, {
  baseStyle: {
    width: "15px",
    height: "15px",
  },
});
type UsageSliderProps = {
  used: number;
  total: number | null;
  dataLimitResetStrategy: string | null;
  totalUsedTraffic: number;
} & SliderProps;

const getResetStrategy = (strategy: string): string => {
  for (var i = 0; i < resetStrategy.length; i++) {
    const entry = resetStrategy[i];
    if (entry.value == strategy) {
      return entry.title;
    }
  }
  return "No";
};
const UsageSliderCompact: FC<UsageSliderProps> = (props) => {
  const { used, total, dataLimitResetStrategy, totalUsedTraffic } = props;
  const isUnlimited = total === 0 || total === null;
  const isReached = !isUnlimited && (used / total) * 100 >= 100;
  const percentage = isUnlimited ? 100 : Math.min((used / total) * 100, 100);
  return (
    <HStack
      justifyContent="space-between"
      fontSize="sm"
      fontWeight="medium"
      color={isReached ? "red.400" : "gray.300"}
      _dark={{
        color: isReached ? "red.400" : "gray.300",
      }}
      _light={{
        color: isReached ? "red.500" : "gray.600",
      }}
    >
      <Text>
        {formatBytes(used)}
        <Text as="span" color="gray.500" mx={1}>/</Text>
        {isUnlimited ? (
          <Text as="span" fontFamily="system-ui">
            ∞
          </Text>
        ) : (
          <Text as="span">{formatBytes(total)}</Text>
        )}
        {!isUnlimited && (
          <Text as="span" color={isReached ? "red.400" : "primary.400"} ml={2} fontSize="xs">
            ({percentage.toFixed(0)}%)
          </Text>
        )}
      </Text>
    </HStack>
  );
};
const UsageSlider: FC<UsageSliderProps> = (props) => {
  const {
    used,
    total,
    dataLimitResetStrategy,
    totalUsedTraffic,
    ...restOfProps
  } = props;
  const isUnlimited = total === 0 || total === null;
  const isReached = !isUnlimited && (used / total) * 100 >= 100;
  return (
    <>
      <Slider
        orientation="horizontal"
        value={isUnlimited ? 100 : Math.min((used / total) * 100, 100)}
        colorScheme={isReached ? "red" : "primary"}
        {...restOfProps}
      >
        <SliderTrack 
          h="8px" 
          borderRadius="full"
          bg="rgba(255, 255, 255, 0.1)"
          _light={{ bg: "rgba(0, 0, 0, 0.08)" }}
        >
          <SliderFilledTrack 
            borderRadius="full"
            boxShadow={isReached ? "0 0 8px rgba(245, 101, 101, 0.5)" : "0 0 8px rgba(128, 90, 213, 0.4)"}
          />
        </SliderTrack>
      </Slider>
      <HStack
        justifyContent="space-between"
        fontSize="xs"
        fontWeight="medium"
        color="gray.600"
        _dark={{
          color: "gray.400",
        }}
      >
        <Text>
          {formatBytes(used)} /{" "}
          {isUnlimited ? (
            <Text as="span" fontFamily="system-ui">
              ∞
            </Text>
          ) : (
            formatBytes(total) +
            (dataLimitResetStrategy && dataLimitResetStrategy !== "no_reset"
              ? " " +
                t(
                  "userDialog.resetStrategy" +
                    getResetStrategy(dataLimitResetStrategy)
                )
              : "")
          )}
        </Text>
        <Text>
          {t("usersTable.total")}: {formatBytes(totalUsedTraffic)}
        </Text>
      </HStack>
    </>
  );
};
export type SortType = {
  sort: string;
  column: string;
};
export const Sort: FC<SortType> = ({ sort, column }) => {
  if (sort.includes(column))
    return (
      <SortIcon
        transform={sort.startsWith("-") ? undefined : "rotate(180deg)"}
      />
    );
  return null;
};
type UsersTableProps = {} & TableProps;
export const UsersTable: FC<UsersTableProps> = (props) => {
  const {
    filters,
    users: { users },
    users: totalUsers,
    onEditingUser,
    onFilterChange,
  } = useDashboard();

  const { t } = useTranslation();
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<ExpandedIndex | undefined>(
    undefined
  );
  const marginTop = useBreakpointValue({ base: 120, lg: 72 }) || 72;
  const [top, setTop] = useState(`${marginTop}px`);
  const useTable = useBreakpointValue({ base: false, md: true });

  useEffect(() => {
    const calcTop = () => {
      const el = document.querySelectorAll("#filters")[0] as HTMLElement;
      if (el) {
        setTop(`${el.offsetHeight}px`);
      }
    };
    calcTop(); // Initial calculation
    window.addEventListener("scroll", calcTop);
    return () => window.removeEventListener("scroll", calcTop);
  }, []);

  useEffect(() => {
    // Загрузка тарифов
    import("service/http").then(({ fetch }) => {
      fetch("/tariffs/")
        .then((data) => setTariffs(data))
        .catch((err) => console.error("Failed to load tariffs:", err));
    });
  }, []);

  const isFiltered = users.length !== totalUsers.total;

  const getTariffName = (tariffId: number | null) => {
    if (!tariffId) return "-";
    const tariff = tariffs.find(t => t.id === tariffId);
    return tariff ? tariff.name : `ID: ${tariffId}`;
  };

  const handleSort = (column: string) => {
    let newSort = filters.sort;
    if (newSort.includes(column)) {
      if (newSort.startsWith("-")) {
        newSort = "-created_at";
      } else {
        newSort = "-" + column;
      }
    } else {
      newSort = column;
    }
    onFilterChange({
      sort: newSort,
    });
  };
  const handleStatusFilter = (e: any) => {
    onFilterChange({
      status: e.target.value.length > 0 ? e.target.value : undefined,
    });
  };

  const toggleAccordion = (index: number) => {
    setSelectedRow(index === selectedRow ? undefined : index);
  };

  return (
    <Box
      bg="rgba(255, 255, 255, 0.03)"
      backdropFilter="blur(20px) saturate(180%)"
      borderRadius="30px"
      border="1px solid rgba(255, 255, 255, 0.08)"
      boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.15)"
      overflow="hidden"
      _light={{
        bg: "rgba(255, 255, 255, 0.7)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      }}
    >
      <Box id="users-table" overflowX={{ base: "unset", md: "unset" }}>
      {/* Mobile Table */}
      <Box display={{ base: "block", md: "none" }}>
        <Accordion
          allowMultiple
          index={selectedRow}
        >
          <Table orientation="vertical" {...props} variant="unstyled">
            <Thead 
              position="relative"
              bg="rgba(102, 126, 234, 0.2)"
              _light={{ bg: "rgba(102, 126, 234, 0.15)" }}
            >
            <Tr>
              <Th
                minW="120px"
                pl={4}
                pr={4}
                cursor={"pointer"}
                onClick={handleSort.bind(null, "username")}
                color="rgba(255, 255, 255, 0.8)"
                _light={{ color: "gray.700" }}
                borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              >
                <HStack>
                  <span>{t("users")}</span>
                  <Sort sort={filters.sort} column="username" />
                </HStack>
              </Th>
              <Th
                minW="50px"
                pl={0}
                pr={0}
                w="140px"
                cursor={"pointer"}
                color="rgba(255, 255, 255, 0.8)"
                _light={{ color: "gray.700" }}
              >
                <HStack spacing={0} position="relative">
                  <Text
                    position="absolute"
                    userSelect="none"
                    pointerEvents="none"
                    zIndex={1}
                    w="100%"
                  >
                    {t("usersTable.status")}
                    {filters.status ? ": " + filters.status : ""}
                  </Text>
                  <Select
                    value={filters.sort}
                    fontSize="xs"
                    fontWeight="extrabold"
                    textTransform="uppercase"
                    cursor="pointer"
                    p={0}
                    border={0}
                    h="auto"
                    w="auto"
                    icon={<></>}
                    _focusVisible={{
                      border: "0 !important",
                    }}
                    onChange={handleStatusFilter}
                    sx={{
                      option: {
                        bg: "rgba(30, 40, 55, 0.98)",
                        backdropFilter: "blur(20px)",
                        color: "white",
                        py: "8px",
                        px: "12px",
                        fontSize: "sm",
                        fontWeight: "medium",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        _hover: {
                          bg: "rgba(102, 126, 234, 0.3)",
                        },
                        _light: {
                          bg: "rgba(255, 255, 255, 0.98)",
                          color: "gray.700",
                          _hover: {
                            bg: "rgba(102, 126, 234, 0.15)",
                          },
                        },
                      },
                    }}
                  >
                    <option></option>
                    <option>active</option>
                    <option>on_hold</option>
                    <option>disabled</option>
                    <option>limited</option>
                    <option>expired</option>
                  </Select>
                </HStack>
              </Th>
              <Th
                minW="100px"
                cursor={"pointer"}
                pr={0}
                onClick={handleSort.bind(null, "used_traffic")}
              >
                <HStack>
                  <span>{t("usersTable.dataUsage")}</span>
                  <Sort sort={filters.sort} column="used_traffic" />
                </HStack>
              </Th>
              <Th
                minW="32px"
                w="32px"
                p={0}
                cursor={"pointer"}
              ></Th>
            </Tr>
          </Thead>
          <Tbody>
            {!useTable &&
              users?.map((user, i) => {
                return (
                  <Fragment key={user.username}>
                    <Tr
                      onClick={toggleAccordion.bind(null, i)}
                      cursor="pointer"
                    >
                      <Td
                        borderBottom={0}
                        minW="100px"
                        pl={4}
                        pr={4}
                        maxW="calc(100vw - 50px - 32px - 100px - 48px)"
                      >
                        <div className="flex-status">
                          <OnlineBadge lastOnline={user.online_at} />
                          <Text isTruncated>{user.username}</Text>
                        </div>
                      </Td>
                      <Td borderBottom={0} minW="50px" pl={0} pr={0}>
                        <StatusBadge
                          compact
                          showDetail={false}
                          expiryDate={user.expire}
                          status={user.status}
                        />
                      </Td>
                      <Td borderBottom={0} minW="100px" pr={0}>
                        <UsageSliderCompact
                          totalUsedTraffic={user.lifetime_used_traffic}
                          dataLimitResetStrategy={
                            user.data_limit_reset_strategy
                          }
                          used={user.used_traffic}
                          total={user.data_limit}
                          colorScheme={statusColors[user.status].bandWidthColor}
                        />
                      </Td>
                      <Td p={0} borderBottom={0} w="32px" minW="32px">
                        <AccordionArrowIcon
                          color="gray.600"
                          _dark={{
                            color: "gray.400",
                          }}
                          transition="transform .2s ease-out"
                          transform={
                            selectedRow === i ? "rotate(180deg)" : "0deg"
                          }
                        />
                      </Td>
                    </Tr>
                    <Tr
                      className="collapsible"
                      onClick={toggleAccordion.bind(null, i)}
                    >
                      <Td p={0} colSpan={4}>
                        <AccordionItem border={0}>
                          <AccordionButton display="none"></AccordionButton>
                          <AccordionPanel
                            border={0}
                            cursor="pointer"
                            px={6}
                            py={3}
                          >
                            <VStack justifyContent="space-between" spacing="4">
                              <VStack
                                alignItems="flex-start"
                                w="full"
                                spacing={-1}
                              >
                                <Text
                                  textTransform="capitalize"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  color="gray.600"
                                  _dark={{
                                    color: "gray.400",
                                  }}
                                >
                                  Тариф
                                </Text>
                                <Text fontSize="sm" fontWeight="medium">
                                  {getTariffName(user.tariff_id)}
                                </Text>
                              </VStack>
                              <VStack
                                alignItems="flex-start"
                                w="full"
                                spacing={-1}
                              >
                                <Text
                                  textTransform="capitalize"
                                  fontSize="xs"
                                  fontWeight="bold"
                                  color="gray.600"
                                  _dark={{
                                    color: "gray.400",
                                  }}
                                >
                                  {t("usersTable.dataUsage")}
                                </Text>
                                <Box width="full" minW="230px">
                                  <UsageSlider
                                    totalUsedTraffic={
                                      user.lifetime_used_traffic
                                    }
                                    dataLimitResetStrategy={
                                      user.data_limit_reset_strategy
                                    }
                                    used={user.used_traffic}
                                    total={user.data_limit}
                                    colorScheme={
                                      statusColors[user.status].bandWidthColor
                                    }
                                  />
                                </Box>
                              </VStack>
                              <HStack w="full" justifyContent="space-between">
                                <Box width="full">
                                  <StatusBadge
                                    compact
                                    expiryDate={user.expire}
                                    status={user.status}
                                  />
                                  <OnlineStatus lastOnline={user.online_at} />
                                </Box>
                                <HStack>
                                  <ActionButtons user={user} />
                                  <Tooltip
                                    label={t("userDialog.editUser")}
                                    placement="top"
                                  >
                                    <IconButton
                                      aria-label="Edit user"
                                      bg="rgba(255, 255, 255, 0.05)"
                                      backdropFilter="blur(10px)"
                                      border="1px solid rgba(255, 255, 255, 0.1)"
                                      borderRadius="full"
                                      boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                                      color="white"
                                      w={{ base: "32px", md: "40px" }}
                                      h={{ base: "32px", md: "40px" }}
                                      minW="unset"
                                      p={0}
                                      _light={{
                                        bg: "rgba(255, 255, 255, 0.8)",
                                        border: "1px solid rgba(0, 0, 0, 0.1)",
                                        color: "gray.600",
                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                                      }}
                                      _hover={{
                                        bg: "rgba(255, 255, 255, 0.1)",
                                        _light: { bg: "rgba(255, 255, 255, 0.95)" },
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditingUser(user);
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                </HStack>
                              </HStack>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      </Td>
                    </Tr>
                  </Fragment>
                );
              })}
          </Tbody>
        </Table>
      </Accordion>
      </Box>
      
      {/* Desktop Table */}
      <Table
        orientation="vertical"
        display={{ base: "none", md: "table" }}
        variant="unstyled"
        {...props}
      >
        <Thead 
          position="relative"
          bg="linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(128, 90, 213, 0.12) 100%)"
          backdropFilter="blur(10px)"
          _light={{ bg: "linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(128, 90, 213, 0.08) 100%)" }}
        >
          <Tr>
            <Th
              minW="140px"
              cursor={"pointer"}
              onClick={handleSort.bind(null, "username")}
              color="rgba(255, 255, 255, 0.7)"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              py={3}
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              _light={{ color: "gray.600", borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}
            >
              <HStack>
                <span>{t("username")}</span>
                <Sort sort={filters.sort} column="username" />
              </HStack>
            </Th>
            <Th
              width="400px"
              minW="150px"
              cursor={"pointer"}
              color="rgba(255, 255, 255, 0.7)"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              py={3}
              _light={{ color: "gray.600" }}
            >
              <HStack position="relative" gap={"5px"}>
                <Text
                  userSelect="none"
                  pointerEvents="none"
                  zIndex={1}
                >
                  {t("usersTable.status")}
                  {filters.status ? ": " + filters.status : ""}
                </Text>
                <Text>/</Text>
                <Sort sort={filters.sort} column="expire" />
                <HStack onClick={handleSort.bind(null, "expire")}>
                  <Text>Sort by expire</Text>
                </HStack>
                <Select
                  fontSize="xs"
                  fontWeight="extrabold"
                  textTransform="uppercase"
                  cursor="pointer"
                  position={"absolute"}
                  p={0}
                  left={"-40px"}
                  border={0}
                  h="auto"
                  w="auto"
                  icon={<></>}
                  color="transparent"
                  bg="transparent"
                  display="none"
                  _focusVisible={{
                    border: "0 !important",
                    outline: "none",
                  }}
                  sx={{
                    option: {
                      bg: "rgba(30, 40, 55, 0.98)",
                      backdropFilter: "blur(20px)",
                      color: "white",
                      py: "8px",
                      px: "12px",
                      fontSize: "sm",
                      fontWeight: "medium",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      _hover: {
                        bg: "rgba(102, 126, 234, 0.3)",
                      },
                      _light: {
                        bg: "rgba(255, 255, 255, 0.98)",
                        color: "gray.700",
                        _hover: {
                          bg: "rgba(102, 126, 234, 0.15)",
                        },
                      },
                    },
                  }}
                  value={filters.sort}
                  onChange={handleStatusFilter}
                >
                  <option></option>
                  <option>active</option>
                  <option>on_hold</option>
                  <option>disabled</option>
                  <option>limited</option>
                  <option>expired</option>
                </Select>
              </HStack>
            </Th>
            <Th
              width="180px"
              minW="120px"
              cursor={"pointer"}
              onClick={handleSort.bind(null, "used_traffic")}
              color="rgba(255, 255, 255, 0.7)"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              py={3}
              _light={{ color: "gray.600" }}
            >
              <HStack>
                <span>{t("usersTable.dataUsage")}</span>
                <Sort sort={filters.sort} column="used_traffic" />
              </HStack>
            </Th>
            <Th
              width="120px"
              minW="100px"
              color="rgba(255, 255, 255, 0.7)"
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.05em"
              py={3}
              _light={{ color: "gray.600" }}
            >
              Тариф
            </Th>
            <Th
              width="200px"
              minW="180px"
            />
          </Tr>
        </Thead>
        <Tbody>
          {useTable &&
            users?.map((user, i) => {
              return (
                <Tr
                  key={user.username}
                  className={classNames("interactive", {
                    "last-row": i === users.length - 1,
                  })}
                  onClick={() => onEditingUser(user)}
                  cursor="pointer"
                  transition="all 0.25s ease"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.08)",
                    transform: "translateX(4px)",
                    _light: { bg: "rgba(0, 0, 0, 0.03)" },
                  }}
                  borderBottom="1px solid rgba(255, 255, 255, 0.06)"
                  _light={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
                >
                  <Td minW="140px">
                    <div className="flex-status">
                      <OnlineBadge lastOnline={user.online_at} />
                      {user.username}
                      <OnlineStatus lastOnline={user.online_at} />
                    </div>
                  </Td>
                  <Td width="400px" minW="150px">
                    <StatusBadge
                      expiryDate={user.expire}
                      status={user.status}
                    />
                  </Td>
                  <Td width="180px" minW="120px">
                    <UsageSliderCompact
                      totalUsedTraffic={user.lifetime_used_traffic}
                      dataLimitResetStrategy={user.data_limit_reset_strategy}
                      used={user.used_traffic}
                      total={user.data_limit}
                      colorScheme={statusColors[user.status].bandWidthColor}
                    />
                  </Td>
                  <Td width="120px" minW="100px">
                    <Text fontSize="sm" fontWeight="medium">
                      {getTariffName(user.tariff_id)}
                    </Text>
                  </Td>
                  <Td width="200px" minW="180px">
                    <ActionButtons user={user} />
                  </Td>
                </Tr>
              );
            })}
          {users.length == 0 && (
            <Tr>
              <Td colSpan={5}>
                <EmptySection isFiltered={isFiltered} />
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
      <Pagination />
    </Box>
    </Box>
  );
};

type ActionButtonsProps = {
  user: User;
};

const ActionButtons: FC<ActionButtonsProps> = ({ user }) => {
  const { setQRCode, setSubLink } = useDashboard();

  const proxyLinks = user.links.join("\r\n");

  const [copied, setCopied] = useState([-1, false]);
  useEffect(() => {
    if (copied[1]) {
      setTimeout(() => {
        setCopied([-1, false]);
      }, 1000);
    }
  }, [copied]);
  return (
    <HStack
      justifyContent="flex-end"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <CopyToClipboard
        text={
          user.subscription_url.startsWith("/")
            ? window.location.origin + user.subscription_url
            : user.subscription_url
        }
        onCopy={() => {
          setCopied([0, true]);
        }}
      >
        <div>
          <Tooltip
            label={
              copied[0] == 0 && copied[1]
                ? t("usersTable.copied")
                : t("usersTable.copyLink")
            }
            placement="top"
          >
            <IconButton
              aria-label="copy subscription link"
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="full"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              color="white"
              w={{ base: "32px", md: "40px" }}
              h={{ base: "32px", md: "40px" }}
              minW="unset"
              p={0}
              _light={{
                bg: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                color: "gray.600",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
              }}
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                _light: { bg: "rgba(255, 255, 255, 0.95)" },
              }}
            >
              {copied[0] == 0 && copied[1] ? (
                <CopiedIcon />
              ) : (
                <SubscriptionLinkIcon />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </CopyToClipboard>
      <CopyToClipboard
        text={proxyLinks}
        onCopy={() => {
          setCopied([1, true]);
        }}
      >
        <div>
          <Tooltip
            label={
              copied[0] == 1 && copied[1]
                ? t("usersTable.copied")
                : t("usersTable.copyConfigs")
            }
            placement="top"
          >
            <IconButton
              aria-label="copy configs"
              bg="rgba(255, 255, 255, 0.05)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="full"
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              color="white"
              w={{ base: "32px", md: "40px" }}
              h={{ base: "32px", md: "40px" }}
              minW="unset"
              p={0}
              _light={{
                bg: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                color: "gray.600",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
              }}
              _hover={{
                bg: "rgba(255, 255, 255, 0.1)",
                _light: { bg: "rgba(255, 255, 255, 0.95)" },
              }}
            >
              {copied[0] == 1 && copied[1] ? <CopiedIcon /> : <CopyIcon />}
            </IconButton>
          </Tooltip>
        </div>
      </CopyToClipboard>
      <Tooltip label="QR Code" placement="top">
        <IconButton
          aria-label="qr code"
          bg="rgba(255, 255, 255, 0.05)"
          backdropFilter="blur(10px)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="full"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
          color="white"
          w={{ base: "32px", md: "40px" }}
          h={{ base: "32px", md: "40px" }}
          minW="unset"
          p={0}
          _light={{
            bg: "rgba(255, 255, 255, 0.8)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            color: "gray.600",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          }}
          _hover={{
            bg: "rgba(255, 255, 255, 0.1)",
            _light: { bg: "rgba(255, 255, 255, 0.95)" },
          }}
          onClick={() => {
            setQRCode(user.links);
            setSubLink(user.subscription_url);
          }}
        >
          <QRIcon />
        </IconButton>
      </Tooltip>
    </HStack>
  );
};

type EmptySectionProps = {
  isFiltered: boolean;
};

const EmptySection: FC<EmptySectionProps> = ({ isFiltered }) => {
  const { onCreateUser } = useDashboard();
  return (
    <Box
      padding="5"
      py="8"
      display="flex"
      alignItems="center"
      flexDirection="column"
      gap={4}
      w="full"
    >
      <EmptySectionIcon
        maxHeight="200px"
        maxWidth="200px"
        _dark={{
          'path[fill="#fff"]': {
            fill: "gray.800",
          },
          'path[fill="#f2f2f2"], path[fill="#e6e6e6"], path[fill="#ccc"]': {
            fill: "gray.700",
          },
          'circle[fill="#3182CE"]': {
            fill: "primary.300",
          },
        }}
        _light={{
          'path[fill="#f2f2f2"], path[fill="#e6e6e6"], path[fill="#ccc"]': {
            fill: "gray.300",
          },
          'circle[fill="#3182CE"]': {
            fill: "primary.500",
          },
        }}
      />
      <Text fontWeight="medium" color="gray.600" _dark={{ color: "gray.400" }}>
        {isFiltered ? t("usersTable.noUserMatched") : t("usersTable.noUser")}
      </Text>
      {!isFiltered && (
        <CandyButton
          variant="primary"
          size="md"
          onClick={() => onCreateUser(true)}
        >
          {t("createUser")}
        </CandyButton>
      )}
    </Box>
  );
};
