/* eslint max-len: "off" */

import rp from 'request-promise';
import promiseRetry from 'promise-retry';
import requestPromiseErrors from 'request-promise/errors';
import sleep from 'sleep-promise';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

const RequestError = requestPromiseErrors.RequestError;

const rootDir = 'C:/tmp/scrape/recipes';

const categories = {
  // 14763: 'soups-stews-and-chili/chili/chili-without-beans', // small category for testing
  76: 'appetizers-and-snacks',
  77: 'drinks',
  78: 'breakfast-and-brunch',
  79: 'desserts',
  80: 'main-dish',
  81: 'side-dish',
  82: 'trusted-brands-recipes-and-tips',
  84: 'healthy-recipes',
  85: 'holidays-and-events',
  86: 'world-cuisine',
  88: 'bbq-grilling',
  92: 'meat-and-poultry',
  93: 'seafood',
  94: 'soups-stews-and-chili',
  95: 'pasta-and-noodles',
  96: 'salad',
  236: 'us-recipes',
  1116: 'fruits-and-vegetables',
  1642: 'everyday-cooking',
  17561: 'lunch',
  17562: 'dinner',
  17567: 'ingredients',
};

const requestUserAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36';
const requestDelay = 500;
const dirChunkSize = 1000;

let authHeader = null;

function getChunkDir(i) {
  const dir = path.join(rootDir, `chunk-${Math.trunc(i / dirChunkSize)}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

function getTimeEstimate(start, progress) {
  const diff = Date.now() - start;
  const ms = (diff / progress) - diff;
  const parts = {
    s: Math.trunc(ms / 1000) % 60,
    m: Math.trunc(ms / (1000 * 60)) % 60,
    h: Math.trunc(ms / (1000 * 60 * 60)) % 24,
    d: Math.trunc(ms / (1000 * 60 * 60 * 24)),
  };
  for (const key of Object.keys(parts).reverse()) {
    if (parts[key] > 0) {
      break;
    }
    parts[key] = null;
  }
  return Object.keys(parts).reverse().filter(k => parts[k] !== null).map(k => `${parts[k]}${k}`).join('');
}

function delay() {
  return sleep(Math.random() * requestDelay + (requestDelay / 2));
}

function rpr(req) {
  return delay().then(() => promiseRetry(
    retry => {
      req.headers = Object.assign(req.headers || {}, {
        'User-Agent': requestUserAgent,
      });
      return rp(req)
        .catch(RequestError, e => {
          if (e.cause.code === 'ECONNRESET' || e.cause.code === 'ETIMEDOUT') {
            return retry(e);
          }
          throw e;
        });
    },
    {
      retries: 10,
      minTimeout: 10,
      maxTimeout: 1000,
      randomize: true,
    }
  ));
}

function getAuthHeader() {
  return rpr({
    uri: 'http://allrecipes.com',
    resolveWithFullResponse: true,
  }).then(response => {
    const authToken = response.headers['set-cookie'].find(c => c.startsWith('ARToken=')).split(';')[0].split('=')[1];
    authHeader = `Bearer ${authToken}`;
    // console.log(`  token: ${authToken}`);
    return Promise.resolve();
  });
}

function getPage(categoryId, pageNumber) {
  return rpr({
    uri: `https://apps.allrecipes.com/v1/assets/hub-feed?id=${categoryId}&pageNumber=${pageNumber}&isSponsored=true&sortType=p`,
    headers: {
      Authorization: authHeader,
    },
  }).then(body => JSON.parse(body).cards);
}

function getDetail(item) {
  return rpr({
    uri: `http://allrecipes.com/recipe/${item.id}`,
  });
}

function getImage(item) {
  return rpr({
    uri: `http://images.media-allrecipes.com/userphotos/600x600/${item.image}`,
    resolveWithFullResponse: true,
    encoding: null,
  });
}

function getItemDetail(item) {
  return getDetail(item).then(body => {
    const $ = cheerio.load(body);

    try {
      const ingredients = $("li.checkList__line span.recipe-ingred_txt[itemprop='ingredients']", '.recipe-ingredients')
        .contents().toArray().map(n => n.data);
      const directions = $("ol[itemProp='recipeInstructions'] span.recipe-directions__list--item")
        .contents().toArray().map(n => n.data);
      const calories = $('span.calorie-count').children().first().text();
      const prepTime = $("time[itemProp='prepTime']").attr('datetime');
      const totalTime = $("time[itemProp='totalTime']").attr('datetime');

      Object.assign(item, {
        ingredients,
        directions,
        calories,
        prepTime: prepTime ? prepTime.substr(2) : null,
        totalTime: totalTime ? totalTime.substr(2) : null,
      });
    } catch (e) {
      // fs.writeFile(`c:/tmp/page-${item.id}.html`, body);
      Promise.resolve(null);
    }

    return Promise.resolve(item);
  });
}

