import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  chakra,
  FormControl,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Footer } from "components/Footer";
import { fetch } from "service/http";
import { removeAuthToken, setAuthToken } from "utils/authStorage";
import { useTranslation } from "react-i18next";
import { Language } from "components/Language";
import logoSrc from "../assets/logo.svg";

const schema = z.object({
  username: z.string().min(1, "login.fieldRequired"),
  password: z.string().min(1, "login.fieldRequired"),
});

const LoginIcon = chakra(ArrowRightOnRectangleIcon, {
  baseStyle: {
    w: 5,
    h: 5,
    strokeWidth: "2px",
  },
});

export const Login: FC = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const logoFilter = useColorModeValue("none", "invert(1)");
  let location = useLocation();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: zodResolver(schema),
  });
  useEffect(() => {
    removeAuthToken();
    if (location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, []);
  const login = (values: FieldValues) => {
    setError("");
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("grant_type", "password");
    setLoading(true);
    fetch("/admin/token", { method: "post", body: formData })
      .then(({ access_token: token }) => {
        setAuthToken(token);
        navigate("/");
      })
      .catch((err) => {
        setError(err.response._data.detail);
      })
      .finally(setLoading.bind(null, false));
  };
  return (
    <VStack 
      justifyContent="center" 
      alignItems="center"
      minH="100vh" 
      p="6" 
      w="full"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
    >
      <Box position="absolute" top={4} right={4}>
        <Language />
      </Box>
      
      <Box 
        w="full" 
        maxW="400px"
        bg="rgba(255, 255, 255, 0.9)"
        _dark={{ bg: "rgba(30, 30, 40, 0.9)" }}
        backdropFilter="blur(20px)"
        borderRadius="30px"
        border="1px solid"
        borderColor="rgba(0, 0, 0, 0.1)"
        sx={{ _dark: { borderColor: "rgba(255, 255, 255, 0.1)" } }}
        p={8}
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
      >
        <VStack spacing={6} w="full">
          <VStack spacing={4}>
            <img 
              src={logoSrc} 
              alt="Logo" 
              style={{ 
                width: "88px", 
                height: "44px",
                filter: logoFilter 
              }} 
            />
            <Text fontSize="2xl" fontWeight="bold">
              {t("login.loginYourAccount")}
            </Text>
            <Text color="gray.500" fontSize="sm">
              {t("login.welcomeBack")}
            </Text>
          </VStack>
          
          <form onSubmit={handleSubmit(login)} style={{ width: "100%" }}>
            <VStack spacing={4} w="full">
              <FormControl>
                <Input
                  size="md"
                  placeholder={t("username")}
                  {...register("username")}
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.5)"
                  border="1px solid rgba(0, 0, 0, 0.1)"
                  _dark={{ 
                    bg: "rgba(255, 255, 255, 0.05)", 
                    border: "1px solid rgba(255, 255, 255, 0.1)" 
                  }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  _placeholder={{ color: "gray.400" }}
                />
                {errors?.username?.message && (
                  <Text color="red.400" fontSize="xs" mt={1} pl={3}>
                    {t(errors.username.message as string)}
                  </Text>
                )}
              </FormControl>
              
              <FormControl>
                <Input
                  size="md"
                  type="password"
                  placeholder={t("password")}
                  {...register("password")}
                  borderRadius="20px"
                  bg="rgba(255, 255, 255, 0.5)"
                  border="1px solid rgba(0, 0, 0, 0.1)"
                  _dark={{ 
                    bg: "rgba(255, 255, 255, 0.05)", 
                    border: "1px solid rgba(255, 255, 255, 0.1)" 
                  }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                  _placeholder={{ color: "gray.400" }}
                />
                {errors?.password?.message && (
                  <Text color="red.400" fontSize="xs" mt={1} pl={3}>
                    {t(errors.password.message as string)}
                  </Text>
                )}
              </FormControl>
              
              {error && (
                <Alert status="error" borderRadius="15px" bg="red.50" _dark={{ bg: "rgba(254, 178, 178, 0.1)" }}>
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                isLoading={loading}
                type="submit"
                w="full"
                h="45px"
                borderRadius="20px"
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                _active={{ bg: "blue.700" }}
                fontWeight="medium"
                mt={2}
              >
                <LoginIcon marginRight={2} />
                {t("login")}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
      
      <Box position="absolute" bottom={4}>
        <Footer />
      </Box>
    </VStack>
  );
};

export default Login;
