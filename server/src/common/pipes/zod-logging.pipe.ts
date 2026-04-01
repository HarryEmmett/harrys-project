import { ArgumentMetadata, Injectable } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';

@Injectable()
export class ZodLoggingPipe<T> extends ZodValidationPipe {
  constructor(schema: z.ZodType<T>) {
    super(schema);
  }

  override async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<T> {
    try {
      return (await super.transform(value, metadata)) as T;
    } catch (error) {
      console.error('Unexpected error:', (error as Error).message);
      throw error;
    }
  }
}
