const express = require('express')
const router = express.Router();
const UserManager = require("../Managers/Users/UsersManager")
const FriendManager = require("../Managers/FriendsManager")
const VideosManager = require("../Managers/Videos/VideosManager")
const TokenManager = require("../Managers/TokensManager")
const FriendRequestManager = require("../Managers/FriendRequestManager")
const MessageManager = require("../Managers/MessagesManager")
const CommentManager = require("../Managers/CommentsManager")
const ReactionManager = require("../Managers/Reactions/ReactionsManager")
const auth = require("../Middleware/auth")

//pre:
//post: sends all users. Sends nothing if empty.
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

//pre:
//post: sends the user if he exists. Sends an error if he doesn't
router.get("/:id", async (req, res) =>{
    const id = parseInt(req.params.id);
    const user = await UserManager.getUserById(id);
    if(user)
        res.send(user);
    else
        res.status(404).send("User not found");
})


//pre: user exists
//post: sends all friend from user id.
router.get("/:id/friends", auth, async (req, res) => {
    const userId = parseInt(req.params.id);
    const userExists = await UserManager.getUserById(userId);
    if (userExists){
        const friends = await FriendManager.getAllFriendsFromUser(userId);
        res.send(friends);
    } else {
        res.status(404).send("User with id: " + userId + " not found.");
    }
})

//pre: user exists.
//post: sends all videos from user id. If the requester_id is equal to the user_id also the private videos are
//returned.
router.get("/:id/videos", async (req, res) => {
    const requester_id = parseInt(req.header("requester_id"));
    const userId = parseInt(req.params.id);
    const userExists = await UserManager.getUserById(userId);
    if (userExists){
        const showPrivateVideos = (requester_id === userId);
        const videos = await VideosManager.getAllVideosFromUser(userId, showPrivateVideos);
        res.send(videos)
    } else {
        res.status(404).send("User with id: " + userId + " not found.");
    }
})

//pre: user exists.
//post: sends token from user.
router.get("/:id/token", async (req, res) => {
    const userId = parseInt(req.params.id);
    const userExists = await UserManager.getUserById(userId);
    if (userExists){
        const token = await TokenManager.getTokenByUserId(userId);
        res.send(token)
    } else {
        res.status(404).send("User with id: " + userId + " not found.");
    }
})

//pre: id1 and id2 users exist.
//post: sends all messages sent by id1 to id2.
router.get("/:id1/messages/:id2", async (req,res) => {
    const id1 = parseInt(req.params.id1);
    const id2 = parseInt(req.params.id2);

    const user1Exists = await UserManager.getUserById(id1);
    const user2Exists = await UserManager.getUserById(id2);

    if (user1Exists && user2Exists){
        const messages1 = await MessageManager.getAllMessagesSentById1ToId2(id1, id2);
        const messages2 = await MessageManager.getAllMessagesSentById1ToId2(id2, id1);

        const messages = messages1.concat(messages2);
        res.send(messages);
    } else {
        res.status(404).send("User with id: " + id1 + " or " + id2 + " not found.");
    }
})

router.get("/:receiver_id/requests", async (req,res) => {
    const receiver_id = parseInt(req.params.receiver_id);
    const requests = await FriendRequestManager.getAllRequestsReceivedByUserId(receiver_id);
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


router.post('/', async (req, res) => {
    const error = await UserManager.validateUser(req.body).error;
    if (!error){
        await UserManager.postUser(req.body, res);
    } else {
        res.status(400).send(error.details[0].message);
    }
})

router.post('/:receiver_id/friends', async (req, res) => {
    const data = {
        id1: parseInt(req.params.receiver_id),  //id1: received/accepted request
        id2: parseInt(req.body.sender_id)       //id2: sent request
    }
    const error = await FriendManager.validateInput(data).error;
    if (!error){
        await FriendManager.postRelation(data, res);
    } else {
        res.status(400).send("Datos invalidos o inexistentes");
    }
})

router.post("/:receiver_id/requests", async (req, res)=> {
    const data = {
        sender_id: parseInt(req.body.sender_id),
        receiver_id: parseInt(req.params.receiver_id)
    }
    console.log("Post in request");
    await FriendRequestManager.postRequest(data, res);
});

router.delete('/:id', async (req, res) => {
    const requester_id = parseInt(req.headers["requester-id"]);
    const id = parseInt(req.params.id);
    const userAllowed = requester_id === id;
    if (userAllowed) {
        await UserManager.deleteUserById(id);
        await VideosManager.deleteAllVideosFromUser(id);
        await CommentManager.deleteAllCommentsFromUsers(id);
        await ReactionManager.deleteAllReactionsFromUser(id);
        await MessageManager.deleteAllMessagesWithUserInvolved(id);
        await FriendManager.deleteAllRelationsFromUser(id);
        await FriendRequestManager.deleteAllRequestsWhereUserIsInvolved(id);

        res.status(200).send("User eliminated");
    } else {
        console.log("User cant delete another's profile");
        res.status(401).send("User cant delete another's profile");
    }
})

router.delete('/:id1/friends/:id2', async (req,res) => {
    const id1 = parseInt(req.params.id1);
    const id2 = parseInt(req.params.id2);
    const requester_id = parseInt(req.headers["requester-id"])

    if (id1 === requester_id || id2 === requester_id) {
        const positiveResult = await FriendManager.deleteRelationBetweenUsers(id1, id2);
        if (positiveResult) {
            await MessageManager.deleteAllMessagesBetweenUsers(id1, id2);
            res.send("Amistad eliminada");
        } else {
            res.status(404).send("Users not found or they weren't friends");
        }
    } else {
        console.log("User not allowed to delete this friendship");
        res.status(401).send("User not allowed to delete this friendship");
    }
})

router.put('/:id/image', async (req,res) => {
    const id = parseInt(req.params.id);
    const error = await UserManager.validateImageModification(req.body).error;
    const user = await UserManager.getUserById(id);
    const requester_id = parseInt(req.headers["requester-id"]);
    const hasPermissionToModify = requester_id === user.id;


    if (!error && user && hasPermissionToModify){
        const img_id = user.img_id;
        const img_url = req.body.img_url;
        const img_uuid = req.body.img_uuid;
        const result = await UserManager.changeProfilePicture(id, img_id, img_url, img_uuid);

        if (result){
            res.status(200).send({id, img_url, img_uuid});
        } else {
            res.status(400).send("Something failed :)");
        }
    } else {
        if (!hasPermissionToModify){
            res.status(401).send("Flaco no podes modificar un perfil que no es tuyo");
        } else {
            res.status(404).send(error.details[0].message);
        }
    }
})

router.put('/:id/profile', async (req, res) => {
    const id = parseInt(req.params.id);
    const error = await UserManager.validateProfileModification(req.body).error;
    const userExists = await UserManager.doesUserExist(id);
    const requester_id = parseInt(req.headers["requester-id"]);
    const hasPermissionToModify = requester_id === user.id;

    if(!error && userExists && hasPermissionToModify){
        const data = {
            display_name: req.body.name,
            email: req.body.email,
            phone_number: req.body.phone
        }
        const result = await UserManager.editUser(id, data);
        res.status(200).send(result);
    } else {
        res.status(400).send("Error en validacion: " + error.details[0].message);
    }
});

router.put("/:user_id/enabled", async (req,res) => {
    const user_id = parseInt(req.params.user_id);
    const enabled = await VideosManager.isVideoEnabled(user_id);
    if (enabled) {
        await UserManager.disableUser(user_id);
        res.send("User disabled");
    } else {
        await UserManager.enableUser(user_id);
        res.send("User enabled");
    }
})

module.exports = router;
