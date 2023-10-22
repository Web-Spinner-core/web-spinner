import app from "./app";
import { env } from "./env";
import SmeeClient from "smee-client";

if (env.NODE_ENV === "development") {
  // Development webhook client
  const smee = new SmeeClient({
    source: "https://smee.io/QkyXAAfVb0awCQJh",
    target: "http://localhost:3000/webhooks",
    logger: console,
  });
  smee.start();
}

// Start server
const port = env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}`);
});
