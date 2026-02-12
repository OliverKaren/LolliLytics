import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USER', 'lol_user'),
  password: configService.get<string>('DB_PASSWORD', 'lol_secret'),
  database: configService.get<string>('DB_NAME', 'lol_analytics'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  migrationsRun: false,
  ssl:
    configService.get<string>('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
