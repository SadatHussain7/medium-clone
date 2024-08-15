import { Hono } from "hono";

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@devhussain7/medium-common";

const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.split(" ")[1];
    if (!token) {
      c.status(401);
      return c.json({ error: "Unauthorized: No token provided" });
    }

    const payload = await verify(token, c.env.JWT_SECRET);
    if (!payload) {
      c.status(401);
      return c.json({ error: "Unauthorized: Invalid token" });
    }

    c.set("userId", payload.id as string);
    await next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    c.status(500);
    return c.json({ error: "Internal Server Error" });
  }
});

blogRouter.post("/", async (c) => {
  const body = await c.req.json();

  const { success } = createBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({ message: "Invalid input!" });
  }

  const authorId = c.get("userId");
  console.log("body: ", body, "authorId: ", authorId);

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: Number(authorId),
    },
  });
  console.log("blog: ", blog);
  console.log({
    title: body.title,
    content: body.content,
    authorId: Number(authorId),
  });
  return c.json({ id: blog.id, message: "Create blog success!" });
});

blogRouter.put("/", async (c) => {
  const body = await c.req.json();

  const { success } = updateBlogInput.safeParse(body);
  if (!success) {
    c.status(411);
    return c.json({ message: "Invalid input!" });
  }

  const userId = c.get("userId");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.post.update({
    where: {
      id: Number(body.id),
      authorId: Number(userId),
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.json({ id: blog.id });
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blogs = await prisma.post.findMany();
    return c.json({ blogs });
  } catch (error) {
    c.status(500);
    return c.json({ message: "Get blogs failed!" });
  }
});

blogRouter.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findFirst({
      where: {
        id,
      },
    });
    return c.json({ blog });
  } catch (error) {
    c.status(500);
    return c.json({ message: "Get blog failed!" });
  }
});

export default blogRouter;
