export interface APIError {
  status: number,
  message: string,
  locations: { line: number, column: number }[],
}

export const isAPIerror = (obj: any): obj is APIError => {
  return (
    typeof obj['status'] == 'number' &&
    typeof obj['message'] == 'string' &&
    typeof obj['locations'] == 'object' &&
    Array.isArray(obj['locations']) &&
    obj['locations'].every(o => (
      typeof o['line'] == 'number' &&
      typeof o['column'] == 'number'
    ))
  );
}

const dateInt = (d: Date) => Math.floor(d.getTime() / 1000);


interface QueryPayload {
  query: string,
  variables?: {
    [key: string]: string | number | boolean
  }
}


const graphQL = async (query: QueryPayload) => {
  const data = await fetch(`https://graphql.anilist.co`, {
    method: 'POST',
    body: JSON.stringify(query),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }).then(res => res.json());

  if (data.errors) throw data.errors; // trigger reject
  else return data.data; // unwrap
}


export const getMediaName = async (media: number) => {
  const data = await graphQL({
    query: `
      query ($media: Int!) {
        Media(id: $media) {
          title {
            english
            native
          }
        }
      }
    `,
    variables: { media }
  });

  return data.Media.title as { english: string, native: string };
}


export const getUserId = async (username: string) => {
  const data = await graphQL({
    query: `
      query ($username: String) {
        User (name: $username) {
          id
        }
      }
    `,
    variables: { username }
  });

  return Number(data.User.id);
}


// Just for the fields we're getting
interface Activity {
  status: string,
  progress: string | null,
  createdAt: Date,
}

export const getActivities = async (user: number, media: number) => {
  const all: any[] = [];

  // Break from within
  while (true) {
    const data = await graphQL({
      query: `
        query ($user: Int, $media: Int) {
          Page (page: 1) {
            pageInfo {
              hasNextPage
            }
            activities (userId: $user, mediaId: $media) {
              ... on ListActivity {
                status
                progress
                createdAt
              }
            }
          }
        }
      `,
      variables: { user, media }
    });

    all.push(...data.Page.activities);
    if (!data || !data.Page.pageInfo.hasNextPage) break;
  }

  return all.map<Activity>(({ status, progress, createdAt }) => ({
    status,
    progress,
    createdAt: new Date(createdAt * 1000)
  }));
}


interface Schedule {
  episode: number,
  airingAt: Date,
}

export const getSchedule = async (media: number, startTime: Date) => {
  const all: any[] = [];

  try {
    // Get the episode that was most recent at `startTime`
    const data = await graphQL({
      query: `
        query ($media: Int, $startTime: Int) {
          AiringSchedule (mediaId: $media, airingAt_lesser: $startTime, sort: TIME_DESC) {
            airingAt
            episode
          }
        }
      `,
      variables: {
        media,
        startTime: dateInt(startTime),
      }
    });

    all.push(data.AiringSchedule);
  } catch (err: any) {
    if (Array.isArray(err) && err.every(isAPIerror) && err.some(e => e.status == 404)) {
      // If AniList doesn't have that far back, simply do nothing
    }

    else throw err;
  }

  // Now get the rest of them, capping at 2 weeks from today
  const today = new Date();
  const endTime = new Date(today.getTime() + (86400 * 14 * 1000));

  // Break from within
  while (true) {
    const data = await graphQL({
      query: `
        query ($media: Int, $startTime: Int, $endTime: Int) {
          Page {
            pageInfo {
              hasNextPage
            }
            airingSchedules (mediaId: $media, airingAt_greater: $startTime, airingAt_lesser: $endTime, sort: TIME) {
              airingAt
              episode
            }
          }
        }
      `,
      variables: {
        media,
        startTime: dateInt(startTime) - 1, // -1 for >=
        endTime: dateInt(endTime),
      }
    });

    all.push(...data.Page.airingSchedules);
    if (!data || !data.Page.pageInfo.hasNextPage) break;
  }

  return all.map<Schedule>(({ episode, airingAt }) => ({
    episode,
    airingAt: new Date(airingAt * 1000),
  }));
}