const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport){

    const authenticateUser = (email, password, done) => {
        pool.query(
            `SELECT * from users WHERE email = $1`, [email], (err, results) =>{
                if(err){
                    throw err;
                }

                if(results.rows.length > 0){
                    const user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch)=>{
                        if(err){
                            throw err;
                        }
                        if(isMatch){
                            if(user.isactivated){
                                return done(null, user);
                            }
                            else{
                                return done(null, false, {message: "Lütfen emailinize gelen linkten hesabınızı aktifleştiriniz!"});
                            }
                        }else{
                            return done(null, false, {message: "Şifre yanlış!"});
                        }
                    });   
                }
                else{
                    return done(null, false, {message: "Email kayıtlı değil!"});
                }
            }
        );
    };

    passport.use(
        new LocalStrategy({
                usernameField: "email",
                passwordField: "password"
            },
            authenticateUser
        )
    );

    passport.serializeUser((user,done)=> done(null,user.email));

    passport.deserializeUser((email,done)=>{
        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results) =>{
                if(err){
                    throw err;
                }
                return done(null, results.rows[0]);
            }
        );
    });
}

module.exports = initialize;