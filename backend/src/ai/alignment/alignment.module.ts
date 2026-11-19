import { Module } from '@nestjs/common';
import { TimestampAlignmentService } from './timestamp-alignment.service.js';

@Module({
  providers: [TimestampAlignmentService],
  exports: [TimestampAlignmentService],
})
export class AlignmentModule {}