function getItemImage(item, i) {
  return getImage(item).then(response => {
    fs.writeFile(path.join(getChunkDir(i), item.image), response.body);
    return Promise.resolve(item);
  });
}

function getPageRange(category, incrementProgress) {
  const skip = new Map();

  const searchForLastPage = (lower, upper) => {
    if (upper) {
      // contract search space
      const page = Math.trunc((upper + lower) / 2);
      if (page === lower) {
        // lower is the last page
        return Promise.resolve(page);
      }

      return getPage(category.id, page, authHeader).then(cards => {
        incrementProgress();
        if (cards.length) {
          skip.set(page, cards);
          return searchForLastPage(page, upper);
        }
        return searchForLastPage(lower, page);
      });
    }

    // expand search space
    const page = lower * 2;

    return getPage(category.id, page, authHeader).then(cards => {
      incrementProgress();
      if (cards.length) {
        skip.set(page, cards);
        return searchForLastPage(page);
      }
      // we passed the end
      return searchForLastPage(1, page);
    });
  };

  return searchForLastPage(1).then(last => Object.assign(category, {
    last,
    skip,
  }));
}

function getAllRanges() {
  const initial = Object.keys(categories).map(id => ({
    id,
    name: categories[id],
  }));
  const ranges = [];

  let probeCount = 0;
  const incrementProgress = () => {
    process.stdout.write(`  probe: ${++probeCount}\r`);
  };

  const processNextCategory = () => {
    if (initial.length) {
      return getPageRange(initial.pop(), incrementProgress).then(cat => {
        ranges.push(cat);
        return processNextCategory();
      });
    }

    const totalPages = ranges.map(r => r.last).reduce((a, b) => a + b);
    const cachedPages = ranges.map(r => r.skip.size).reduce((a, b) => a + b);

    process.stdout.write(`${' '.repeat(80)}\r`);
    console.log(`  pages: ${totalPages} (${cachedPages} cached)`);

    return Promise.resolve(ranges);
  };

  return processNextCategory();
}

function getPages(category, incrementProgress) {
  const pages = Array.from(new Array(category.last))
    .map((e, i) => i + 1)
    .reverse();

  const items = new Map();

  const processNextPage = () => {
    if (pages.length) {
      const p = pages.pop();
      return (category.skip.has(p) ? Promise.resolve(category.skip.get(p)) : getPage(category.id, p))
        .then(cards => {
          incrementProgress();
          for (const card of cards) {
            if (card.id && card.itemType !== 'Video') {
              items.set(card.id, card);
            }
          }
          return processNextPage();
        });
    }
    return Promise.resolve(items.values());
  };

  return processNextPage();
}

function getAllItems(ranges) {
  const totalPages = ranges.map(r => r.last).reduce((a, b) => a + b);
  const startTime = Date.now();
  const items = [];

  let crawlCount = 0;
  const incrementProgress = () => {
    const progress = crawlCount / totalPages;
    process.stdout.write(`${' '.repeat(80)}\r`);
    process.stdout.write(`  crawl: ${++crawlCount} (~${getTimeEstimate(startTime, progress)} remaining)\r`);
  };

  const processNextCategory = () => {
    if (ranges.length) {
      const category = ranges.pop();
      return getPages(category, incrementProgress).then(cards => {
        for (const card of cards) {
          const image = card.imageUrl.split('/').pop();
          items.push(Object.assign({
            id: card.id,
            category: category.name,
            title: card.title,
            description: card.description,
            cook: card.cook ? card.cook.displayName : (card.submitter ? card.submitter.cookHandle : null),
          }, image !== '44555.png' ? {
            image,
          } : {}));
        }
        return processNextCategory();
      });
    }

    process.stdout.write(`${' '.repeat(80)}\r`);
    console.log(`  items: ${items.length}`);

    return Promise.resolve(items);
  };

  return processNextCategory();
}

function getAllDetails(items) {
  const startTime = Date.now();
  let parsed = 0;

  const processNextItem = i => {
    if (i < items.length) {
      const item = items[i];
      return getItemDetail(item).then(detail => {
        process.stdout.write(`${' '.repeat(80)}\r`);
        process.stdout.write(`  crawl: ${i + 1} (~${getTimeEstimate(startTime, (i + 1) / items.length)} remaining)\r`);

        if (detail) {
          ++parsed;
          fs.writeFile(path.join(getChunkDir(i), `${item.id}.json`), JSON.stringify(item));
        }

        return ((detail && detail.image) ? getItemImage(detail, i) : Promise.resolve(detail)).then(() =>
          processNextItem(i + 1)
        );
      }).catch(reason => {
        console.log();
        console.log(item);
        throw reason;
      });
    }

    process.stdout.write(`${' '.repeat(80)}\r`);

    return Promise.resolve(parsed);
  };

  return processNextItem(0);
}

export default function () {
  return getAuthHeader()
    .then(getAllRanges)
    .then(getAllItems)
    .then(getAllDetails)
    .then(count => {
      console.log(`  saved: ${count}`);
    });
}
