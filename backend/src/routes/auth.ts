import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthService } from "../lib/auth";
import { logger } from "../lib/logger";

export const authRouter = Router();

const registerSchema = z.object({
  tenantCode: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantCode: z.string().min(1),
});

authRouter.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { code: body.tenantCode },
    });

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    if (!tenant.isActive) {
      res.status(403).json({ error: "Tenant is inactive" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: body.email,
        },
      },
    });

    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const passwordHash = await AuthService.hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        createdAt: true,
      },
    });

    const token = AuthService.generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    });

    logger.info(`User registered: ${user.email} (tenant: ${tenant.code})`);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Registration error");
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { code: body.tenantCode },
    });

    if (!tenant || !tenant.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: body.email,
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await AuthService.comparePassword(
      body.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = AuthService.generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
    });

    logger.info(`User logged in: ${user.email} (tenant: ${tenant.code})`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.issues });
      return;
    }
    logger.error({ err: error }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tenantId: true,
        isActive: true,
        tenant: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error({ err: error }, "Get user error");
    res.status(401).json({ error: "Invalid or expired token" });
  }
});
