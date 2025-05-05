import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SchedulerRegistry } from '@nestjs/schedule'
import Bottleneck from 'bottleneck'
import { AppService } from '../../app.service'
import { Logger } from '../../shared/logger'
import { InnertubeService } from '../innertube.service'

@Injectable()
export class YoutubeChannelTaskService implements OnModuleInit {
  private readonly logger = new Logger(YoutubeChannelTaskService.name)

  private readonly name = 'youtube:channel'

  private readonly channelLimiter = new Bottleneck({ maxConcurrent: 1 })

  constructor(
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly appService: AppService,
    private readonly innertubeService: InnertubeService,
  ) { }

  private get channelIds() {
    const s = this.configService.get<string>('CHANNEL_ID') || ''
    const ids = s
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v)
    return ids
  }

  onModuleInit() {
    const sec = Number(this.configService.get('CHANNEL_INTERVAL')) || 5
    const ms = sec * 1000
    this.logger.verbose(`CHANNEL_INTERVAL: ${sec}`)
    this.logger.verbose(`CHANNEL_ID: ${JSON.stringify(this.channelIds)}`)

    this.schedulerRegistry.addInterval(this.name, setInterval(
      () => this.onTick(),
      ms,
    ))
  }

  async onTick() {
    // this.logger.debug('onTick')
    await Promise.all(this.channelIds.map((id) => this.channelLimiter.schedule(() => this.handleChannel(id))))
  }

  private async handleChannel(id: string) {
    try {
      const videoIds = await this.innertubeService.getChannelActiveVideoIds(id)
      await this.appService.addVideos(videoIds)
    } catch (error) {
      this.logger.error(`handleChannel: ${error.message} | ${JSON.stringify({ id, error })}`)
    }
  }
}
