import Fastify from "fastify";
import cors from "@fastify/cors";
import { binderRoutes } from "./routes/binders.js";
import { cardRoutes } from "./routes/cards.js";
import { taskRoutes } from "./routes/tasks.js";
import { caseRoutes } from "./routes/cases.js";
import { graphRoutes } from "./routes/graph.js";
import { citationRoutes } from "./routes/citations.js";
import { studySessionRoutes } from "./routes/studySessions.js";
import { searchRoutes } from "./routes/search.js";
import { pageRevisionRoutes } from "./routes/pageRevisions.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok" }));

await app.register(binderRoutes);
await app.register(cardRoutes);
await app.register(taskRoutes);
await app.register(caseRoutes);
await app.register(graphRoutes);
await app.register(citationRoutes);
await app.register(studySessionRoutes);
await app.register(searchRoutes);
await app.register(pageRevisionRoutes);

const port = Number(process.env.PORT ?? 4000);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
