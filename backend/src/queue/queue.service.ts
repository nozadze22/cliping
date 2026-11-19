import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

@Injectable()
export class QueueService {
  constructor(@InjectQueue('default') private readonly queue: Queue) {}

  add<T>(name: string, data: T): Promise<Job<T>> {
    return this.queue.add(name, data);
  }
}
