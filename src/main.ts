import { getActivities, getUserId } from './data';

const app = document.querySelector<HTMLDivElement>('#app')!;
const templates = {
  canvas: document.querySelector<HTMLTemplateElement>('#template-canvas')!,
  error: document.querySelector<HTMLTemplateElement>('#template-error')!,
}


async function main(username: string, media: number) {

  const userId = await getUserId(username);
  const activities = await getActivities(userId, media);

  console.log(activities);

  // Now we just graph it...

}


// ------------------ Boilerplate ------------------


// Get username and mediaId from .env:
const envUser = import.meta.env.VITE_ANILIST_USERNAME;
const envMedia = import.meta.env.VITE_ANILIST_MEDIA_ID;

try {

  if (typeof envUser != 'string') throw new Error("Username missing from .env");
  if (typeof envMedia != 'string') throw new Error("Media ID missing from .env");

  const parsedMedia = parseInt(envMedia);
  if (isNaN(parsedMedia)) throw new Error("Media ID is not a number");

  await main(envUser, parsedMedia);

} catch (err: any) {

  const error = templates.error.content.cloneNode(true) as DocumentFragment;
  const pre = error.querySelector('pre');

  if (pre) pre.innerText = JSON.stringify(err, null, 2);
  app.appendChild(error);

}