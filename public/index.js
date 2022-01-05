
var filmCount = $(".movie-card").length;

// ---------------------------- FILTERS -------------------------------------------

// sorting movies by year
function sortYearFunction(a,b){
    var year1 = a.getElementsByClassName("year")[0].innerText;
    var year2 = b.getElementsByClassName("year")[0].innerText;

    if (year1>year2){
        return -1;
    }
    else if (year1<year2){
        return 1;
    }
    return 0;
}

// sorting movies by year in reverse order
function sortYearReverseFunction(a,b){
    var year1 = a.getElementsByClassName("year")[0].innerText;
    var year2 = b.getElementsByClassName("year")[0].innerText;

    if (year1>year2){
        return 1;
    }
    else if (year1<year2){
        return -1;
    }
    return 0;
}

// sort movies according to value of option.
function sortYear(){
    var option = $("#yearSelection").val();

    if(option==1 ){ // if option is 1, sory by year
        var films = $(".movie-card");
        films.sort(sortYearFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
    else if(option==2){ // if option is 2, sory by year in reverse order
        var films = $(".movie-card");
        films.sort(sortYearReverseFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
    else{ // otherwise sort by rating
        var films = $(".movie-card");
        films.sort(sortByRatingFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
}

// -----------------------------------------

function genreFilter(){
    var allFilms = $(".movie-card").toArray();
    var filtredFilms = $(".movie-card").toArray();

    var optionGenre = $("#genreSelection").val();

    var filtredFilms = allFilms.filter(genreFilterFunction,optionGenre);
    
    for(var i = 0; i<filmCount; i++){
        if(filtredFilms.includes(allFilms[i])){
            allFilms[i].style.display = "flex";
        }
        else{
            allFilms[i].style.display = "none";
        }
    }

}

function genreFilterFunction(film){
    var options = ["","Action", "Biography", "Drama", "Adventure", "Crime", "History", "Western", "Thriller"];

    if(options[this]==""){
        return true;
    }

    var genres = film.getElementsByClassName("genre");
    for(var i = 0; i< genres.length; i++){
        if(genres[i].innerText.includes(options[this])){
            return true;
        }
    }
    return false;
}

function sortAlphabeticallyFunction(a,b){
    var title1 = a.title;
    var title2 = b.title;

    if (title1>title2){
        return 1;
    }
    else if (title1<=title2){
        return -1;
    }
}

function sortAlphabeticallyReverseFunction(a,b){
    var title1 = a.title;
    var title2 = b.title;

    if (title1>title2){
        return -1;
    }
    else if (title1<=title2){
        return 1;
    }
}

function sortByRatingFunction(a,b){
    var rating1 = a.getElementsByClassName("rating")[0].innerText;
    var rating2 = b.getElementsByClassName("rating")[0].innerText;

    if (rating1>rating2){
        return -1;
    }
    else if (rating1<=rating2){
        return 1;
    }
}

function sortByRatingReverseFunction(a,b){
    var rating1 = a.getElementsByClassName("rating")[0].innerText;
    var rating2 = b.getElementsByClassName("rating")[0].innerText;

    if (rating1>rating2){
        return 1;
    }
    else if (rating1<=rating2){
        return -1;
    }
}

function sortFilms(){
    var option = $("#sortSelection").val();

    if(option==1){
        var films = $(".movie-card");
        films.sort(sortAlphabeticallyFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
    else if(option==2){
        var films = $(".movie-card");
        films.sort(sortAlphabeticallyReverseFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
    else if(option==3 || option==0){
        var films = $(".movie-card");
        films.sort(sortByRatingReverseFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }
    else if(option==4 || option==0){
        var films = $(".movie-card");
        films.sort(sortByRatingFunction);
        var contents = $("#contents");
        for(var i = 1 ; i < filmCount + 1; i++) {
            contents.append(films[i-1]);
        }
    }

}


