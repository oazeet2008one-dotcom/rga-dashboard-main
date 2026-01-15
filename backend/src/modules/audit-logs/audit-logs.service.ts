import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Audit Logs Service
 * 
 * Note: Schema V2 uses different field names:
 * - entityType (not resource)
 * - changes (not details)
 */
@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) { }

    async createLog(data: {
        userId?: string;
        action: string;
        resource: string;  // Maps to entityType
        details?: any;     // Maps to changes
        ipAddress?: string;
        userAgent?: string;
    }) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entityType: data.resource,  // Schema V2 field name
                    changes: data.details ? JSON.stringify(data.details) : null, // Schema V2 field name
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                },
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error to prevent blocking the main request
        }
    }
}
