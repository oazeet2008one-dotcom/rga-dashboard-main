import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdGroupsService } from './ad-groups.service';
import { CreateAdGroupDto, UpdateAdGroupDto, QueryAdGroupsDto } from './dto';

@ApiTags('Ad Groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ad-groups')
export class AdGroupsController {
    constructor(private readonly adGroupsService: AdGroupsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new ad group' })
    @ApiResponse({ status: 201, description: 'Ad group created successfully' })
    @ApiResponse({ status: 403, description: 'Campaign does not belong to tenant' })
    async create(
        @Request() req,
        @Body() createAdGroupDto: CreateAdGroupDto,
    ) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.create(tenantId, createAdGroupDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all ad groups with filtering and pagination' })
    @ApiQuery({ name: 'campaignId', required: false, description: 'Filter by campaign ID' })
    @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
    @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findAll(@Request() req, @Query() query: QueryAdGroupsDto) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.findAll(tenantId, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an ad group by ID' })
    @ApiParam({ name: 'id', description: 'Ad Group ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Ad group found' })
    @ApiResponse({ status: 404, description: 'Ad group not found' })
    async findOne(
        @Request() req,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.findOne(tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an ad group' })
    @ApiParam({ name: 'id', description: 'Ad Group ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Ad group updated successfully' })
    @ApiResponse({ status: 404, description: 'Ad group not found' })
    async update(
        @Request() req,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAdGroupDto: UpdateAdGroupDto,
    ) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.update(tenantId, id, updateAdGroupDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an ad group (soft delete)' })
    @ApiParam({ name: 'id', description: 'Ad Group ID (UUID)' })
    @ApiResponse({ status: 200, description: 'Ad group deleted successfully' })
    @ApiResponse({ status: 404, description: 'Ad group not found' })
    async remove(
        @Request() req,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        const tenantId = req.user.tenantId;
        return this.adGroupsService.remove(tenantId, id);
    }
}
