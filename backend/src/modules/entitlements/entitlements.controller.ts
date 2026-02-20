import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EntitlementsService } from './entitlements.service';

@ApiTags('Entitlements')
@ApiBearerAuth()
@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlements: EntitlementsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get entitlements for current user tenant' })
  getMyEntitlements(@CurrentUser() user: any) {
    const tenant = user?.tenant;
    return this.entitlements.buildEntitlements({
      plan: tenant?.subscriptionPlan,
      status: tenant?.subscriptionStatus,
      endsAt: tenant?.subscriptionEndsAt,
    });
  }
}
