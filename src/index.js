import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Routera } from "./router";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import { store } from "./context/store";
import { ChakraProvider } from "@chakra-ui/react";
import "./index.css"

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ChakraProvider>
      <Provider store={store}>
        <SnackbarProvider>
          <Routera />
        </SnackbarProvider>
      </Provider>
    </ChakraProvider>
  </BrowserRouter>
);
