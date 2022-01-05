const express = require("express");
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const nodemailer = require("nodemailer");
const rand = require("random-key");
const request = require("request-promise");
const initializePassport = require("./passportConfig");
const {APIKEY, isAPIActive, isAPIupdate, filmCountAPI} = require("./apiConfig");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: false}));
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(express.static("public"));

app.get("/", (req,res) =>{
    pool.query(
        `SELECT movie_name, img_url, year, genres, rating, summary, movie_id FROM movies ORDER BY rating DESC`, [], (err, results) => {
            if(err){
                throw err;
            }
            if(results.rows.length>0){
                req.session.returnTo = req.originalUrl; //This line saves the page link and ensures that the member is directed to this page when log out.
                if(req.user == undefined){
                    res.render("index", { isAuthenticated: false, movies:results.rows});
                }
                else{
                    res.render("index", {user: req.user.name, isAuthenticated: true, movies:results.rows});
                }
            }    
        }
    );
});

app.get("/movie_page", (req,res) =>{

    var title = req.query.title;
    var movieID = req.query.movieID;

    pool.query(
        `SELECT * FROM movies WHERE movie_id = $1 AND movie_name = $2`, [movieID, title], (err, results) => {
            if(err){
                throw err;
            }

            //if there is a movie with given parameters
            if(results.rows.length>0){
                req.session.returnTo = req.originalUrl; //This line saves the page link and ensures that the member is directed to this page when log out.
                pool.query(
                    `SELECT movie_name, img_url, year, genres, rating, summary, movie_id FROM movies ORDER BY rating DESC`, [], (err, movies) => {
                        if(err){
                            throw err;
                        }
                        if(movies.rows.length>0){
                            if(req.user == undefined){
                                res.render("movie_page", { isAuthenticated: false, movie: results.rows[0],filmCount:filmCountAPI, movies:movies.rows});
                            }
                            else{
                                res.render("movie_page", {user: req.user.name, isAuthenticated: true, movie: results.rows[0], filmCount:filmCountAPI,movies:movies.rows});
                            }
                        }    
                    }
                );
                
            }
            else{
                res.redirect("/");
            }
        }
    );

    
});

app.get("/login", checkAuthenticated, (req,res) =>{
    res.render("login", {filmCount:filmCountAPI});
});

app.get("/register", checkAuthenticated,(req,res) =>{
    res.render("register", {filmCount:filmCountAPI});
});

app.get("/forgot-password",(req,res) =>{
    res.render("forgot_password", {filmCount:filmCountAPI});
});

app.get("/forgot-password/new-password", (req,res) =>{
    var user_id = req.query.id;
    var user_key = req.query.key;
    
    pool.query(
        `SELECT * FROM activationkeys
        WHERE user_id = $1 AND key = $2`, [user_id, user_key], (err, results) => {
            if(err){
                throw err;
            }

            if(results.rows.length > 0){
                res.render("forgot_password_new_password", {filmCount:filmCountAPI});
            }
            else{
                req.flash("error", "Hatalı link!");
                res.redirect("/login");
            }

        }
    );

});

app.get("/user/emailActivation", (req, res) =>{
    var user_id = req.query.id;
    var user_key = req.query.key;

    pool.query(
        `SELECT * FROM activationkeys
        WHERE key=$1 AND user_id = $2 AND emailact_or_passwordres='f' `, [user_key, user_id], (err, results) => {
            if(err){
                throw err;
            } 

            if(results.rows.length > 0){
                pool.query(
                    `UPDATE users
                    SET isactivated='t' 
                    WHERE id=$1`, [user_id], (err, results) => {
                        if(err){
                            throw err;
                        }

                        pool.query(
                            `DELETE FROM activationkeys 
                            WHERE key=$1 AND user_id=$2 AND emailact_or_passwordres = 'f' `, [user_key, user_id], (err, results) => {
                                if(err){
                                    throw err;
                                } 
                            }
                        );

                        req.flash("success", "Hesabınız doğrulandı. Şimdi giriş yapabilirsiniz!");
                        res.redirect("/login");
                    }
                );
            }
            else{
                req.flash("error", "Hatalı doğrulama linki!");
                res.redirect("/login");
            }
        }
    );

});

app.get("/logout", (req, res) =>{
    req.logOut();
    req.flash("success", "Başarıyla çıkış yapıldı!");
    res.redirect(req.session.returnTo);
});

