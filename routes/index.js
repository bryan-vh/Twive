var express = require('express');
var router = express.Router();

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

var online = [];
var offline = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', 'online': online, 'offline': offline });
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

      if($('div.live-indicator.tw-mg-l-05.tw-sm-mg-l-1.tw-visible').length){
        isLive = true;
      }

      if(isLive){
        online.push(name);
      }
      else{
        offline.push(name);
      }

      res.render('index', { 'online': online, 'offline': offline });
    })
    .catch(error => {
      console.log(error);
      res.render('index', { 'online': online, 'offline': offline });
    });

});

module.exports = router;
