import { getActivities, getMediaName, getSchedule, getUserId } from './data';
import './style.scss';


const body = {
  title: document.querySelector<HTMLSpanElement>('#anime-title')!,
  canvas: document.querySelector<HTMLDivElement>('#canvas-wrapper')!,
  error: document.querySelector<HTMLDivElement>('#main-error')!,
}

const hide = (el: HTMLElement) => el.classList.add('hidden');
const show = (el: HTMLElement) => el.classList.remove('hidden');


async function main(username: string, media: number) {

  const userId = await getUserId(username);
  const activities = await getActivities(userId, media);

  console.log(activities);

  if (activities.length) {
    // Use the time from the very first status they have as the startTime
    const startTime = activities[0].createdAt;
    const schedules = await getSchedule(media, startTime);

    console.log(schedules);
  }

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

  await getMediaName(parsedMedia).then(({ english, native }) => {
    if (english == native) {
      body.title.innerText = native;
    } else {
      body.title.innerText = `${english} / ${native}`;
    }
  });

  await main(envUser, parsedMedia);

} catch (err: any) {

  const pre = body.error.querySelector('pre');
  if (pre) pre.innerText = JSON.stringify(err, null, 2);
  show(body.error);

}