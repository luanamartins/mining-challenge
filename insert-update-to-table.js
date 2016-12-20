require('dotenv').config({
	silent : true,
});

connection = createConnection();
mainTableName = 'travistorrent_6_12_2016';
language = 'java';
isTdd = 1;

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

function insert(buildId, isTdd){
		var query = 'INSERT INTO table_aux1_' + language + ' (tr_build_id, is_tdd) VALUES (' + buildId + ', ' + isTdd + ');';
		console.log(query);
		return Promise.resolve(connection.query(query, function(err, rows){}));
}

function insertBuilds(builds, isTdd){
     //console.log('Getting pairs from builds');
     	var list = [];
     	for(var i = 0; i < builds.length; i++){
      	list.push(insert(builds[i].tr_build_id, isTdd));
     	}
    	return list;
}

function getBuildsWithoutTests(){
	var query = 'SELECT distinct tr_build_id from ' + mainTableName + ' where git_diff_test_churn = 0 and gh_lang = \'' + language +'\';';
	//console.log(query);
	return new Promise(function(resolve, reject){
		connection.query(query, function(err, rows){
			if (err) {
				console.log('Deu ruim (sem testes):' + err);
				reject(err);
			}
			console.log(rows);
			resolve(rows);
			//connection.end();
		});
	});
}

function getBuildsWithTests(){
	var query = 'SELECT distinct tr_build_id from '  + mainTableName + ' where git_diff_test_churn > 0 and gh_lang = \'' + language +'\';';
	//console.log(query);
	return new Promise(function(resolve, reject){
		connection.query(query, function(err, rows){
			if (err) {
				console.log('Deu ruim (com testes):' + err);
				reject(err);
			}
			console.log(rows);
			resolve(rows);
			//connection.end();
		});
	});
}

function populateTable(){
	return getBuildsWithoutTests()
	.then(buildIds => Promise.all(insertBuilds(buildIds, !isTdd)))
	.then(() => getBuildsWithTests())
	.then(buildIds2 => Promise.all(insertBuilds(buildIds2, null)))
	.catch(console.log);
}

populateTable())
.then(() => connection.end())
.catch(console.log);
