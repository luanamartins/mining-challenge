require('dotenv').config({
	silent : true,
});

connection = createConnection();
language = 'java';

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

function createTable(){
		return new Promise(function(resolve, reject) {
		var createQuery = 'CREATE OR REPLACE TABLE table_aux1_' + language + '(tr_build_id bigint(20) unique, is_tdd bit NULL);';
		connection.query(createQuery, function (err, rows) {
				if (err) {
					console.log('Deu ruim, ' + err);
					reject(err);
				}
				resolve(rows);
			});
		});
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
	var query = 'SELECT distinct tr_build_id from travistorrent_7_9_2016 where gh_test_churn = 0 and gh_lang = \'' + language +'\' LIMIT 20;';
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
	var query = 'SELECT distinct tr_build_id from travistorrent_7_9_2016 where gh_test_churn > 0 and gh_lang = \'' + language +'\' LIMIT 20;';
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
	.then(buildIds => Promise.all(insertBuilds(buildIds, 0)))
	.then(getBuildsWithTests)
	.then(buildIds2 => Promise.all(insertBuilds(buildIds2, null)))
	.catch(console.log);
}

createTable()
.then(populateTable())
.then(() => connection.end())
.catch(console.log);
