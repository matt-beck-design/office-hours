export const sources = {
  feeds: [
    {
      name: 'Gaming',
      topic: 'gaming news, game announcements, industry news, and rumors',
      breaking: [
        { name: 'VGC', type: 'rss', url: 'https://videogameschronicle.com/category/news/feed' },
        { name: 'Jez Corden', type: 'bluesky', handle: 'jezcorden.com' },
        { name: 'Jason Schreier', type: 'bluesky', handle: 'jasonschreier.bsky.social' },
        { name: 'Insider Gaming', type: 'rss', url: 'https://insider-gaming.com/feed' },
      ],
      daily: [
        { name: 'The Verge Games', type: 'rss', url: 'https://theverge.com/rss/games/index.xml' },
        { name: 'Windows Central', type: 'rss', url: 'https://windowscentral.com/rss.xml' },
        { name: 'NateTheHate', type: 'bluesky', handle: 'natethehate2.bsky.social' },
        { name: 'Jeff Grubb', type: 'bluesky', handle: 'grubb.wtf' },
        { name: 'Paul Tassi', type: 'bluesky', handle: 'paultassi.bsky.social' },
        { name: 'Gene Park', type: 'bluesky', handle: 'genepark.bsky.social' },
        { name: 'Andy Robinson', type: 'bluesky', handle: 'andyrobinson.bsky.social' },
      ],
    },
  ],
  youtube: [
    // Add channel objects here: { name: 'Channel Name', channelId: 'UC...' }
  ],
}
