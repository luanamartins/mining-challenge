require('dotenv').config({
	silent : true,
});


LANGUAGE = 'java';
TABLE_NAME = 'table_aux2_' + LANGUAGE;
connection = createConnection();

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
    
		var createQuery = 'CREATE TABLE ' + TABLE_NAME + ' (gh_project_name varchar(50) unique, metric1 float, metric2 float);';
    
		connection.query(createQuery, function (err, rows) {
				if (err) {
					console.log('Deu ruim, ' + err);
					reject(err);
				}
				resolve(rows);
			});
		});
}

function fillProjectNamesOnTable(){
    return new Promise(function(resolve, reject) {
      var selectQuery = 'SELECT distinct gh_project_name FROM travistorrent_7_9_2016 LIMIT 10;'; // remove limit on this line, used for lightweight testing only
      connection.query(selectQuery, function (err, rows) {
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }
          resolve(rows);
        });
      })
      .then( (projectNames) =>{
          
          projectNames.forEach(function(projectName){
              var updateQuery = 'INSERT INTO ' + TABLE_NAME + ' (gh_project_name) VALUES (\'' + projectName.gh_project_name + '\');';
              console.log(updateQuery);
                connection.query(updateQuery, function(err, rows) {
                  if(err)
                    console.log(err);
                });
          });
      });
}



createTable()
.then(() => fillProjectNamesOnTable())
.then(() => connection.end())
.catch(console.log);
