import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Dynamically import and run the Express app
  const app = require("../backend/dist/app").default;
  return app(req, res);
}
