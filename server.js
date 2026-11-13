import { preview } from "vite";

const port = Number(process.env.PORT || 10000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new RangeError("PORT must be an integer between 1 and 65535.");
}

await preview({
  preview: {
    host: "0.0.0.0",
    port,
    strictPort: true
  }
});
