/* eslint max-len: "off" */

import rp from 'request-promise';
import cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';

const rootDir = 'C:/tmp/scrape/recipes';
const authHeader = 'Bearer P6k/U+2F1ECWIwpmI527pUM6CDKS71rBQLHc2r1GkZrkHgrwKadHn8zFifk+QeNlW7bMDibkfBj3mNVyFBaJ722BPud529q7ln0FSBlURFjzIm+JXu2boqr9QEv3yu6k';

const categories = {
  228: 'world-cuisine/australian-and-new-zealander',
  // 96: 'salad',
  // 86: 'world-cuisine',
  // 94: 'soups-stews-and-chili',
  // 80: 'main-dish',
};

let items = [];

function getRecipes(categoryId, pageNumber) {
  const recipes = [];

  return rp({
    uri: `https://apps.allrecipes.com/v1/assets/hub-feed?id=${categoryId}&pageNumber=${pageNumber}&isSponsored=true&sortType=p`,
    headers: {
      Authorization: authHeader,
    },
    resolveWithFullResponse: true,
  }).then(response => {
    return new Promise((resolve, reject) => {
      const cards = JSON.parse(response.body).cards.filter(c => c.itemType === 'Recipe').reverse();

      const onResolve = () => {
        if (!cards.length) {
          resolve(recipes);
        }

        const c = cards.pop();
        const imageFile = c.imageUrl.split('/').pop();

        process.stdout.write(`  ${recipes.length + items.length}\r`);

        let recipe = {
          id: c.id,
          category: recipeCategories[categoryId],
          title: c.title,
          description: c.description,
          cook: c.cook.displayName,
          url: `http://allrecipes.com/recipe/${c.id}`,
          image: imageFile,
        };

        return rp({
          uri: `http://allrecipes.com/recipe/${c.id}`,
          resolveWithFullResponse: true,
        }).then(response => {
          const $ = cheerio.load(response.body);

          try {
            const ingredients = $("li.checkList__line span.recipe-ingred_txt[itemprop='ingredients']", '.recipe-ingredients')
              .contents().toArray().map(n => n.data);
            const directions = $("ol[itemProp='recipeInstructions'] span.recipe-directions__list--item")
              .contents().toArray().map(n => n.data);
            const calories = $('span.calorie-count').children().first().text();
            const prepTime = $("time[itemProp='prepTime']").attr('datetime');
            const totalTime = $("time[itemProp='totalTime']").attr('datetime');

            recipes.push(Object.assign(recipe, {
              ingredients,
              directions,
              calories,
              prepTime: prepTime ? prepTime.substr(2) : null,
              totalTime: totalTime ? totalTime.substr(2) : null,
            }));
          } catch(e) {
            fs.writeFile(`c:/tmp/page-${c.id}.html`, response.body);
            // throw e;
          }

          return Promise.resolve();
        }).then(() => {
          return rp({
            uri: `http://images.media-allrecipes.com/userphotos/600x600/${imageFile}`,
            resolveWithFullResponse: true,
            encoding: null,
          }).then(response => {
            fs.writeFile(path.join(rootDir, imageFile), response.body);
          });
        }).then(onResolve, reject);
      };

      Promise.resolve().then(onResolve, reject);
    });
  }).then(recipes => {
    recipes.forEach(r => items.push(r));
    if (recipes.length == 0) {
      const categoryIds = Object.keys(recipeCategories);
      const index = categoryIds.indexOf(categoryId);
      if (index === categoryIds.length - 1) {
        // done
      } else {
        fs.writeFile(path.join(rootDir, `category-${categoryId}.json`), JSON.stringify(recipes, null, '  '));
        items = [];

        // next category
        getRecipes(categoryIds[index + 1], 1);
      }
    } else {
      getRecipes(categoryId, pageNumber + 1);
    }
  });
}

function getPage(categoryId, pageNumber) {
  // console.log(`try page ${pageNumber}`);
  return rp({
    uri: `https://apps.allrecipes.com/v1/assets/hub-feed?id=${categoryId}&pageNumber=${pageNumber}&isSponsored=true&sortType=p`,
    headers: {
      Authorization: authHeader,
    },
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
    console.log(`last page ${last}`);
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

    Promise.resolve(Array.from(uniqueCards.values()).map(card => ({
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
  // getRecipes(Object.keys(recipeCategories)[0], 1);

  return Promise.all(Object.keys(categories).map(categoryId =>
    getItems(categoryId)
  ))
    .then(items => {
      console.log(items.length);
    });
}
