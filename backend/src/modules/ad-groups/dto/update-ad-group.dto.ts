import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAdGroupDto } from './create-ad-group.dto';

// Note: campaignId is omitted - cannot change parent campaign after creation
export class UpdateAdGroupDto extends PartialType(
    OmitType(CreateAdGroupDto, ['campaignId'] as const),
) { }
