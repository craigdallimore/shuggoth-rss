var Feedparser = require('feedparser'),
  request      = require('request'),
  curl         = require('curlrequest'),
  fs           = require('fs'),
  _            = require('lodash'),
  target       = '',
  url          = '',
  items        = [],
  throttled    = _.throttle(onEverything, 10000);

// You know
// ----------------------------------------------------------------------------
function onError(error) {
  console.error(error);
}

// onReadable
// ----------------------------------------------------------------------------
function onReadable(stuff) {

  var stream = this,
    re        = /Episode/,
    item;

  // Get all the items as they are read
  while (item = stream.read()) {
    items.push({ url: item.enclosures[0].url, name: item.title });
  }

  // Filter out non-episode items, and reverse the list ( oldest first )
  items = items.filter(function(i) {
    return re.test(i.name);
  }).reverse();

  throttled();

}

function onEverything() {

  var dir  = fs.readdirSync(target),
    diff   = items.filter(function(item) {
      return !_.contains(dir, item.name + '.mp3');
    }),
    next;

  if(!diff.length) {
    console.log('nothing to dl yet');
    return;
  }

  next = diff[0];

  console.log('Downloading ' + next.name + '...');

  curl.request({
    url: next.url,
    encoding: null
  }, function(err, file) {
    console.log('Downloaded. Writing file: ' + target + next.name + '.mp3');
    fs.writeFile(target + next.name + '.mp3', file, onFile);
  });

}

function onFile(err) {
  console.log('File written');
}

//
// Kick off -------------------------------------------------------------------
request(url)
  .pipe(new Feedparser())
  .on('error', onError)
  .on('readable', onReadable);
