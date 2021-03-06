const bayes = require('classificator');
let classifier = bayes();

const moment = require('moment');
const { CronJob } = require('cron');
const { getBrowserActivities } = require('../database/index.js');

const syncClassifierToDb = new CronJob({
  cronTime: '0 * * * *', //every hour at minute zero
  onTick: () => {
    console.log('syncing classifier to DB at', moment().format('MMMM Do YYYY, h:mm:ss a'))
    initClassifier()
  },
  start: true,
  timeZone: 'America/New_York'
});

const initClassifier = async () => {
  classifier = null;
  classifier = bayes();
  const activities = await getBrowserActivities();
  try {
    bulkLearn(activities);
    console.log('classifier initialized!');
  } catch(e) {
    console.error('error in trying to run naive-bayes', e)
  }
};

const bulkLearn = (activities) => {
  activities.filter(({ app_name, prod_class }) => app_name === 'Google Chrome' && prod_class !== 'neutral')
            .forEach(({window_title, prod_class}) => {
              classifier.learn(window_title, prod_class);
            });
};

const REQUIRED_CONFIDENCE = 0.9;
const predictProductivityClass = (title, user_name) => {
  const prediction = classifier.categorize(title).likelihoods
                                .filter(cat => cat.proba > REQUIRED_CONFIDENCE)
  if (prediction.length) return prediction[0].category;
  else return null;
};

const learnProductivityClass = (title, productivityClass) => {
  classifier.learn(title, productivityClass);
  console.log(`ml is learning that ${title} is ${productivityClass}`);
};

const unlearnProductivityClass = (title, oldProdClass) => {
  classifier.unlearn(title, oldProdClass);
  console.log(`ml is UNlearning that ${title} was classified ${oldProdClass}`);
}

exports.initClassifier = initClassifier;
exports.predictProductivityClass = predictProductivityClass;
exports.learnProductivityClass = learnProductivityClass;
exports.unlearnProductivityClass = unlearnProductivityClass;