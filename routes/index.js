var express = require('express');
var router = express.Router();

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

let online = [];
let offline = [];

const whitelist = [
  'document', 
  'script', 
  'xhr', 
  'fetch'
];

function upperCaseFirst(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function updateData(){
  let tempOnline = [];
  let tempOffline = [];

  for(const streamer of online){
    const name = streamer.name;
    const url = streamer.twitchUrl;

    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (!whitelist.includes(req.resourceType())) {
        return req.abort();
      }

      req.continue();
    });

    let html = await page.goto(url).then(() => {
      return page.content();
    });

    const $ = cheerio.load(html);

    let isLive = false;
    let imageUrl, viewers;

    if($('div.live-indicator.tw-mg-l-05.tw-sm-mg-l-1.tw-visible').length){
      isLive = true;
    }
    if($('div.channel-header__avatar-dropdown > figure > img').length){
      imageUrl = $('div.channel-header__avatar-dropdown > figure > img').attr('src');
    }
    if($('div.tw-mg-l-05.tw-stat__value').length){
      viewers = $('div.tw-mg-l-05.tw-stat__value').html();
    }

    let obj = {
      viewers: viewers,
      isLive: isLive,
      imageUrl: imageUrl,
      name: upperCaseFirst(name),
      twitchUrl: url
    };

    if(isLive){
      tempOnline.push(obj);
    }
    else{
      tempOffline.push(obj);
    }
  }

  for(const streamer of offline) {
    const name = streamer.name;
    const url = streamer.twitchUrl;

    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    let html = await page.goto(url).then(() => {
      return page.content();
    });

    const $ = cheerio.load(html);

    let isLive = false;
    let imageUrl, viewers;

    if($('div.live-indicator.tw-mg-l-05.tw-sm-mg-l-1.tw-visible').length){
      isLive = true;
    }
    if($('div.channel-header__avatar-dropdown > figure > img').length){
      imageUrl = $('div.channel-header__avatar-dropdown > figure > img').attr('src');
    }
    if($('div.tw-mg-l-05.tw-stat__value').length){
      viewers = $('div.tw-mg-l-05.tw-stat__value').html();
    }

    let obj = {
      viewers: viewers,
      isLive: isLive,
      imageUrl: imageUrl,
      name: upperCaseFirst(name),
      twitchUrl: url
    };

    if(isLive){
      tempOnline.push(obj);
    }
    else{
      tempOffline.push(obj);
    }
  }

  online = tempOnline;
  offline = tempOffline;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 'online': online, 'offline': offline });
});

router.post('/refresh', function(req, res, next) {
  updateData().then(() => {
    res.render('index', { 'online': online, 'offline': offline });
  });
});

router.post('/', function(req, res, next) {
  const sName = req.body.name;
  const url = "https://www.twitch.tv/" + sName;

  let isSearched = false;

  for(let name in online){
    if(name.toLowerCase() == sName.toLowerCase()){
      isSearched = true;
      break;
    }
  }
  for(let name in offline){
    if(name.toLowerCase() == sName.toLowerCase()){
      isSearched = true;
      break;
    }
  }

  if(!isSearched){
    puppeteer
    .launch()
    .then(browser => {
      return browser.newPage();
    })
    .then(page => {
      return page.goto(url).then(() => {
        return page.content();
      });
    })
    .then(html => {
      const $ = cheerio.load(html);

      let isLive = false;
      let imageUrl, viewers;

      if($('div.live-indicator.tw-mg-l-05.tw-sm-mg-l-1.tw-visible').length){
        isLive = true;
      }
      if($('div.channel-header__avatar-dropdown > figure > img').length){
        imageUrl = $('div.channel-header__avatar-dropdown > figure > img').attr('src');
      }
      if($('div.tw-mg-l-05.tw-stat__value').length){
        viewers = $('div.tw-mg-l-05.tw-stat__value').html();
      }

      let streamer = {
        viewers: viewers,
        isLive: isLive,
        imageUrl: imageUrl,
        name: upperCaseFirst(sName),
        twitchUrl: url
      };

      if(isLive){
        online.push(streamer);
      }
      else{
        offline.push(streamer);
      }

      res.render('index', { 'online': online, 'offline': offline, 'loading': false });
    })
    .catch(error => {
      console.log(error);
      res.render('index', { 'online': online, 'offline': offline, 'loading': false });
    });
  }
});

module.exports = router;
