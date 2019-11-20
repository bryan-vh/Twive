var express = require('express');
var router = express.Router();

const puppeteer = require('puppeteer');

const blacklist = [
  'image',
  'stylesheet',
  'font',
  'media'
];

let recommended;
let online = [];
let offline = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  getRecommendedStreamer().then(() => {
    res.render('index', { 'online': online, 'offline': offline, 'recommended': recommended });
  });
});

/* POST refresh single streamer. */
router.post('/refresh', function(req, res, next) {
  updateStreamer(req.body.name).then(() => {
    res.render('index', { 'online': online, 'offline': offline, 'recommended': recommended });
  });
});

/* POST refresh all streamers. */
router.post('/refresh-all', function(req, res, next ) {
  updateAll().then(() => {
    res.render('index', { 'online': online, 'offline': offline, 'recommended': recommended });
  });
});

/* POST search for Twitch streamer. */
router.post('/', function(req, res, next) {
  checkLive(req.body.name).then(() => {
    res.render('index', { 'online': online, 'offline': offline, 'recommended': recommended });
  });
});

/**
 * Get recommended streamer to display their stream
 */
async function getRecommendedStreamer() {
  const url = 'https://www.twitch.tv';

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  recommended = await page.evaluate(() => {
    let recommendedElement = document.querySelector('.side-nav-card__avatar').querySelector('figure');

    return recommendedElement !== null ? recommendedElement.getAttribute('aria-label') : '';
  });

  await browser.close();
}

/**
 * Update all streamers and their info
 */
async function updateAll() {
  // Update all streamers in online
  for(const name in online) {
    await updateStreamer(name);
  }
  // Update all streamers in offline
  for(const name in offline) {
    await updateStreamer(name);
  }
}

/**
 * Update an individual streamer's info
 */
async function updateStreamer(name) {
  // Remove the streamer, if they exist, from the online array
  for(let i = 0; i < online.length; i++) {
    if(online[i].name === name) {
      online.splice(i, 1);
    }
  }
  // Remove the streamer, if they exist, from the offline array
  for(let i = 0; i < offline.length; i++) {
    if(offline[i].name === name) {
      offline.splice(i, 1);
    }
  }

  // Check the streamer again to update them
  await checkLive(name);
}

/**
 * Check if a streamer is live
 */
async function checkLive(name) {
  if(name === null) return;
  if(name === undefined) return;
  if(name === '') return;

  // Get the twitch url to scrape
  const url = 'https://www.twitch.tv/' + name.toLowerCase();

  // Check if the streamer has already been searched
  if(doesExist(name)) return;

  // Launch a new Puppeteer instance
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Surround with try / catch in case of exception
  try {
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if(blacklist.includes(req.resourceType)) {
        req.abort();
      }
      else {
        req.continue();
      }
    });

    // Navigate to the Twitch stream
    await page.goto(url);

    // Make sure to wait for the name / image elements to load in order to not get errors
    await page.waitForSelector('.channel-header-user-tab__user-content');
    await page.waitForSelector('.channel-header__avatar-dropdown');

    // Evaluate the page and return a js object with the info about the streamer
    const streamer = await page.evaluate(() => {

      let isLive, name, image, viewers;
      let nameElement, imageElement, viewersElement;

      // Check if the streamer is live
      isLive = document.querySelector('.live-indicator') !== null ? true : false;
      
      // Get the streamer's name
      nameElement = document.querySelector('.channel-header-user-tab__user-content').querySelector('p');
      name = nameElement !== null ? nameElement.innerHTML : null;

      // Get the streamer's profile image
      imageElement = document.querySelector('.channel-header__avatar-dropdown').querySelector('figure').querySelector('img');
      image = imageElement !== null ? imageElement.getAttribute('src') : null;
      
      // Get the streamer's current viewers (if live)
      viewersElement = document.querySelector('.tw-mg-l-05.tw-stat__value');
      viewers = viewersElement !== null ? viewersElement.innerHTML : null;

      return {
        isLive,
        name,
        image,
        viewers
      }
    });

    // Add the streamer's twitch URL to the object
    streamer.twitchUrl = url;

    // If the streamer is live, add it to the online array, otherwise add it to the offline array
    if(streamer.isLive) {
      online.push(streamer);
    }
    else {
      offline.push(streamer);
    }

    // Sort the online array in descending order by viewers
    online.sort((a, b) => {
      let aViewers = parseInt(a.viewers.replace(/,/g, ''));
      let bViewers = parseInt(b.viewers.replace(/,/g, ''));

      return bViewers - aViewers;
    });

    // Close the puppeteer instance
    await browser.close();
  }
  catch(error) {
    console.log(error);

    // Close the puppeteer instance
    await browser.close();
  }
}

/**
 * Checks whether the streamer has already been searched
 */
function doesExist(name) {
  for(let streamer of online) {
    if(streamer.name.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  for(let streamer of offline) {
    if(streamer.name.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }

  return false;
}

module.exports = router;
