import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColumnsController } from './columns.controller.js';
import { ColumnsService } from './columns.service.js';
import { ProjectColumn } from '../entities/project-column.entity.js';
import { Project } from '../entities/project.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectColumn, Project]),
  ],
  controllers: [ColumnsController],
  providers: [ColumnsService],
  exports: [ColumnsService],
})
export class ColumnsModule {}
