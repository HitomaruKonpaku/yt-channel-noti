import { Injectable } from '@nestjs/common'
import Bottleneck from 'bottleneck'
import Innertube from 'youtubei.js'
import {
  CompactVideo,
  GridVideo,
  PlaylistPanelVideo,
  PlaylistVideo,
  ReelItem,
  ShortsLockupView,
  Video,
  WatchCardCompactVideo,
} from 'youtubei.js/dist/src/parser/nodes'
import { Channel } from 'youtubei.js/dist/src/parser/youtube'
import { Logger } from '../shared/logger'
import { InnertubeUtil } from '../util/innertube.util'
import { YoutubeVideoUtil } from '../util/youtube-video.util'

type InnertubeVideo = CompactVideo
  | GridVideo
  | PlaylistPanelVideo
  | PlaylistVideo
  | ReelItem
  | ShortsLockupView
  | Video
  | WatchCardCompactVideo

@Injectable()
export class InnertubeService {
  private readonly logger = new Logger(InnertubeService.name)

  private readonly clientLimiter = new Bottleneck({ maxConcurrent: 1 })

  private client: Innertube

  public async getChannel(channelId: string) {
    await this.initClient()
    const channel = await this.client.getChannel(channelId)
    return channel
  }

  public async getChannelActiveVideoIds(channelId: string, channel?: Channel, hasMembership = false): Promise<string[]> {
    // eslint-disable-next-line no-param-reassign
    channel = channel || await this.getChannel(channelId)

    const ids: string[] = []
    ids.push(...this.getActiveVideoIds(channel))

    if (channel.has_live_streams) {
      try {
        const res = await channel.getLiveStreams()
        ids.push(...this.getActiveVideoIds(res))
      } catch (error) {
        this.logger.warn(`getChannelActiveVideoIds#live: ${error.message} | ${JSON.stringify({
          channelId,
          hasMembership,
          name: InnertubeUtil.getTitle(channel),
        })}`)
      }
    }

    const res = [...new Set(ids)]
    return res
  }

  private getActiveVideoIds(channel: Channel): string[] {
    const videos = channel?.videos || []
    const ids = videos
      .filter((v) => this.filterVideo(v))
      .map((v) => v.id)
    return ids
  }

  private filterVideo(video: InnertubeVideo): boolean {
    if (YoutubeVideoUtil.isVideo(video)) {
      if (video.is_upcoming || video.is_live) {
        return true
      }
    }

    if (YoutubeVideoUtil.isGridVideo(video)) {
      if (video.is_upcoming || video.duration?.text === 'LIVE') {
        return true
      }
    }

    return false
  }

  private async initClient() {
    await this.clientLimiter.schedule(async () => {
      if (this.client) {
        return
      }
      this.client = await Innertube.create()
    })
  }
}
