require('dotenv').config({
  silent: true,
});

const extractFilesFromCommit = require('./src/extract-files-from-commit');
const getProductionTestPairs = require('./src/get-production-test-pairs');

const GitHub = require('github-api');
const github = new GitHub({
  token: process.env.GITHUB_OAUTH_TOKEN,
});

const remoteRepo = github.getRepo('adamfisk', 'LittleProxy');

extractFilesFromCommit(remoteRepo, '73653eeaa2bc32684419738e55b0eaa3fe2143a6')
  .then(files => getProductionTestPairs(files.productionFiles, files.testFiles))
  .then(productionTestPairs => console.log(productionTestPairs))
  .catch(error => console.log(error));
