'use strict';

const htmlParser = require("node-html-parser"); //https://www.npmjs.com/package/node-html-parser
const puppeteer = require('puppeteer');
const os = require('os');

exports.get_file_ids = function(req, res) {   
    // web scraping logic stats here.
    scrapeAndGetFileLinks(res);
    // web scraping logic ends here.
};

// login and scrape the content
let scrapeAndGetFileLinks = async function(res){
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://www.website.com/login');

    await page.type('#username_login', 'username');
    await page.type('#password_login', 'password');
    await Promise.all([
        page.waitForNavigation(),
        page.click('#login')
    ]);

    //we wait for promise to give us control back here after we are logged in.
    await page.goto('https://www.website.com/page-with-data');
 
    //taking a screenshot only for debug purpose, no significance in getting file ids.
    let ssPath =  os.tmpdir()+'/my_screenshot_'+new Date().toLocaleTimeString()+'.png';
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log("took a screenshot with file path "+ssPath);

    //get the html content of the page as string.
    let tableHtmlString = await page.$$eval('table.largemargintop', t => t[0].innerHTML);
 
    //parse the html content and fetch the fileIds.
    const tBody = htmlParser.parse(tableHtmlString);
    var trs = tBody.firstChild.childNodes;
    //nodes to look for as per old selenium script x-paths
    var nodesToLookfor = [4,6,7,8,1,45,35,16,17,21,22,26,32,41,43,44,47] 
    var sortedNodes = nodesToLookfor.sort(function(a, b) { return a > b ? 1 : -1});

    var fetchedLinks = [];

    for(var i=0;i<sortedNodes.length;i++){
        var tr = trs[sortedNodes[i]];
        fetchedLinks.push({
            "nodeIndex":sortedNodes[i],
            "csvName":tr.childNodes[0].text,
            "fileLink":tr.childNodes[1].childNodes[3].firstChild.attributes.href,
            "xlsLink":tr.childNodes[1].childNodes[4].firstChild.attributes.href,
            "csvLink":tr.childNodes[1].childNodes[5].firstChild.attributes.href
        });
    }
    
    closeTheSession(browser, page);

    res.status(200).json({
        'status':200, 
        'fileLinks':fetchedLinks,
        'message':'file links retrieved successfully'
    });

    console.log("..done with fetching results..");
}

// when you are done scraping, logout and close the browser.
let closeTheSession = async function(browser, page){
    await Promise.all([
        page.waitForSelector('a.sign-out').then(() => page.click('a.sign-out'))
    ]);
    await browser.close();
}