import { Injectable } from '@nestjs/common'
import { DiscordService } from './service/discord.service'
import { Logger } from './shared/logger'
import { YoutubeVideoUtil } from './util/youtube-video.util'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  private readonly videoIds = new Set<string>()

  constructor(
    private readonly discordService: DiscordService,
  ) { }

  getHello(): string {
    return 'Hello World!'
  }

  public async addVideos(ids: string[]) {
    await Promise.allSettled(ids.map((id) => this.addVideo(id)))
  }

  public async addVideo(id: string) {
    if (this.videoIds.has(id)) {
      return
    }

    const url = YoutubeVideoUtil.getUrl(id)
    this.logger.log(`addVideo | ${JSON.stringify({ id, url })}`)
    this.videoIds.add(id)

    try {
      await this.discordService.send(url)
    } catch (error) {
      this.logger.error(`addVideo: ${error.message} | ${JSON.stringify({ id, error })}`)
    }
  }
}
