import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger } from './shared/logger'

async function bootstrap() {
  const logger = new Logger('Main')

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new Logger(),
  })

  app.enableShutdownHooks()

  logger.log('Ready!')
}

bootstrap()
