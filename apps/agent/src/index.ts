import app from "./app";
import { env } from "./env";

// Start server
const port = env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}`);
});