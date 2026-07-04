import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: "/privacy",
    Component: Privacy,
  },
  {
    path: "/terms",
    Component: Terms,
  },
  {
    // Unknown paths fall back to the homepage instead of a blank screen
    path: "*",
    Component: Root,
  },
]);
