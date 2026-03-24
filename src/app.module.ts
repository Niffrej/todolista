import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { ColumnsModule } from './columns/columns.module.js';
import { User } from './entities/user.entity.js';
import { Project } from './entities/project.entity.js';
import { Task } from './entities/task.entity.js';
import { ProjectColumn } from './entities/project-column.entity.js';

function typeOrmConfig(): TypeOrmModuleOptions {
  const entities = [User, Project, Task, ProjectColumn];
  const synchronize =
    process.env.NODE_ENV !== 'production' ||
    process.env.TYPEORM_SYNCHRONIZE === 'true';

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities,
      synchronize,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'roadmap',
    entities,
    synchronize,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    AuthModule,
    ProjectsModule,
    TasksModule,
    ColumnsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
