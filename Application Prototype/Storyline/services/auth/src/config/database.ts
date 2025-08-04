import { ConnectionOptions } from 'typeorm';
import { User } from '../entities/User';
import { Session } from '../entities/Session';
import { RefreshToken } from '../entities/RefreshToken';

export const ormConfig: ConnectionOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/storyline',
  entities: [User, Session, RefreshToken],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations'
  }
};