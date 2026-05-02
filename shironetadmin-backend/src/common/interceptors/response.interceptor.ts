import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';
  
  @Injectable()
  export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map(data => {
          // 如果数据已经包含 success 字段，直接返回
          if (data && typeof data === 'object' && 'success' in data) {
            return data;
          }
          
          // 否则包装成统一格式
          return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
          };
        }),
      );
    }
  }