app.post("/register", async (req, res) =>{
    let {name, email, password, password2} = req.body;

    let errors = [];

    if(!name || !email || !password || !password2){
        errors.push({message: "Lütfen tüm alanları doldurun!"});
    }
    if(password.length < 6){
        errors.push({message: "Şifre en az 6 karakter olmalıdır!"});
    }
    if(password != password2){
        errors.push({message: "Şifreler aynı değil!"});
    }

    // if there is any error, reload page with these errors
    if(errors.length>0){
        res.render("register", {errors});
    }
    // if there is no error, continue
    else{
        let hashPassword = await bcrypt.hash(password, 10);
        
        pool.query(
            `SELECT * from users 
            WHERE email = $1`, [email], (err, results)=>{
                if(err){
                    throw err;
                }  

                //if this email is already registered show error.
                if(results.rows.length > 0){
                    errors.push({message:"Bu email zaten kayıtlı!"});
                    res.render("register",{errors});
                }
                else{
               
                    // inserting new user to database
                    pool.query(
                        `INSERT INTO users(name, email, password) 
                        VALUES($1, $2, $3)
                        RETURNING id, password`, [name, email, hashPassword], (err, results) =>{
                            if(err){
                                throw err;
                            }
                            var user = results.rows[0];

                            sendEmail(user.id, email, false);

                            req.flash("success","Kayıt başarılı, lütfen emailinize gelen linkten hesabınızı aktifleştiriniz.");
                            res.redirect("/login");
                        }
                    );
                }
            }
        )
    }
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/",
    failureRedirect: "login",
    failureFlash: true
    })
);

app.post("/forgot-password", (req, res)=>{
    var {email} = req.body;

    pool.query(
        `SELECT * FROM users
        WHERE email = $1`, [email], (err, results) => {
            if(err){
                throw err;
            }

            if(results.rows.length>0){
                var user = results.rows[0];

                if(!user.isactivated){
                    req.flash("error", "İlk önce hesabınızı doğrulayınız!");
                    res.redirect("/login");
                }
                else{
                    sendEmail(user.id, email, true);
                    req.flash("success", "Mail başarıyla gönderildi!");
                    res.redirect("/login");
                }
            }
            else{
                req.flash("error", "Email bulunamadı!");
                res.redirect("/login");
            }

        }
    );

});

app.post("/forgot-password/new-password", async (req,res) => {
    var {password, password2} = req.body;
    var user_id = req.query.id;
    var user_key = req.query.key;

    let errors = [];

    if(!password || !password2){
        errors.push({message: "Lütfen tüm alanları doldurun!"});
    }
    if(password.length < 6){
        errors.push({message: "Şifre en az 6 karakter olmalıdır!"});
    }
    if(password != password2){
        errors.push({message: "Şifreler aynı değil!"});
    }

    // if there is any error, reload page with these errors
    if(errors.length>0){
        res.render("forgot_password_new_password", {errors});
    }
    // if there is no error, continue
    else{
        let hashPassword = await bcrypt.hash(password, 10);

        pool.query(
            `SELECT * FROM users
            WHERE id = $1`, [user_id], (err, results) => {
                if(err){
                    throw err;
                }

                if(results.rows.length > 0){
                    var user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if(err){
                            throw err;
                        }

                        //if new password is same as old password.
                        if(isMatch){
                            errors.push({message:"Yeni şifreniz öncekiyle aynı olamaz!"});
                            res.render("forgot_password_new_password",{errors});
                        }
                        else{
                            //updating password
                            pool.query(
                                `UPDATE users
                                SET password = $1
                                WHERE id = $2`, [hashPassword, user_id], (err, results) => {
                                    if(err){
                                        throw err;
                                    }
                                    //removing key from db
                                    pool.query(
                                        `DELETE FROM activationkeys
                                        WHERE key = $1 AND user_id = $2 AND emailact_or_passwordres = 't' `, [user_key, user_id], (err, results) => {
                                            if(err){
                                                throw err;
                                            }
                                            req.flash("success","Şifreniz başarıyla güncellendi");
                                            res.redirect("/login");
                                        }
                                    );
                                }
                            );
                        }
                    });
                }     
            } 
        );
    }
});

//if user already logged in, redirect to previous page.
function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect(req.session.returnTo);
    }
    return next();
}

//if user didnt login yet, redirect to login page.
function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

