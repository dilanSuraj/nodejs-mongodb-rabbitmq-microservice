const express = require("express");
const app = express();
const PORT = process.env.PORT || 7020;
const mongoose = require("mongoose")
const User = require("./models/user")
const jwt = require("jsonwebtoken")

mongoose.connect("mongodb://localhost/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("AUTH SERVICE DB CONNECTED")
})

app.use(express.json());


app.post("/auth/login", async (req, res) =>{
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user){
        return res.json({message: "User doesn't exits"})
    } else {

        if(password !== user.password) {
            return res.json({message: "Passwod icorrect"})
        }

        const payload = {
            email,
            name: user.name,
        }
        jwt.sign(payload, "this_is_secret", (err, token) => {
            if(err) console.log(err) 
            else {
                return res.json({token: token})
            }
        } )
    }
})


app.post("/auth/register", async (req, res) => {
    const {email, password, name} = req.body;

    const userExists = await User.findOne({email});

    if(userExists) {
        return res.status(402).json({message: "User already exists"});
    } else {
        const newUser = new User({
            name,
            email,
            password
        })
        newUser.save();
        return res.status(200).json(newUser)
    }

})


app.listen(PORT, () => {
    console.log(`Auth service is running at port ${PORT}`)
})