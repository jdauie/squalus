/* eslint max-len: "off" */

import rp from 'request-promise';
import promiseRetry from 'promise-retry';
import requestPromiseErrors from 'request-promise/errors';
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

const dirChunkSize = 1000;
const batchChunkSize = 1;

let unprocessed = null;

let detailCount = 0;

const rpr = req =>
  promiseRetry(
    retry =>
      rp(req)
        .catch(RequestError, e => {
          if (e.cause.code === 'ECONNRESET' || e.cause.code === 'ETIMEDOUT') {
            return retry(e);
          }
          throw e;
        }),
    {
      retries: 10,
      minTimeout: 10,
      maxTimeout: 1000,
      randomize: true,
    }
  );

function getPage(categoryId, pageNumber, authHeader) {
  return rpr({
    uri: `https://apps.allrecipes.com/v1/assets/hub-feed?id=${categoryId}&pageNumber=${pageNumber}&isSponsored=true&sortType=p`,
    headers: {
      Authorization: authHeader,
    },
  });
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

function getItems(categoryId, authHeader) {
  const skip = new Set();
  const allCards = [];

  const searchForLastPage = (lower, upper) => {
    if (upper) {
      // contract search space
      const page = Math.trunc((upper + lower) / 2);
      if (page === lower) {
        // lower is the last page
        return Promise.resolve(page);
      }

      return getPage(categoryId, page, authHeader).then(body => {
        const cards = JSON.parse(body).cards;
        if (cards.length) {
          skip.add(page);
          allCards.push.apply(allCards, cards);
          return searchForLastPage(page, upper);
        }
        return searchForLastPage(lower, page);
      });
    }

    // expand search space
    const page = lower * 2;

    return getPage(categoryId, page, authHeader).then(body => {
      const cards = JSON.parse(body).cards;
      if (cards.length) {
        skip.add(page);
        allCards.push.apply(allCards, cards);
        return searchForLastPage(page);
      }
      // we passed the end
      return searchForLastPage(1, page);
    });
  };

  return searchForLastPage(1).then(last => {
    console.log(`[${categories[categoryId]}] ${last} pages`);
    return Promise.all(Array.from(new Array(last))
      .map((e, i) => i + 1)
      .filter(p => !skip.has(p))
      .map(p => getPage(categoryId, p, authHeader).then(body => {
        allCards.push.apply(allCards, JSON.parse(body).cards);
      })));
  }).then(() => {
    // remove potential duplicates from paging
    const uniqueCards = new Map();
    allCards.filter(c => c.itemType === 'Recipe').forEach(card => {
      uniqueCards.set(card.id, card);
    });

    console.log(`[${categories[categoryId]}] ${uniqueCards.size} items`);

    return Promise.resolve(Array.from(uniqueCards.values()).map(card => {
      const image = card.imageUrl.split('/').pop();
      return Object.assign({
        id: card.id,
        category: categories[categoryId],
        title: card.title,
        description: card.description,
        cook: card.cook.displayName,
      }, image !== '44555.png' ? {
        image,
      } : {});
    }));
  });
}

function getDetails(items) {
  return Promise.all(items.map(item =>
    getDetail(item).then(body => {
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

      process.stdout.write(`  ${++detailCount}\r`);

      return Promise.resolve(item);
    })
  ));
}

function getImages(items) {
  return Promise.all(items.map(item => {
    if (item.image) {
      return getImage(item).then(response => {
        const dir = path.join(rootDir, `chunk-${item.id % dirChunkSize}`);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        fs.writeFile(path.join(dir, item.image), response.body);
        return item;
      });
    }
    return Promise.resolve(item);
  }));
}

function processChunk() {
  const chunk = [];
  while (chunk.length < batchChunkSize && unprocessed.length) {
    chunk.push(unprocessed[unprocessed.length - 1].pop());
    if (!unprocessed[unprocessed.length - 1].length) {
      unprocessed.pop();
    }
  }
  return getDetails(chunk).then(items =>
    getImages(items)
  ).then(items => {
    items.forEach(item =>
      fs.writeFile(path.join(rootDir, `chunk-${item.id % dirChunkSize}`, `item-${item.id}.json`), JSON.stringify(item))
    );
    return Promise.resolve();
  });
}

export default function () {
  return rpr({
    uri: 'http://allrecipes.com',
    resolveWithFullResponse: true,
  }).then(response => {
    const authToken = response.headers['set-cookie'].find(c => c.startsWith('ARToken=')).split(';')[0].split('=')[1];
    const authHeader = `Bearer ${authToken}`;

    return Promise.all(Object.keys(categories).map(categoryId =>
      getItems(categoryId, authHeader)
    )).then(groups => {
      console.log(`${groups.map(g => g.length).reduce((a, b) => a + b)} total items`);
      unprocessed = groups;
      return processChunk();
    });
  });
}
