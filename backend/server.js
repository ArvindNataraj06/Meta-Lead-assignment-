require("dotenv").config();

const express = require("express");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3000;
const leads = [];

// Keep the original request body for Meta signature checking
app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody = buffer;
    },
  })
);

// websocket which connect my mobile app
io.on("connection", (socket) => {
  console.log("Mobile app connected:", socket.id);

  socket.emit("leads:init", leads);

  socket.on("disconnect", () => {
    console.log("Mobile app disconnected:", socket.id);
  });
});

// Meta send get request to verify webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    process.env.META_VERIFY_TOKEN &&
    token === process.env.META_VERIFY_TOKEN &&
    typeof challenge === "string"
  ) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// check the signature of meta for security
function verifyMetaSignature(req) {
  const appSecret = process.env.META_APP_SECRET;
  const signature = req.get("x-hub-signature-256");

  if (!appSecret || !signature || !Buffer.isBuffer(req.rawBody)) {
    return false;
  }

  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(req.rawBody)
      .digest("hex");

  const received = Buffer.from(signature);
  const calculated = Buffer.from(expected);

  if (received.length !== calculated.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, calculated);
}

// Get name, email and phone from feild data Leadgen
function mapLeadData(data) {
  const fields = {};

  for (const field of data.field_data || []) {
    fields[field.name] = field.values?.[0] ?? null;
  }

  return {
    id: data.id,
    name: fields.full_name || fields.name || null,
    email: fields.email || null,
    phone: fields.phone_number || fields.phone || null,
  };
}

// get the  information using its ID
async function getLeadDetails(leadgenId) {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Meta access token is missing");
    return null;
  }

  const url = `https://graph.facebook.com/v26.0/${encodeURIComponent(leadgenId)}?fields=id,field_data`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Graph API error:", data.error?.message);
      return null;
    }

    return mapLeadData(data);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return null;
  }
}

// Process new lead got from Meta
async function processLeadEvents(payload) {
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== "leadgen") {
        continue;
      }

      const leadgenId = change.value?.leadgen_id;

      if (!leadgenId) {
        continue;
      }

      const lead = await getLeadDetails(leadgenId);

      if (!lead) {
        continue;
      }
      const alreadyExists = leads.some((item) => item.id === lead.id);

      if (alreadyExists) {
        continue;
      }

      leads.unshift(lead);
      io.emit("lead:new", lead);

      console.log("New lead added:", lead.id);
      console.log("Connected clients:", io.engine.clientsCount);
    }
  }
}
// Meta send the request here
app.post("/webhook", (req, res) => {
  if (!verifyMetaSignature(req)) {
    console.log("Invalid webhook signature");
    return res.sendStatus(403);
  }

  res.sendStatus(200);

  if (req.body?.object !== "page") {
    return;
  }

  processLeadEvents(req.body).catch((error) => {
    console.error("Error processing webhook:", error);
  });
});

// Privacy information for creating the form
app.get("/privacy-policy", (req, res) => {
  res.type("html").send(`
    <h1>Privacy Policy - Leads PoC Demo</h1>

    <p>This application is used to test Meta Lead Ads
    integration with a Node.js backend and React Native app.</p>

    <h3>Information Collected</h3>
    <p>The test forms may collect names, email addresses,
    and phone numbers.</p>

    <h3>How Information Is Used</h3>
    <p>The information is used to test lead retrieval
    and display leads in the mobile application.</p>

    <h3>Data Storage</h3>
    <p>Leads are stored temporarily in server memory
    and are cleared when the backend restarts.</p>

    <h3>Contact</h3>
    <p>For privacy questions or deletion requests:
    arvind061201@gmail.com</p>
  `);
});

// check ENV
const requiredEnv = [
  "META_VERIFY_TOKEN",
  "META_APP_SECRET",
  "META_ACCESS_TOKEN",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
