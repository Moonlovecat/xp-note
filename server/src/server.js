import { createApp } from "./app.js";
import { getConfig } from "./config.js";
import { prisma } from "./db.js";

const config = getConfig();
const app = createApp(prisma);

if (process.env.NODE_ENV !== "production") {
  app.listen(config.port, config.host, () => {
    console.log(`Weenai server running at http://${config.host}:${config.port}`);
  });
}

export default app;

