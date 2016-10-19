require('dotenv').config({
	silent : true,
});

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

function getBuildsFromProject(connection, language, projectName){
  
  return new Promise(function(resolve, reject) {
        // The Promise constructor should catch any errors thrown on
        // this tick. Alternately, try/catch and reject(err) on catch.

        var queryString = 'SELECT row from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE ? AND gh_project_name LIKE ?';
        
        var queryVariables = [language, projectName];

        connection.query(queryString, queryVariables, function (err, rows, fields) {
            // Call reject on error states,
            // call resolve with results
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
  
}

function generateRandomNumber(maxNumber){
  return (Math.floor((Math.random() * maxNumber) + 1));
}

function generateListOfRandomNumbers(sizeList, maxNumber){
  var list = [];
  for(var i = 0; i < sizeList; i++){
    list.push(generateRandomNumber(maxNumber));
  }
  return list;
}


function getSelectedRows(connection, language, projectName){
  var buildsPerProject = 3;
  
  return getBuildsFromProject(connection, language, projectName)
  .then(function(rowDataPackets){
    var list = generateListOfRandomNumbers(buildsPerProject, rowDataPackets.length);
    var chosenBuildsList = [];
    list.forEach(value => {
      chosenBuildsList.push(rowDataPackets[value]);
    });
    
  });
}

function getChosenBuilds(row){
  
  return new Promise(function(resolve, reject) {
        var queryString = 'SELECT * from travistorrent_7_9_2016 WHERE row = ?';
        var queryVariables = [row];
        
        connection.query(queryString, queryVariables, function (err, rows, fields) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}

function getSelectedProjects(language, numberOfProjects){
  console.log('Gettting projects ' + language + ', ' + numberOfProjects + ' projects.');
  return new Promise(function(resolve, reject){
    var queryString = 'SELECT distinct gh_project_name from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  ? ORDER BY RAND() LIMIT ?'
    var queryVariables = [language, numberOfProjects];
    
    connection.query(queryString, queryVariables, function(err, rows, fields){
      if(err) return reject(err);
      resolve(rows);
    });
  });
}

function createPairsForAnalysis(connection, language){
  //var projects = getSelectedProjects(language, 10);
  return getSelectedProjects(language, 10)
  .then(projects => projects.map(function(project){
    console.log('Getting rows');
	  return getSelectedRows(connection);
  }))
  .then(rows => rows.map(function(row){
      console.log('Getting builds');
		  return getChosenBuilds(row)
	  }));
}


connection = createConnection();
createPairsForAnalysis(connection, 'java')
  .then(function(data){
    console.log('Finished');
    console.log(data);
    console.log('Connection closed!');
    connection.end();
  })
  .catch(function(error){
    console.log(error);
  });
//connection.end();
//chosenBuildsRowNumbers('java', 'tinkerpop/gremlin');


