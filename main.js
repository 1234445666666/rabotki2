import Fastify from "fastify";
import fastifyView from "@fastify/view";
import pug from "pug";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Register the @fastify/view plugin
fastify.register(fastifyView, {
  engine: {
    pug: pug,
  },
  root: path.join(__dirname, "views"), // Specify the directory where templates are located
  propertyName: "view", // The method name added to the reply object (default is 'view')
  viewExt: "pug", // The file extension for your templates
});

// Define a route that renders the pug template
fastify.get("/", (request, reply) => {
  // Use reply.view() to render the template and pass data
  reply.view("index.pug", { name: "World" });
});

fastify.get();

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
