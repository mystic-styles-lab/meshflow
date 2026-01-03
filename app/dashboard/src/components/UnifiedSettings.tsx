import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, useMediaQuery, Menu, MenuButton, MenuList, MenuItem, Button, Icon } from "@chakra-ui/react";
import { FC, useState } from "react";
import { Hosts } from "./Hosts";
import { Nodes } from "./Nodes";
import { Settings } from "./Settings";
import { ServerIcon, ComputerDesktopIcon, Cog6ToothIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export const UnifiedSettings: FC = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [tabIndex, setTabIndex] = useState(0);

  const tabs = [
    { name: "Хосты", icon: ServerIcon },
    { name: "Узлы", icon: ComputerDesktopIcon },
    { name: "Конфигурация", icon: Cog6ToothIcon },
  ];

  return (
    <Box minH="600px">
      {isMobile ? (
        <Box mb={4}>
          <Menu>
            <MenuButton as={Button} rightIcon={<Icon as={ChevronDownIcon} />} w="full">
              {tabs[tabIndex].name}
            </MenuButton>
            <MenuList>
              {tabs.map((tab, index) => (
                <MenuItem key={tab.name} onClick={() => setTabIndex(index)} icon={<Icon as={tab.icon} />}>
                  {tab.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Box mt={4}>
            {tabIndex === 0 && <Hosts />}
            {tabIndex === 1 && <Nodes />}
            {tabIndex === 2 && <Settings />}
          </Box>
        </Box>
      ) : (
        <Tabs orientation="vertical" variant="unstyled" h="full" display="flex" gap={6} index={tabIndex} onChange={setTabIndex}>
          <TabList w="200px" py={2} display="flex" flexDirection="column" gap={3}>
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                justifyContent="flex-start"
                px={4}
                py={3}
                borderRadius="30px"
                border="1px solid rgba(255, 255, 255, 0.08)"
                bg="rgba(255, 255, 255, 0.03)"
                backdropFilter="blur(20px) saturate(180%)"
                color="rgba(255, 255, 255, 0.7)"
                fontWeight="600"
                transition="all 0.3s ease"
                boxShadow="inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)"
                _selected={{
                  bg: "rgba(102, 126, 234, 0.5)",
                  borderColor: "rgba(102, 126, 234, 0.5)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2)"
                }}
                _light={{
                  bg: "rgba(255, 255, 255, 0.8)",
                  borderColor: "rgba(0, 0, 0, 0.1)",
                  color: "rgba(0, 0, 0, 0.7)",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 1)",
                  _selected: {
                     bg: "rgba(102, 126, 234, 0.8)",
                     borderColor: "rgba(102, 126, 234, 0.8)",
                     color: "white",
                     boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.5)"
                  }
                }}
              >
                <Icon as={tab.icon} mr={3} w={5} h={5} />
                {tab.name}
              </Tab>
            ))}
          </TabList>

          <TabPanels flex={1} h="full" overflowY="auto">
            <TabPanel p={0}>
              <Hosts />
            </TabPanel>
            <TabPanel p={0}>
              <Nodes />
            </TabPanel>
            <TabPanel p={0}>
              <Settings />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};
