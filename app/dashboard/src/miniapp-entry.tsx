import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { TelegramMiniApp } from "./components/TelegramMiniApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <TelegramMiniApp />
    </ChakraProvider>
  </React.StrictMode>
);
