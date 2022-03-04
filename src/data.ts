interface QueryPayload {
  query: string,
  variables?: {
    [key: string]: string | number | boolean
  }
}


const graphQL = (query: QueryPayload) =>
  fetch(`https://graphql.anilist.co`, {
    method: 'POST',
    body: JSON.stringify(query),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })
    .then(res => res.json())
    .then(json => {
      if (json.errors) throw json.errors; // trigger Promise.reject
      else return json.data; // unwrap data.data
    });


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
  createdAt: number,
}

export const getActivities = async (user: number, media: number) => {
  const all: Activity[] = [];

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
    if (!data.Page.pageInfo.hasNextPage) break;
  }

  return all;
}