import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const AppRoot = () => (
  <StrictMode>
    <BrowserRouter>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <>
          {console.warn("VITE_CLERK_PUBLISHABLE_KEY not set — rendering without Clerk")}
          <App />
        </>
      )}
    </BrowserRouter>
  </StrictMode>
);

const root = document.getElementById("root");
if (!root) throw new Error("#root not found in index.html");
createRoot(root).render(<AppRoot />);
