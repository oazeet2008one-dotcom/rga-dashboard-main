/**
 * =============================================================================
 * Dependency Injection Container
 * =============================================================================
 * 
 * Design Principles:
 * - Inversion of Control (IoC): Dependencies are injected, not created
 * - Composition Root: All wiring happens here
 * - Singleton by Default: Services are reused
 * - Explicit Registration: No auto-scanning (magic)
 * 
 * Using TSyringe for decorator-based DI with zero boilerplate
 * =============================================================================
 */

import 'reflect-metadata';
import { container, Lifecycle, injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ILogger, ICommandRegistry, ISessionStore, IToolkitConfiguration } from './contracts';

// Token symbols for injection (prevents string collision)
export const TOKENS = {
    Logger: Symbol('Logger'),
    Config: Symbol('Config'),
    CommandRegistry: Symbol('CommandRegistry'),
    SessionStore: Symbol('SessionStore'),
    PrismaClient: Symbol('PrismaClient'),
    VerificationService: Symbol('VerificationService'),
    ReportWriter: Symbol('ReportWriter'),
} as const;

/**
 * Service Locator (Anti-pattern when abused, but necessary for CLI entry point)
 * Used only at composition root and legacy integration points
 */
export class ServiceLocator {
    static resolve<T>(token: symbol): T {
        return container.resolve<T>(token);
    }
    
    static register<T>(token: symbol, implementation: new (...args: unknown[]) => T): void {
        container.register(token, { useClass: implementation }, { lifecycle: Lifecycle.Singleton });
    }
    
    static registerInstance<T>(token: symbol, instance: T): void {
        container.registerInstance(token, instance);
    }
}

/**
 * Initialize container with all dependencies
 * Called once at application startup
 */
export function initializeContainer(config: IToolkitConfiguration): void {
    // Register configuration as constant
    container.registerInstance(TOKENS.Config, config);
    
    // Register core services (order matters for dependencies)
    // These will be implemented in next steps
    // For now, we'll register placeholders
    
    // Register Prisma (from existing codebase)
    const prisma = new PrismaClient({
        log: config.logging.level === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    container.registerInstance(TOKENS.PrismaClient, prisma);
}

/**
 * Cleanup resources on shutdown
 */
export async function disposeContainer(): Promise<void> {
    const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
    await prisma.$disconnect();
    
    // Clear all registrations
    container.clearInstances();
}
