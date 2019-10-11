var express = require('express');
var router = express.Router();

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

let online = [];
let offline = [];

async function updateData(){
  console.log('updating');

  let tempOnline = [];
  let tempOffline = [];

  for(const streamer of online){
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
    // if($('img.tw-block.tw-border-radius-rounded.tw-image.tw-image-avatar').length){
    //   imageUrl = $('img.tw-image-avatar').attr('src');
    // }
    if($('div.tw-mg-l-05.tw-stat__value').length){
      viewers = $('div.tw-mg-l-05.tw-stat__value').html();
    }

    let obj = {
      viewers: viewers,
      isLive: isLive,
      imageUrl: imageUrl,
      name: name,
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
    // if($('img.tw-block.tw-border-radius-rounded.tw-image.tw-image-avatar').length){
    //   imageUrl = $('img.tw-image-avatar').attr('src');
    // }
    if($('div.tw-mg-l-05.tw-stat__value').length){
      viewers = $('div.tw-mg-l-05.tw-stat__value').html();
    }

    let obj = {
      viewers: viewers,
      isLive: isLive,
      imageUrl: imageUrl,
      name: name,
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
  const name = req.body.name;
  const url = "https://www.twitch.tv/" + name;

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
      // if($('img.tw-block.tw-border-radius-rounded.tw-image.tw-image-avatar').length){
      //   imageUrl = $('img.tw-image-avatar').attr('src');
      // }
      if($('div.tw-mg-l-05.tw-stat__value').length){
        viewers = $('div.tw-mg-l-05.tw-stat__value').html();
      }

      let streamer = {
        viewers: viewers,
        isLive: isLive,
        imageUrl: imageUrl,
        name: name,
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
});

module.exports = router;
