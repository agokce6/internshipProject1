// https://imdb-api.com/ 
// since free api-keys have 100 query for a day, i created multiple accounts for testing.

var APIKEYs = [ "**********",
                "**********", 
                "**********", 
                "**********", 
                "**********", 
                "**********" 
            ];

var APIKEY = APIKEYs[0];
var isAPIActive = true; // is Api avaible or not
var isAPIupdate = false; //if true, update database from api
var filmCountAPI = 10; //how many movie we fetch from api


module.exports = {APIKEY, isAPIActive, isAPIupdate, filmCountAPI};
