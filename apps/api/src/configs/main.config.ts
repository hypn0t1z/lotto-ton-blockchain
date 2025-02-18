import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MainConfig {
  @IsNotEmpty()
  @IsNumber()
  port: number;

  @IsNotEmpty()
  @IsNumber()
  workerPort: number;

  @IsNotEmpty()
  @IsBoolean()
  isProduction: boolean;

  @IsNotEmpty()
  @IsString()
  apiPrefix: string;

  constructor() {
    this.port = Number(process.env.PORT) || 3000;
    this.workerPort = Number(process.env.WORKER_PORT) || 3001;
    this.isProduction = process.env.PRODUCTION === 'true';
    this.apiPrefix = 'api';
  }
}

export default registerAs<MainConfig>('main', () => new MainConfig());
