const express = require('express')
const router = express.Router();
const Manager = require("../dataBaseManager")
const Joi = require("joi")


router.get("/", (req, res) =>{
    res.render("login.ejs")
})


router.get("/:id", async (req, res) =>{
    const book = await Manager.getUsers();
    console.log(book);
    if (book) {
        res.send("Author: " + book.author + " title: " + book.title);
        res.end();
    } else {
        res.status(404).send("Ni la mas palida idea quien es ese.")
    }
})

function validateUser(body){
    const minNameLength = 3;
    const minPassLength = 5;
    const schema = {
        name: Joi.string().min(minNameLength).required(),
        password: Joi.string().min(minPassLength).required()
    }
    return Joi.validate(body, schema);
}

router.post('/', async (req, res) => {
    const error = validateUser(req.body).error;
    if (!error){
        const id = 2;
        const name = req.body.name;
        const password = req.body.password;
        await Manager.insertUser(id, name, password);
        res.send({id, name, password});
    } else {
        res.status(400).send(error.details[0].message);
    }
})

// router.put('/:id', async (req, res) => {
//
// })

module.exports = router;