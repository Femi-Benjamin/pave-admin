import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { syncServerClock } from "./lib/serverClock";

// Learn the real time from our own origin so date filters survive a wrong device clock.
void syncServerClock();

createRoot(document.getElementById("root")!).render(<App />);
