import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WebhookClient } from 'discord.js'
import { Logger } from '../shared/logger'

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name)

  private readonly webhookClient: WebhookClient

  constructor(
    private readonly configService: ConfigService,
  ) {
    const url = this.configService.get<string>('WEBHOOK_URL')
    if (url) {
      this.webhookClient = new WebhookClient({ url })
    }
  }

  public async send(msg?: string) {
    if (!this.webhookClient) {
      return
    }

    const content = [
      this.configService.get('WEBHOOK_MESSAGE'),
      msg,
    ]
      .filter((v) => v)
      .join('\n')
      .trim()

    if (!content) {
      return
    }

    try {
      const response = await this.webhookClient.send(content)
      this.logger.warn(`send | ${JSON.stringify({ content, response })}`)
    } catch (error) {
      this.logger.error(`send: ${error.message} | ${JSON.stringify({ content, error })}`)
    }
  }
}
