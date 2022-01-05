var topMovies = $(".movie").toArray();

// when something is writen in search-bar, call this event
$("#search-bar")[0].addEventListener("keyup",(e) => {

    //get writen string
    var searchString = e.target.value;

    //filter movies if their title, year or rating contain the value
    var filteredMovies = topMovies.filter(movie =>{
        return movie.getElementsByClassName("button")[0].innerText.toLowerCase().includes(searchString.toLowerCase());
    });

    //create list item for each filtered movie, if there is any result
    if(filteredMovies.length > 0){
        topMovies.forEach(movie => {
            if(filteredMovies.includes(movie)){
                movie.style.display = "block";
            }
            else{
                movie.style.display = "none";
            }

        });
    }
    else{ // if no result
        $(".movie").css("display", "none");
    }
    
    //show result if search string is not blank
    if(searchString.length >= 2){
        $("#results").css("display","block");
    }
    else{
        $("#results").css("display","none");
    }

});


// if clicked outside of search bar, search bar will be closed.
$("body").on("click", e => {
    if (!(e.target.id == "search-bar" || e.target.className == "dropdown-menu dropdown-results" || e.target.id == "no-result")){
        $("#results").css("display","none");
    }
});