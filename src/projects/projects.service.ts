import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity.js';
import { ProjectColumn } from '../entities/project-column.entity.js';
import { User } from '../entities/user.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

const DEFAULT_COLUMNS = [{ name: 'To Do', statusKey: 'TODO' }];

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectColumn)
    private readonly columnRepository: Repository<ProjectColumn>,
  ) {}

  async create(owner: User, dto: CreateProjectDto) {
    const project = this.projectRepository.create({
      name: dto.name,
      ownerId: owner.id,
    });
    const saved = await this.projectRepository.save(project);
    for (let i = 0; i < DEFAULT_COLUMNS.length; i++) {
      const col = this.columnRepository.create({
        projectId: saved.id,
        name: DEFAULT_COLUMNS[i].name,
        statusKey: DEFAULT_COLUMNS[i].statusKey,
        order: i,
      });
      await this.columnRepository.save(col);
    }
    return saved;
  }

  async findAllByOwner(ownerId: string) {
    return this.projectRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const project = await this.projectRepository.findOne({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }
    return project;
  }

  async remove(id: string, ownerId: string) {
    const project = await this.findOne(id, ownerId);
    await this.projectRepository.remove(project);
    return { deleted: true };
  }
}
