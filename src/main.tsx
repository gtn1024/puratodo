import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";
import "./i18n"; // Initialize i18n
import { setAuthStoreServerUrlGetter } from "./lib/api/config";
import { useAuthStore } from "./stores/authStore";

// Initialize authStore getter for config module
setAuthStoreServerUrlGetter(() => {
  const state = useAuthStore.getState();
  const activeAccount = state.accounts.find(
    (account) => account.id === state.activeAccountId
  );
  return activeAccount?.serverUrl ?? null;
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
