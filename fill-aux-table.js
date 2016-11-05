require('dotenv').config({
	silent : true,
});

const TDDDetector = require('tdd-detector');
const tddDetector = new TDDDetector(process.env.GITHUB_OAUTH_TOKEN);

/*
const projectAuthor = 'google';
const projectName = 'closure-compiler';
const language = 'java';
const commits = ['59f5f9c484164fc394cd5d34485ad7f4c37bc21e', '63d6fe90f434533b5a52edcd93d9786b8c1834e8', '6b158f92af743c0a89e9b343af9fe95c08d31bef']
*/

function isTDD(projectAuthor, projectName, language, commits, buildId){
	tddDetector.isTDDUsed(projectAuthor, projectName, language, commits)
		.then(result => {
      var valueToUpdate;
      
			if (result) {
				console.log('TDD was used!');
        valueToUpdate = 1;
			}
			else {
				console.log('TDD was not used!');
        valueToUpdate = 0;
			}
      return valueToUpdate;
		})
    .then(value => {
        var updateQuery = 'UPDATE table_aux1_java SET is_tdd = ' + value + ' where tr_build_id = ' + buildId + ';';
        console.log(updateQuery);
        connection.query(updateQuery, function(err, rows) {
          if(err)
            console.log(err);
        });
      }
    );
}

function getAllBuildsToEvaluate(){
    return new Promise(function(resolve, reject) {
      var selectQuery = 'SELECT * FROM table_aux1_java where is_tdd is null;';
      connection.query(selectQuery, function (err, rows) {
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }
          resolve(rows);
        });
      });
}

function getBuildInformation(buildId){
    return new Promise(function(resolve, reject) {
      var selectQuery = 'SELECT gh_project_name, gh_lang, git_commit, git_commits, tr_build_id from travistorrent_7_9_2016 where tr_build_id = ' + buildId + ' limit 1;';
      connection.query(selectQuery, function (err, rows) {
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }
          resolve(rows);
        });
      });
}

function getCredentials(fullProjectName) {
  	return {
       author : fullProjectName.split('/')[0],
       projectName : fullProjectName.split('/')[1]
  	};
}

function getCommitArray(gitCommit, gitCommits){
   let commits = [gitCommit];

   if (gitCommits) {
     const gitCommitsArray = gitCommits.split('#');
     commits = commits.concat(gitCommitsArray);
   }
   return commits;
}

function evaluateBuilds(informationArray){
     var list = [];
     var credentials;
     var commits;
     var information;
     
     for(var i = 0; i < informationArray.length; i++){
       information = informationArray[i][0];
       //console.log(JSON.stringify(information));
       credentials = getCredentials(information.gh_project_name);
       commits = getCommitArray(information.git_commit, information.git_commits);
        list.push(isTDD(credentials.author, credentials.projectName, information.gh_lang, commits, information.tr_build_id));
     }
      return list;
}

function runToBuilds(builds){
     var list = [];
     for(var i = 0; i < builds.length; i++){
        list.push(getBuildInformation(builds[i].tr_build_id));
     }
      return list;
}

function createConnection(){
  var mysql = require('mysql');
  var connection = mysql.createConnection({
      host : process.env.DATABASE_HOST,
      user : process.env.DATABASE_USER,
      password : process.env.DATABASE_PASSWORD,
      database : process.env.DATABASE_SCHEMA_NAME
  });

  return connection;
}

connection = createConnection();
getAllBuildsToEvaluate()
.then(builds => Promise.all(runToBuilds(builds)))
.then(information => Promise.all(evaluateBuilds(information)))
//.then(() => connection.end())
.catch(console.log);
