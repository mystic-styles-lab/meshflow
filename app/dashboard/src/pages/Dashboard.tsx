import { Box, VStack, useColorModeValue, HStack, Button, IconButton, Tooltip } from "@chakra-ui/react";
import { CoreSettingsModal } from "components/CoreSettingsModal";
import { DeleteUserModal } from "components/DeleteUserModal";
import { Filters } from "components/Filters";
import { Footer } from "components/Footer";
import { Header } from "components/Header";
import { HostsDialog } from "components/HostsDialog";
import { Hosts } from "components/Hosts";
import { NodesDialog } from "components/NodesModal";
import { NodesUsage } from "components/NodesUsage";
import { QRCodeDialog } from "components/QRCodeDialog";
import { ResetAllUsageModal } from "components/ResetAllUsageModal";
import { ResetUserUsageModal } from "components/ResetUserUsageModal";
import { RevokeSubscriptionModal } from "components/RevokeSubscriptionModal";
import { UserDialog } from "components/UserDialog";
import { UsersTable } from "components/UsersTable";
import { BalancerDashboard } from "components/balancer/BalancerDashboard";
import { BalancerLogs } from "components/balancer/BalancerLogs";
import { UnifiedSettings } from "components/UnifiedSettings";
import { Nodes } from "components/Nodes";
import { TariffManagement } from "components/TariffManagement";
import { fetchInbounds, useDashboard } from "contexts/DashboardContext";
import { FC, useEffect, useState } from "react";
import { Statistics } from "../components/Statistics";
import { ChartPieIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

export const Dashboard: FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const {
    onResetAllUsage,
    onShowingNodesUsage,
  } = useDashboard();

  useEffect(() => {
    useDashboard.getState().refetchUsers();
    fetchInbounds();
  }, []);

  const containerBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box minH="100vh" bg={containerBg}>
      <VStack spacing={0} p="6">
        <Box w="full" maxW="1400px" mx="auto" mb={4}>
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
        </Box>
        
        <Box w="full" maxW="1400px" mx="auto">
          {activeTab === 0 && (
            <VStack spacing={6} align="stretch">
              <Statistics />
              <Filters />
              <UsersTable />
            </VStack>
          )}
          {activeTab === 1 && <BalancerDashboard />}
          {activeTab === 2 && <BalancerLogs />}
          {activeTab === 3 && <UnifiedSettings />}
          {activeTab === 4 && <TariffManagement />}
        </Box>

        <UserDialog />
        <DeleteUserModal />
        <QRCodeDialog />
        <HostsDialog />
        <ResetUserUsageModal />
        <RevokeSubscriptionModal />
        <NodesDialog />
        <NodesUsage />
        <ResetAllUsageModal />
        <CoreSettingsModal />
      </VStack>
      
      <Box mt={8}>
        <Footer />
      </Box>
    </Box>
  );
};

export default Dashboard;
