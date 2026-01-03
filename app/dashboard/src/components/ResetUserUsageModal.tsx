import {
  Box,
  Button,
  chakra,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  Toast,
  useToast,
} from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Icon } from "./Icon";
import { useDashboard } from "contexts/DashboardContext";
import { useTranslation, Trans } from "react-i18next";

export const ResetIcon = chakra(ArrowPathIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export type DeleteUserModalProps = {};

export const ResetUserUsageModal: FC<DeleteUserModalProps> = () => {
  const [loading, setLoading] = useState(false);
  const { resetUsageUser: user, resetDataUsage } = useDashboard();
  const { t } = useTranslation();
  const toast = useToast();
  const onClose = () => {
    useDashboard.setState({ resetUsageUser: null });
  };
  const onReset = () => {
    if (user) {
      setLoading(true);
      resetDataUsage(user)
        .then(() => {
          toast({
            title: t("resetUserUsage.success", {username: user.username}),
            status: "success",
            isClosable: true,
            position: "top",
            duration: 3000,
          });
        })
        .catch(() => {
          toast({
            title: t("resetUserUsage.error"),
            status: "error",
            isClosable: true,
            position: "top",
            duration: 3000,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };
  return (
    <Modal isCentered isOpen={!!user} onClose={onClose} size="sm">
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
        <ModalHeader pt={6} color="white" _light={{ color: "gray.900" }}>
          <Icon color="blue">
            <ResetIcon />
          </Icon>
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
        <ModalBody>
          <Text fontWeight="semibold" fontSize="lg" color="white" _light={{ color: "gray.900" }}>
            {t("resetUserUsage.title")}
          </Text>
          {user && (
            <Text
              mt={1}
              fontSize="sm"
              color="gray.400"
              _light={{ color: "gray.600" }}
            >
              <Trans
                components={{b: <b /> }}>
                {t("resetUserUsage.prompt", {username: user.username})}
              </Trans>
            </Text>
          )}
        </ModalBody>
        <ModalFooter display="flex" borderTop="1px solid rgba(255, 255, 255, 0.08)" _light={{ borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <Button 
            size="sm" 
            onClick={onClose} 
            mr={3} 
            w="full" 
            variant="outline"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="30px"
            color="white"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.700", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
          >
            {t("cancel")}
          </Button>
          <Button
            size="sm"
            w="full"
            colorScheme="blue"
            onClick={onReset}
            leftIcon={loading ? <Spinner size="xs" /> : undefined}
            bg="rgba(66, 153, 225, 0.8)"
            backdropFilter="blur(10px)"
            borderRadius="30px"
            border="1px solid rgba(255, 255, 255, 0.2)"
            color="white"
            boxShadow="0 4px 15px rgba(66, 153, 225, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            _hover={{ bg: "rgba(66, 153, 225, 0.9)", boxShadow: "0 6px 20px rgba(66, 153, 225, 0.5)" }}
            _light={{ bg: "rgba(66, 153, 225, 0.9)", _hover: { bg: "rgba(66, 153, 225, 1)" } }}
          >
            {t("reset")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
