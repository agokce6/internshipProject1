// when page is loaded or resized, adjust trailer video width and height 
["load", "resize"].forEach(evt => window.addEventListener(evt, () => {
    var width = $("#trailer-video")[0].offsetWidth;
    var newmovieTrailerUrl = $("#trailer-video")[0].src.split("width")[0] + "&width="+width;
    $("iframe").attr("src",newmovieTrailerUrl);

    if(window.innerWidth>=768){ // medium or larger window sizes
        $("iframe").css("height", $(".img-block")[0].offsetHeight );
    }
    else{ // window sizes smaller than medium page
        $("iframe").css("height",width*(9/16));
    }    
} ));
