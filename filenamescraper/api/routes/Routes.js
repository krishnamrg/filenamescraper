'use strict';
module.exports = function(app) {

  var scrapper = require('../controller/scraper');

  // web scrapper Routes
  app.route('/fileids').get(scrapper.get_file_ids);

};
