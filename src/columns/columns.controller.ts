import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { CurrentUser } from '../auth/user.decorator.js';
import { User } from '../entities/user.entity.js';

@Controller('projects/:projectId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: User) {
    return this.columnsService.findAllByProject(projectId, user.id);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnsService.create(projectId, user, dto);
  }
}
