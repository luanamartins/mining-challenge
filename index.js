// https://www.npmjs.com/package/json2csv

var json2csv = require('json2csv');
var fs = require('fs');

require('dotenv').config({
	silent : true,
});

function getRepo(author, project) {
	const GitHub = require('github-api');
	const github = new GitHub({
	  token : process.env.GITHUB_OAUTH_TOKEN,
	});

	const remoteRepo = github.getRepo(author, project);
	return remoteRepo;
}

function getPairsFromCommits(language, build) {
  const getProductionTestPairsFromCommits = require('./src/get-production-test-pairs-from-commits');

	var credentials = getCredentials(build.gh_project_name);
	const remoteRepo = getRepo(credentials.author, credentials.projectName);

	const gitCommit = build.git_commit;
	var gitCommits = build.git_commits;

	if (gitCommits == undefined) {
		gitCommits = null;
	}
  return getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits)
	.then(productionTestPairs => createObject(language, build.gh_project_name, productionTestPairs));
}

function createObject(language, projectName, productionTestPairs){
  return {
      'language' : language,
      'projectName' : projectName,
      'productionTestPairs' : productionTestPairs
  };
}

function getPairs(builds){
     var list = [];
     for(var i = 0; i < builds.length; i++){
        list.push(getPairsFromCommits('java', builds[i]));
     }
      return list;
}

function getFilenames(){ 
  const getRowDataPackets = require('./src/connect-database');
  //console.log('teste');
  console.log(getRowDataPackets);
  return getRowDataPackets()
  .then(Promise.all(getPairs));
}

function run(){
  console.log('Started');
  getFilenames()
  .then(console.log)
  .then(console.log('Finished'))
  .catch(console.log);
}

run();



