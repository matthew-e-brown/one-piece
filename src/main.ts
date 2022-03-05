import './style.scss';

import { getActivities, getMediaName, getSchedule, getUserId } from './data';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-luxon';


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

  if (!activities.length) {
    /// @TODO: Display error
    return;
  }

  // Use the time from the very first status they have as the startTime
  const startTime = activities[0].createdAt;
  const schedules = await getSchedule(media, startTime);

  console.log(schedules);

  if (!schedules.length) {
    /// @TODO: Display error
    return;
  }

  const activityData = activities
    .map(activity => {
      const x: Date = activity.createdAt;
      const y: number = activity.progress !== null
        ? Number(activity.progress.match(/\d+ - (\d+)/)?.[1])
        : 0;

      return activity.progress === null
        ? { x, y, label: 'Added to plan-to-watch' }
        : { x, y };
    });

  console.log(activityData);

  const chart = new Chart(body.canvas.querySelector('canvas')!, {
    type: 'line',
    data: {
      datasets: [
        {
          data: activityData,
          label: 'Progress',
          stepped: true,
          borderColor: '#0061d1',
          fill: '#0061d1',
        }
      ]
    },
    options: {
      scales: {
        x: { type: 'time' }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const point: any = context.dataset.data[context.dataIndex];
              switch (context.datasetIndex) {
                // If it's the activity progress
                case 0:
                  if (point.label) return point.label;
                  else return `Watched up to episode ${context.formattedValue}`;
                // If it's the show progress
              }
            }
          }
        }
      }
    }
  });

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

  // Add the title first
  await getMediaName(parsedMedia).then(({ english, native }) => {
    if (english == native) {
      body.title.innerText = native;
    } else {
      body.title.innerText = `${english} / ${native}`;
    }
  });

  // Setup chart.js
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
  );

  await main(envUser, parsedMedia);

} catch (err: any) {

  console.error(err);

  const pre = body.error.querySelector('pre');
  if (pre) pre.innerText = JSON.stringify(err, null, 2);
  show(body.error);

}


// for testing
show(body.canvas);