import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** 跳过 JWT（仅限登录、刷新等匿名端点） */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
