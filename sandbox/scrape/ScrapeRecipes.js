/* eslint max-len: "off" */

import rp from 'request-promise';
import promiseRetry from 'promise-retry';
import requestPromiseErrors from 'request-promise/errors';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

const RequestError = requestPromiseErrors.RequestError;

const rootDir = 'C:/tmp/scrape/recipes';
const authHeader = 'Bearer P6k/U+2F1ECWIwpmI527pUM6CDKS71rBQLHc2r1GkZrkHgrwKadHn8zFifk+QeNlW7bMDibkfBj3mNVyFBaJ722BPud529q7ln0FSBlURFjzIm+JXu2boqr9QEv3yu6k';

const categories = {
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

// const onResolve = () => {
//   if (!cards.length) {
//     resolve(recipes);
//   }
//   return rp({
//     uri: `http://allrecipes.com/recipe/${c.id}`,
//     resolveWithFullResponse: true,
//   }).then(response => {
//     const $ = cheerio.load(response.body);
//
//     try {
//       const ingredients = $("li.checkList__line span.recipe-ingred_txt[itemprop='ingredients']", '.recipe-ingredients')
//         .contents().toArray().map(n => n.data);
//       const directions = $("ol[itemProp='recipeInstructions'] span.recipe-directions__list--item")
//         .contents().toArray().map(n => n.data);
//       const calories = $('span.calorie-count').children().first().text();
//       const prepTime = $("time[itemProp='prepTime']").attr('datetime');
//       const totalTime = $("time[itemProp='totalTime']").attr('datetime');
//
//       recipes.push(Object.assign(recipe, {
//         ingredients,
//         directions,
//         calories,
//         prepTime: prepTime ? prepTime.substr(2) : null,
//         totalTime: totalTime ? totalTime.substr(2) : null,
//       }));
//     } catch(e) {
//       fs.writeFile(`c:/tmp/page-${c.id}.html`, response.body);
//       // throw e;
//     }
//
//     return Promise.resolve();
//   }).then(() => {
//     return rp({
//       uri: `http://images.media-allrecipes.com/userphotos/600x600/${imageFile}`,
//       resolveWithFullResponse: true,
//       encoding: null,
//     }).then(response => {
//       fs.writeFile(path.join(rootDir, imageFile), response.body);
//     });
//   }).then(onResolve, reject);
// };

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
      retries: 4,
      minTimeout: 10,
      maxTimeout: 1000,
      randomize: true,
    }
  );

function getPage(categoryId, pageNumber) {
  // console.log(`try page ${pageNumber}`);
  return rpr({
    uri: `https://apps.allrecipes.com/v1/assets/hub-feed?id=${categoryId}&pageNumber=${pageNumber}&isSponsored=true&sortType=p`,
    headers: {
      Authorization: authHeader,
    },
    pool: { maxSockets: 10 },
  });
}

function getItems(categoryId) {
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

      return getPage(categoryId, page).then(body => {
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

    return getPage(categoryId, page).then(body => {
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
      .map(p => getPage(categoryId, p).then(body => {
        allCards.push.apply(allCards, JSON.parse(body).cards);
      })));
  }).then(() => {
    // remove potential duplicates from paging
    const uniqueCards = new Map();
    allCards.filter(c => c.itemType === 'Recipe').forEach(card => {
      uniqueCards.set(card.id, card);
    });
    console.log(`[${categories[categoryId]}] ${uniqueCards.size} items`);

    return Promise.resolve(Array.from(uniqueCards.values()).map(card => ({
      id: card.id,
      category: categories[categoryId],
      title: card.title,
      description: card.description,
      cook: card.cook.displayName,
      image: card.imageUrl.split('/').pop(),
    })));
  });
}

export default function () {
  return Promise.all(Object.keys(categories).map(categoryId =>
    getItems(categoryId)
  ))
    .then(items => {
      console.log(items.map(x => x.length).reduce((a, b) => a + b));
    });
}
