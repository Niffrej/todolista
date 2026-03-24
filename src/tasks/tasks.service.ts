import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity.js';
import { Project } from '../entities/project.entity.js';
import { User } from '../entities/user.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { QueryTasksDto } from './dto/query-tasks.dto.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
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

  async create(user: User, dto: CreateTaskDto) {
    await this.ensureProjectBelongsToUser(dto.projectId, user.id);
    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? '',
      status: dto.status ?? 'TODO',
      projectId: dto.projectId,
      assignedToId: dto.assignedToId ?? null,
    });
    return this.taskRepository.save(task);
  }

  async findAll(user: User, query: QueryTasksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('project.ownerId = :ownerId', { ownerId: user.id })
      .orderBy('task.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }
    if (query.projectId) {
      qb.andWhere('task.projectId = :projectId', { projectId: query.projectId });
    }

    const [items, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: User) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'assignedTo'],
    });
    if (!task || task.project.ownerId !== user.id) {
      throw new NotFoundException('Task não encontrada');
    }
    return task;
  }

  async update(id: string, user: User, dto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!task || task.project.ownerId !== user.id) {
      throw new NotFoundException('Task não encontrada');
    }
    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.assignedToId !== undefined) task.assignedToId = dto.assignedToId;
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!task || task.project.ownerId !== user.id) {
      throw new NotFoundException('Task não encontrada');
    }
    await this.taskRepository.remove(task);
    return { deleted: true };
  }
}
