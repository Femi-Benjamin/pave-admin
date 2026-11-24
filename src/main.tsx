import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initClockFromSession, syncServerClock } from "./lib/serverClock";

// Date filters must not trust this computer's clock: restore the server time measured
// at login, and also read it from our own origin.
initClockFromSession();
void syncServerClock();

createRoot(document.getElementById("root")!).render(<App />);
