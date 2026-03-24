import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectColumn } from '../entities/project-column.entity.js';
import { Project } from '../entities/project.entity.js';
import { User } from '../entities/user.entity.js';
import { CreateColumnDto } from './dto/create-column.dto.js';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(ProjectColumn)
    private readonly columnRepository: Repository<ProjectColumn>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  private async ensureProjectBelongsToUser(projectId: string, ownerId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }
    return project;
  }

  async findAllByProject(projectId: string, ownerId: string) {
    await this.ensureProjectBelongsToUser(projectId, ownerId);
    let cols = await this.columnRepository.find({
      where: { projectId },
      order: { order: 'ASC' },
    });
    if (cols.length === 0) {
      const defaults = [{ name: 'To Do', statusKey: 'TODO' }];
      for (let i = 0; i < defaults.length; i++) {
        const col = this.columnRepository.create({
          projectId,
          name: defaults[i].name,
          statusKey: defaults[i].statusKey,
          order: i,
        });
        await this.columnRepository.save(col);
        cols.push(col);
      }
    }
    return cols;
  }

  async create(projectId: string, owner: User, dto: CreateColumnDto) {
    await this.ensureProjectBelongsToUser(projectId, owner.id);
    const existing = await this.columnRepository.findOne({
      where: { projectId, statusKey: dto.statusKey },
    });
    if (existing) {
      throw new ConflictException(
        'Já existe uma coluna com esse status neste projeto',
      );
    }
    const maxOrder = await this.columnRepository
      .createQueryBuilder('col')
      .select('MAX(col.order)', 'max')
      .where('col.projectId = :projectId', { projectId })
      .getRawOne();
    const order = (maxOrder?.max ?? -1) + 1;
    const col = this.columnRepository.create({
      projectId,
      name: dto.name,
      statusKey: dto.statusKey,
      order,
    });
    return this.columnRepository.save(col);
  }
}
