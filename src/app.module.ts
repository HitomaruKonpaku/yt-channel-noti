import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AppService } from './app.service'
import { DiscordService } from './service/discord.service'
import { InnertubeService } from './service/innertube.service'
import { YoutubeChannelTaskService } from './service/task/youtube-channel-task.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    AppService,
    DiscordService,
    InnertubeService,
    YoutubeChannelTaskService,
  ],
})
export class AppModule { }
