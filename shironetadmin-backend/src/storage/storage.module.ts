import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { R2StorageService } from './r2-storage.service';
import {
  R2_OPTSTOR_ENV_KEYS,
  R2_STATICSTOR_ENV_KEYS,
} from './r2-storage.env-keys';
import { R2_OPTSTOR, R2_STATICSTOR } from './r2-storage.tokens';

@Module({
  providers: [
    {
      provide: R2_OPTSTOR,
      useFactory: (config: ConfigService) =>
        new R2StorageService(config, R2_OPTSTOR_ENV_KEYS, 'opt-stor'),
      inject: [ConfigService],
    },
    {
      provide: R2_STATICSTOR,
      useFactory: (config: ConfigService) =>
        new R2StorageService(config, R2_STATICSTOR_ENV_KEYS, 'static-stor'),
      inject: [ConfigService],
    },
  ],
  exports: [R2_OPTSTOR, R2_STATICSTOR],
})
export class StorageModule {}
