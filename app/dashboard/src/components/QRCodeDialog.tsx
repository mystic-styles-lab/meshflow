import {
  Box,
  chakra,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { QRCodeCanvas } from "qrcode.react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { useDashboard } from "../contexts/DashboardContext";
import { Icon } from "./Icon";

const QRCode = chakra(QRCodeCanvas);
const NextIcon = chakra(ChevronRightIcon, {
  baseStyle: {
    w: 6,
    h: 6,
    color: "gray.600",
    _dark: {
      color: "white",
    },
  },
});
const PrevIcon = chakra(ChevronLeftIcon, {
  baseStyle: {
    w: 6,
    h: 6,
    color: "gray.600",
    _dark: {
      color: "white",
    },
  },
});
const QRIcon = chakra(QrCodeIcon, {
  baseStyle: {
    w: 5,
    h: 5,
  },
});

export const QRCodeDialog: FC = () => {
  const { QRcodeLinks, setQRCode, setSubLink, subscribeUrl } = useDashboard();
  const isOpen = QRcodeLinks !== null;
  const [index, setIndex] = useState(0);
  const { t } = useTranslation();
  const onClose = () => {
    setQRCode(null);
    setSubLink(null);
  };

  const subscribeQrLink = String(subscribeUrl).startsWith("/")
    ? window.location.origin + subscribeUrl
    : String(subscribeUrl);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent 
        mx="3" 
        w="fit-content" 
        maxW="3xl"
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
          <Icon color="primary">
            <QRIcon color="white" />
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
        {QRcodeLinks && (
          <ModalBody
            gap={{
              base: "20px",
              lg: "50px",
            }}
            pr={{
              lg: "60px",
            }}
            px={{
              base: "50px",
            }}
            display="flex"
            justifyContent="center"
            flexDirection={{
              base: "column",
              lg: "row",
            }}
          >
            {subscribeUrl && (
              <VStack>
                <QRCode
                  mx="auto"
                  size={300}
                  p="2"
                  level={"L"}
                  includeMargin={false}
                  value={subscribeQrLink}
                  bg="white"
                />
                <Text display="block" textAlign="center" pb={3} mt={1}>
                  {t("qrcodeDialog.sublink")}
                </Text>
              </VStack>
            )}
            <Box w="300px">
              <Slider
                centerPadding="0px"
                centerMode={true}
                slidesToShow={1}
                slidesToScroll={1}
                dots={false}
                afterChange={setIndex}
                onInit={() => setIndex(0)}
                nextArrow={
                  <IconButton
                    size="sm"
                    position="absolute"
                    display="flex !important"
                    _before={{ content: '""' }}
                    aria-label="next"
                    mr="-4"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="full"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
                  >
                    <NextIcon />
                  </IconButton>
                }
                prevArrow={
                  <IconButton
                    size="sm"
                    position="absolute"
                    display="flex !important"
                    _before={{ content: '""' }}
                    aria-label="prev"
                    ml="-4"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="full"
                    boxShadow="0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    _light={{ bg: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)" }}
                    _hover={{ bg: "rgba(255, 255, 255, 0.1)", _light: { bg: "rgba(255, 255, 255, 0.95)" } }}
                  >
                    <PrevIcon />
                  </IconButton>
                }
              >
                {QRcodeLinks.map((link, i) => {
                  return (
                    <HStack key={i}>
                      <QRCode
                        mx="auto"
                        size={300}
                        p="2"
                        level={"L"}
                        includeMargin={false}
                        value={link}
                        bg="white"
                      />
                    </HStack>
                  );
                })}
              </Slider>
              <Text display="block" textAlign="center" pb={3} mt={1}>
                {index + 1} / {QRcodeLinks.length}
              </Text>
            </Box>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};
