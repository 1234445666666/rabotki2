import Fastify from "fastify";
import fastifyView from "@fastify/view";
import fastifyFormbody from "@fastify/formbody";
import fastifyBcrypt from "fastify-bcrypt";
import pug from "pug";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Регистрация плагинов
fastify.register(fastifyView, {
  engine: { pug },
  root: path.join(__dirname, "views"),
});
fastify.register(fastifyFormbody);
fastify.register(fastifyBcrypt, { saltWorkFactor: 10 });

// Хук для преобразования владельцев в массив (для Задания 1)
fastify.addHook("preValidation", async (request) => {
  if (
    request.routerPath === "/cars" &&
    request.body &&
    typeof request.body.owners === "string"
  ) {
    request.body.owners = request.body.owners
      ? request.body.owners
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }
});

// ГЛАВНАЯ СТРАНИЦА
fastify.get("/", async (request, reply) => {
  return reply.view("index.pug", { currentYear: new Date().getFullYear() });
});

// ЗАДАНИЕ 1: МАШИНЫ (POST /cars)
fastify.post(
  "/cars",
  {
    schema: {
      body: {
        type: "object",
        required: ["make", "model", "year"],
        properties: {
          make: { type: "string", minLength: 1 },
          model: { type: "string", minLength: 1 },
          year: {
            type: "integer",
            minimum: 1886,
            maximum: new Date().getFullYear(),
          },
          owners: { type: "array", items: { type: "string" }, default: [] },
        },
      },
    },
  },
  async (request, reply) => {
    const { make, model, year } = request.body;
    return {
      message: `Автомобиль ${make} ${model} (${year}) успешно добавлен!`,
    };
  },
);

// ЗАДАНИЕ 2: РЕЦЕПТ (POST /secret-recipe — для JSON/Postman)
fastify.post(
  "/secret-recipe",
  {
    schema: {
      body: {
        type: "object",
        required: ["ingredients"],
        properties: {
          ingredients: {
            type: "array",
            items: { type: "string", minLength: 1 },
            minItems: 1,
          },
        },
      },
    },
  },
  async (request, reply) => {
    const hash = await fastify.bcrypt.hash(request.body.ingredients.join(", "));
    return { secret_code: hash };
  },
);

// ЗАДАНИЕ 2: РЕЦЕПТ (POST /secret-recipe-form — ЭТОГО НЕ ХВАТАЛО ДЛЯ PUG)
fastify.post("/secret-recipe-form", async (request, reply) => {
  const { ingredientsString } = request.body;
  // Превращаем строку из формы в массив
  const ingredients = ingredientsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Хешируем
  const secretHash = await fastify.bcrypt.hash(ingredients.join(", "));

  return {
    status: "success",
    original_ingredients: ingredients,
    secret_code: secretHash,
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
