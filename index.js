// https://www.npmjs.com/package/json2csv

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

function getPairsFromCommits(language, datum) {
	const getProductionTestPairsFromCommits = require('./src/get-production-test-pairs-from-commits');

	var credentials = getCredentials(datum.gh_project_name);
	const remoteRepo = getRepo(credentials.author, credentials.projectName);

	const gitCommit = datum.git_commit;
	const gitCommits = datum.git_commits;

	if (gitCommits == undefined) {
		gitCommits = null;
	}
  return getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits)
	.then(productionTestPairs => createObject(language, datum.gh_project_name, productionTestPairs));
}

function createObject(language, projectName, productionTestPairs){
  return {
      'language' : language,
      'projectName' : projectName,
      'productionTestPairs' : productionTestPairs
  };
}


function getCredentials(fullProjectName) {
	return {
		author : fullProjectName.split('/')[0],
		projectName : fullProjectName.split('/')[1]
	};
}

function accessDatabase(){
  var mysql = require('mysql');
  var connection = mysql.createConnection({
      host : process.env.DATABASE_HOST,
      user : process.env.DATABASE_USER,
      password : process.env.DATABASE_PASSWORD,
      database : process.env.DATABASE_SCHEMA_NAME
    });

  connection.connect();

  var javaProjectsQuery = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" LIMIT 0, 499';
  var rubyProjectsQuery = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"ruby\" LIMIT 10';

  var countJavaProjects = 'SELECT COUNT(*) from  travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" AND git_commits like \"\"';
  var row37 = 'SELECT * from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" and row = 37 LIMIT 0,1000';

  var distinctQuery = 'SELECT DISTINCT * FROM travistorrent_7_9_2016  WHERE gh_test_churn > 0 AND gh_lang LIKE  \"java\" LIMIT 0, 200';

  debugger;
  connection.query(distinctQuery, function (err, builds, fields) {
    if (!err) {
       builds.forEach( function(build){
              getPairsFromCommits('java', build)
                .then(function(result){
                  console.log(result);
                })
                .catch(function(error){
                  console.log(error);
                });
          });
    } else {
      console.log('Error while performing Query.');
    }
  });
  
  connection.end();
}


accessDatabase();