function sendEmail(user_id, email, mailType){ //mailtype: 'f' = email activation ; 't' = password reset
    var randKey = rand.generate(20); // random key for email activation
    
    var subject = mailType ? "Password Reset" : "Email activation";

    var htmlOutput = mailType ? `<a href='http://localhost:4000/forgot-password/new-password?id=${user_id}&key=${randKey}'>
                                Şifrenizi güncellemek için tıklayınız.</a>` 
                                :`<a href='http://localhost:4000/user/emailActivation?id=${user_id}&key=${randKey}'>
                                Hesabınızı aktifleştirmek için tıklayınız.</a>`;

    // creating row for user&key on db
    pool.query(
        `INSERT INTO activationkeys(key, user_id, emailact_or_passwordres)
        VALUES($1, $2, $3)`, [randKey, user_id, mailType], (err, results) =>{
            if(err){
                throw err;
            }
        }
    );

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: { // !!!!!! e-mail and password !!!!!!
            user: process.env.MAIL, // generated ethereal user 
            pass: process.env.MAIL_PASSWORD ? true : false // generated ethereal password
        },
        tls:{
            rejectUnauthorized:false //for local servers, must be false
        }
    });

    // setup email data with unicode symbols
    let mailOptions = {
        from: `Top Movies" ${process.env.MAIL}>`, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: subject, // plain text body
        html: htmlOutput // html body of mail
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }); 
}

app.listen(PORT, ()=>{
    console.log("Server is listening on port " + PORT);

    // creating tables if they dont exists
    pool.query(
        `CREATE TABLE IF NOT EXISTS users(
            id BIGSERIAL PRIMARY KEY NOT NULL,
            name VARCHAR(200) NOT NULL,
            email VARCHAR(200) UNIQUE NOT NULL,
            password VARCHAR(200) NOT NULL,
            isActivated BOOLEAN NOT NULL DEFAULT 'f'
        );
        CREATE TABLE IF NOT EXISTS activationkeys(
            id BIGSERIAL PRIMARY KEY NOT NULL,
            key VARCHAR(200) NOT NULL,
            user_id INT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            emailact_or_passwordres BOOLEAN NOT NULL
        );
        CREATE TABLE IF NOT EXISTS movies(
            id BIGSERIAL PRIMARY KEY NOT NULL,
            movie_name VARCHAR(200) UNIQUE NOT NULL,
            img_url VARCHAR(200) NOT NULL,
            year INT NOT NULL,
            genres VARCHAR(200) NOT NULL,
            summary VARCHAR NOT NULL,
            duration INT NOT NULL,
            rating DECIMAL(3,1) NOT NULL,
            directors VARCHAR(200) NOT NULL,
            stars VARCHAR(200) NOT NULL,
            writers VARCHAR(200) NOT NULL,
            video_url VARCHAR(200) NOT NULL,
            movie_id VARCHAR(200) NOT NULL
        );
        `, [] , (err, results) => {
            if(err){
                throw err
            }
        }
    );

    //updating movies table using imdb api
    if(isAPIActive && isAPIupdate){
        pool.query(
            `DELETE FROM movies`, [], (err, results) => {
                if(err){
                    throw err;
                }
                console.log("Movies are updating...");
        
                // getting top 250 movies via api query
                var settings = {
                    url: `https://imdb-api.com/en/API/Top250Movies/${APIKEY}`,
                    method: "GET",
                    headers: {
                    },
                    json: true
                };

                var top250movies;
                request(settings ,function (error,response, body) {
                    if(error){
                        throw error;
                    }
                    top250movies = body.items;      
                }).then(async ()=>{
                    for(var i = 0; i< filmCountAPI; i++){
                        var movieID = top250movies[i].id;
                        var movie;
                        var movieTrailerUrl;
                        console.log(movieID);
    
                        // getting movie information via api query
                        var settings2 = {
                            url: `https://imdb-api.com/tr/API/Title/${APIKEY}/${movieID}`,
                            method: "GET",
                            headers: {
                            },
                            json:true
                        };
                        settings3 = {
                            url: `https://imdb-api.com/API/Trailer/${APIKEY}/${movieID}`,
                            method: "GET",
                            headers: {
                            },
                            json:true
                        };

                        await request(settings2,function (error,response,movieBody) {
                            if(error){
                                throw error;
                            } 
                            //console.log(movieBody.title);
                            movie =  movieBody;
                        }); 
                
                        //getting trailer link of movie
                        await request(settings3 ,function (error,response, trailerBody) {
                            if(error){ 
                                throw error;
                            }
                            //console.log(JSON.parse(response3.body).linkEmbed);
                            movieTrailerUrl = trailerBody.linkEmbed + "?autoplay=false";
                        });

                        pool.query(
                            `INSERT INTO movies(movie_name, img_url, year, genres, summary, duration, rating, directors, stars, writers, video_url, movie_id)
                            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                            [movie.title, movie.image, movie.year, movie.genres, movie.plotLocal, movie.runtimeMins,
                            movie.imDbRating, movie.directors, movie.stars, movie.writers, movieTrailerUrl, movieID], (err, results) => {
                                if (err) {
                                    throw err;
                                }
                                console.log(movie.title + " is added successfully.");
                            } 
                        );
                    }   
                });  
            }
        );        
    }
});

