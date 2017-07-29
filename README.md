# instagram-scrape
Scraper for Instagram built on [Chromeless](https://github.com/graphcool/chromeless).

# How it works
Script continuously scrolls until it reaches a specified end condition (optional), creating a file in the `scraped-urls` directory that contains links for images.

### End conditions
* Link limit reached (specified by `--max` parameter)
* Scrolled to end of profile/tag

# Usage
1. Install dependencies `yarn install`
2. Launch a Chrome session with `--remote-debugging-port=9222` specified.
3. Run instagram-scrape `node instagram-scrape.js` with parameters specified.

## Parameters
* `--user`    : Profile name to scrape
* `--tag`     : Tag to scrape
* `--url`     : URL of a page to scrape

(One is required)
* `--max`     : Maximum links to scrape
