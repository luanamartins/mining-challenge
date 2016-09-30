require('dotenv').config({
  silent: true,
});


function getRepo(author, project) {
	const GitHub = require('github-api');
	const github = new GitHub({
	  token: process.env.GITHUB_OAUTH_TOKEN,
	});

	const remoteRepo = github.getRepo(author, project);
	return remoteRepo;
}

function getPairsFromCommits(datum) {
  console.log(datum.row);
	const getProductionTestPairsFromCommits = require('./src/get-production-test-pairs-from-commits');
	
	//const remoteRepo = getRepo('adamfisk', 'LittleProxy');
	var credentials = getCredentials(datum.gh_project_name);
	const remoteRepo = getRepo(credentials.author, credentials.projectName);

	//const gitCommit = '7470d0c61e7321a8d2db7e4639408669673c0b31';
	const gitCommit = datum.git_commit;
	//console.log("Commit = " + gitCommit + "\n");
	//const gitCommits = '531cc0f7e36daaef58a1e20820a217b40eb42509#6c0c29bdbd1a8246195ec7e7893cc78a09d8c6bd#8c62dc0dc508218723150dcffbd32d8e1d717335';
	const gitCommits = datum.git_commits;
	//console.log("Commits = " + gitCommits + "\n");

	if(gitCommits == undefined){
    gitCommits = null;
  }
	getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits)
	  .then(productionTestPairs => console.log(productionTestPairs))
	  .catch(error => console.log(error));
}

function getCredentials(fullProjectName){
	return {
		author : fullProjectName.split('/')[0],
		projectName:  fullProjectName.split('/')[1] 
	};
}

var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : '< MySQL username >',
  password : '< MySQL password >',
  database : '< MySQL database >'
});

connection.connect();

var javaProjectsQuery = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" LIMIT 0,1000';
var rubyProjectsQuery = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"ruby\" LIMIT 10';
var countJavaProjects = 'SELECT COUNT(*) from  travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" AND git_commits like \"\"';
var row37 = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" and row = 37 LIMIT 0,1000';

connection.query(row37,  function(err, rows, fields) {
  if (!err) {
    //console.log('The solution is: funfou!');
	rows.forEach(getPairsFromCommits);
  } else {
    console.log('Error while performing Query.');
  }
}); 


/*
connection.query(countJavaProjects,  function(err, rows, fields) {
  if (!err) {
		console.log(rows);
  } else {
    console.log('Error while performing Query.');
  }
});
*/
connection.end();
