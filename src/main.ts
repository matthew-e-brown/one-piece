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
  title: document.querySelector<HTMLSpanElement>('#title')!,
  canvas: document.querySelector<HTMLDivElement>('#canvas-wrapper')!,
  error: document.querySelector<HTMLDivElement>('#main-error')!,
}

const show = (el: HTMLElement) => el.classList.remove('hidden');


async function main(username: string, media: number) {

  type DataPoint = { x: Date, y: number, label?: string };

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
    .map<DataPoint>(activity => {
      const x: Date = activity.createdAt;
      const y: number = activity.progress !== null
        ? Number(activity.progress.match(/\d+ - (\d+)/)?.[1])
        : 0;

      return activity.progress === null
        ? { x, y, label: 'Added to plan-to-watch' }
        : { x, y };
    });

  const scheduleData = schedules
    .map<DataPoint>(schedule => ({
      x: schedule.airingAt,
      y: schedule.episode,
    }));

  new Chart(body.canvas.querySelector('canvas')!, {
    type: 'line',
    data: {
      datasets: [
        {
          data: activityData,
          label: 'Progress',
          stepped: true,
          borderColor: '#0061d1',
          fill: '#0061d1',
        },
        {
          data: scheduleData,
          label: 'Goal',
          stepped: true,
          borderColor: '#d10061',
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'time',
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              // If the point has a custom label defined, use it
              const point: any = context.dataset.data[context.dataIndex];
              if (point.label) return point.label;

              // Otherwise
              switch (context.datasetIndex) {
                // If it's the activity progress
                case 0:
                  return `Watched up to episode ${context.formattedValue}`;
                // If it's the show progress
                case 1:
                  const time = (context.raw as DataPoint).x;
                  const s = (time.getTime() > new Date().getTime()) ? 'airs' : 'aired';
                  return `Episode ${context.formattedValue} ${s}`;
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

// Need a boilerplate function since top-level await is not yet supported in
// most browsers (or at least Vite tells me it doesn't lol)
async function bootstrap() {
  try {

    if (typeof envUser != 'string') throw new Error("Username missing from .env");
    if (typeof envMedia != 'string') throw new Error("Media ID missing from .env");

    const parsedMedia = parseInt(envMedia);
    if (isNaN(parsedMedia)) throw new Error("Media ID is not a number");

    // Add the title first
    const title = await getMediaName(parsedMedia);

    document.title = `${envUser}'s ${title.english} Progress`;
    body.title.innerText = title.english == title.native
      ? `${envUser}'s ${title.native}`
      : `${envUser}'s ${title.english} / ${title.native}`;

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
    show(body.canvas);

  } catch (err: any) {

    console.error(err);

    const pre = body.error.querySelector('pre');
    if (pre) pre.innerText = JSON.stringify(err, null, 2);
    show(body.error);

  } finally {

    console.log('Done loading');

  }
}


bootstrap();