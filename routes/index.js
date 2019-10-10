var express = require('express');
var router = express.Router();

const axios = require('axios');
const cheerio = require('cheerio');

var online = [];
var offline = [];

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', 'online': online, 'offline': offline });
});

router.post('/', function(req, res, next) {
  const name = req.body.name;
  const url = "https://www.twitch.tv/" + name;

  axios.get(url)
    .then(response => {
      // Since the streamer actually exists, add him to the searched array
      let isLive = false;

      let checkLive = html => {
        const $ = cheerio.load(html);

        if($('.live-indicator.tw-mg-l-05.tw-sm-mg-l-1.tw-visible').length){
          isLive = true;
          console.log('here');
        }

        console.log(isLive);``
      }

      checkLive(response.data);

      if(isLive){
        online.push(name);
      }
      else{
        offline.push(name);
      }

      res.render('index', { 'online': online, 'offline': offline });
    })
    .catch(error => {
      // console.log(error);
      res.render('index', { 'online': online, 'offline': offline, 'error': error });
    })
});

module.exports = router;
