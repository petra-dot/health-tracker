import React from "react";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { UserProfileProvider } from "./src/contexts/UserProfileContext";
import { NotificationProvider } from "./src/contexts/NotificationContext";
import AppWrapper from "./src/components/AppWrapper";

export default function App() {
  return (
    <ThemeProvider>
      <UserProfileProvider>
        <NotificationProvider>
          <AppWrapper />
        </NotificationProvider>
      </UserProfileProvider>
    </ThemeProvider>
  );
}
