import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";
import { startScheduledJobs } from "./jobs/scheduledJobs";

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`AssetFlow API listening on http://localhost:${PORT}`);
  startScheduledJobs();
});
