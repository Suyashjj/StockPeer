import "dotenv/config";
import http from "http";
import { env } from "./config/env";
import app from "./app";
import { initSocket } from "./socket";

const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`));