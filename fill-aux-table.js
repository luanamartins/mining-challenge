require('dotenv').config({
	silent : true,
});

const TDDDetector = require('tdd-detector');
const tddDetector = new TDDDetector(process.env.GITHUB_OAUTH_TOKEN);

BATCH_SIZE = 20;
LANGUAGE = 'java';


function isTDD(projectAuthor, projectName, language, commits, buildId){
	return tddDetector.isTDDUsed(projectAuthor, projectName, language, commits)
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
        var updateQuery = 'UPDATE table_aux1_' + LANGUAGE + ' SET is_tdd = ' + value + ' where tr_build_id = ' + buildId + ';';
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
      var selectQuery = 'SELECT * FROM table_aux1_' + LANGUAGE + ' where is_tdd is null LIMIT ' + BATCH_SIZE + ';';
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
      var selectQuery = 'SELECT gh_project_name, gh_lang, git_commit, git_commits, tr_build_id from travistorrent_7_9_2016 where tr_build_id = ' + buildId + ' and gh_lang = \''+ LANGUAGE + '\' limit 1;';
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
.then(() => connection.end())
.catch(console.log);
