import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesModule } from './games/games.module';
import { UserPresenceModule } from './userPresence/userPresence.module';

// This app is scoped to the games microservice: Games (hub + quiz) +
// presence only. Friends and Messages were pulled out — they'll come back as
// their own separate services (a friends service, plus a separate auth
// service), not as modules in here.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // main.ts runs from dist/src, so the repo-root .env is three levels up.
      envFilePath: resolve(__dirname, '../../../.env'),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    GamesModule,
    UserPresenceModule,
  ],
})
export class AppModule {}
