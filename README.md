# My One Piece progress

Since it's so long, I wanted a graph to show my progress watching One Piece. I
want to see how close I am to catching up to the show. It pulls from AniList's
API using my username and One Piece's media ID.

Right now it just slaps all the data-points in a Chart.js graph, and it doesn't
look very pretty. If I ever feel like it maybe I'll get fancy with D3.js
instead. Things I'd wanna add are:

- Projected watch completion, probably just using a linear regression
- A broken y-axis, so there isn't so much blank space.
- Better edge-case handling

---

This repo can be used as a template pretty easily. Just change your username and
media-ID in [`.env`](./.env). If you have any problems with your specific
AniList data, let me know with an issue and maybe I'll take a look at it.

You can find an anime's `mediaId` from its URL:

```
https://anilist.co/anime/21/ONE-PIECE/
                         ↑↑
```