import {
  Box,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { FetchNodesQueryKey, useNodes } from "contexts/NodesContext";
import { FC } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "react-query";
import {
  generateErrorMessage,
  generateSuccessMessage,
} from "utils/toastHandler";
import { DeleteIcon, DeleteUserModalProps } from "./DeleteUserModal";
import { Icon } from "./Icon";

export const DeleteNodeModal: FC<DeleteUserModalProps> = ({
  deleteCallback,
}) => {
  const { deleteNode, deletingNode, setDeletingNode } = useNodes();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const onClose = () => {
    setDeletingNode(null);
  };

  const { isLoading, mutate: onDelete } = useMutation(deleteNode, {
    onSuccess: () => {
      generateSuccessMessage(
        t("deleteNode.deleteSuccess", {name: deletingNode && deletingNode.name}),
        toast
      );
      setDeletingNode(null);
      queryClient.invalidateQueries(FetchNodesQueryKey);
      deleteCallback && deleteCallback();
    },
    onError: (e) => {
      generateErrorMessage(e, toast);
    },
  });

  return (
    <Modal isCentered isOpen={!!deletingNode} onClose={onClose} size="sm">
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
          <Icon color="red">
            <DeleteIcon />
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
            {t("deleteNode.title")}
          </Text>
          {deletingNode && (
            <Text
              mt={1}
              fontSize="sm"
              color="gray.400"
              _light={{ color: "gray.600" }}
            >
              <Trans components={{ b: <b /> }}>
                {t("deleteNode.prompt", {name: deletingNode.name})}
              </Trans>
            </Text>
          )}
        </ModalBody>
        <ModalFooter display="flex" borderTop="1px solid rgba(255, 255, 255, 0.08)" _light={{ borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}>
          <Box
            as="button"
            onClick={onClose}
            mr={3}
            w="full"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="30px"
            px={4}
            py={2}
            fontSize="sm"
            fontWeight="500"
            color="white"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", color: "gray.700", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
            _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
            textAlign="center"
          >
            {t("cancel")}
          </Box>
          <Box
            as="button"
            onClick={() => onDelete()}
            w="full"
            bg="rgba(229, 62, 62, 0.8)"
            border="1px solid rgba(255, 255, 255, 0.2)"
            borderRadius="30px"
            px={4}
            py={2}
            fontSize="sm"
            fontWeight="600"
            color="white"
            boxShadow="0 4px 15px rgba(229, 62, 62, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            _hover={{ bg: "rgba(229, 62, 62, 0.9)", boxShadow: "0 6px 20px rgba(229, 62, 62, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            {isLoading && <Spinner size="xs" />}
            {t("delete")}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
