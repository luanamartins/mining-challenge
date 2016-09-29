require('dotenv').config({
  silent: true,
});

const getProductionTestPairsFromCommits = require('./src/get-production-test-pairs-from-commits');

const GitHub = require('github-api');
const github = new GitHub({
  token: process.env.GITHUB_OAUTH_TOKEN,
});

const remoteRepo = github.getRepo('adamfisk', 'LittleProxy');

const gitCommit = '7470d0c61e7321a8d2db7e4639408669673c0b31';
const gitCommits = '531cc0f7e36daaef58a1e20820a217b40eb42509#6c0c29bdbd1a8246195ec7e7893cc78a09d8c6bd#8c62dc0dc508218723150dcffbd32d8e1d717335';

getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits)
  .then(productionTestPairs => console.log(productionTestPairs))
  .catch(error => console.log(error));
