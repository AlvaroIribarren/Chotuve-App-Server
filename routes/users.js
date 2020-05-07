const express = require('express')
const router = express.Router();
const UserManager = require("../databases/UsersManager")
const FriendManager = require("../databases/FriendsManager")
const VideosManager = require("../databases/VideosManager")
const TokenManager = require("../databases/TokensManager")
const RequestManager = require("../databases/RequestManager")
const Joi = require("joi")

const minNameLength = 3;
const minPassLength = 5;

/*
    id: lo mando yo
    email: string
    name: string
    password: string
    phone: string
    profileimgurl: string
*/


router.get("/", async (req, res) =>{
    try {
        const users = await UserManager.getUsers();
        console.log(users);
        res.send(users);
    } catch (err) {
        console.error(err);
        res.send("Error: " + err);
    }
})


router.get("/:id", async (req, res) =>{
    const id = parseInt(req.params.id);
    await checkIdsExistence(req,res);
    const user = await UserManager.getUserById(id);
    res.send(user);
})

router.get("/:id/friends", async (req, res) => {
    const userId = parseInt(req.params.id);
    const friends = await FriendManager.getAllFriendsFromUser(userId);
    res.send(friends);
})

router.get("/:id/videos", async (req, res) => {
    const userId = parseInt(req.params.id);
    const videos = await VideosManager.getAllVideosFromUser(userId);
    res.send(videos)
})

router.get("/:id/token", async (req, res) => {
    const userId = parseInt(req.params.id);
    const token = await TokenManager.getTokenByUserId(userId);
    res.send(token)
})

router.get("/:id1/messages/:id2", async (req,res) => {
    const id1 = parseInt(req.params.id1);
    const id2 = parseInt(req.params.id2);
    const messages1 = await MessageManager.getAllMessagesSentById1ToId2(id1, id2);
    const messages2 = await MessageManager.getAllMessagesSentById1ToId2(id2, id1);

    const messages = messages1.concat(messages2);
    res.send(messages);
})

router.get("/:receiver_id/requests", async (req,res) => {
    const receiver_id = parseInt(req.params.receiver_id);
    const requests = await RequestManager.getAllRequestsReceivedByUserId(receiver_id);
    const listToReturn = [];
    for (let request of requests){
        const user = await UserManager.getUserById(request.sender_id);
        const data = {
            "sender_id": request.sender_id,
            "sender_name": user.name
        }
        listToReturn.push(data);
    }
    res.send(listToReturn);
});

function validateUser(body){
    const schema = {
        name: Joi.string().min(minNameLength).required(),
        password: Joi.string().min(minPassLength).required(),
        email: Joi.string().required(),
        phone: Joi.string().required(),
        profileimgurl: Joi.string().required(),
    }
    return Joi.validate(body, schema);
}


router.post('/', async (req, res) => {
    const error = validateUser(req.body).error;
    if (!error){
        const id = await UserManager.generateNewId();
        const name = req.body.name;
        const password = req.body.password;
        const email = req.body.email;
        const phone = req.body.phone;
        const profileImgUrl = req.body.profileimgurl;
        await UserManager.insertUser(id, name, password, email, phone, profileImgUrl);
        res.status(201).send({id, name, password, email, phone, profileImgUrl});
    } else {
        res.status(400).send(error.details[0].message);
    }
})

router.post('/:receiver_id/friends', async (req, res) => {
    const data = {
        id1: parseInt(req.params.receiver_id),
        id2: parseInt(req.body.sender_id)
    }
    const error = await FriendManager.validateInput(data).error;

    const request1 = await RequestManager.getRequestSentBySenderToReceiver(data.id2, data.id1);

    if (!error && request1){
        await RequestManager.deleteRequestFromSenderToReceiver(data.id1, data.id2);
        await RequestManager.deleteRequestFromSenderToReceiver(data.id2, data.id1);
        await FriendManager.postRelation(data, res);
    } else {
        res.status(400).send("Datos invalidos o inexistentes");
    }
})

async function checkIdsExistence(req, res){
    const id = parseInt(req.params.id);
    const user = await UserManager.getUserById(id);
    console.log(user);

    if (!user){
        res.status(404).send("No hay ningun usuario con id: " + id);
    }
}

router.put('/:id', async (req, res) => {
    await checkIdsExistence(req, res);
    const error = validateUser(req.body).error;

    console.log(req.body);
    if(error){
        res.status(400).send("Error en validacion: " + error.details[0].message);
    } else {
        const newUserName = req.body.name;
        await UserManager.editUser('name', newUserName, 'id', id);
        res.send(newUserName);
    }
})

router.post("/:receiver_id/requests", async (req, res)=> {
    const data = {
        sender_id: parseInt(req.body.sender_id),
        receiver_id: parseInt(req.params.receiver_id)
    }
    await RequestManager.postRequest(data, res);
});

router.delete('/:id', async (req, res) => {
    await checkIdsExistence(req, res);
    const id = parseInt(req.params.id);
    await UserManager.deleteUserById(id);
    res.status(200).send("User eliminated");
})

module.exports = router;
