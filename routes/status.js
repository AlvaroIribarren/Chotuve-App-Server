const express = require('express');
const router = express.Router();
const UserManager = require("../Managers/Users/UsersManager")
const VideoManager = require("../Managers/Videos/VideosManager")
const SearchManager = require("../Managers/SearchManager")
const RequestTableManager = require("../Managers/RequestTableManager")

router.get("/", async (req, res) => {
    try {
        const amountOfUsers = await UserManager.getAmountOfUsers();
        const amountOfVideos = await VideoManager.getAmountOfVideos();
        const searches  = await SearchManager.getSearches();
        const active_users = await UserManager.getActiveUsers();
        const totalViews = await VideoManager.getTotalViews();
        const requests = await RequestTableManager.getRequests();
        const data = {amountOfUsers, amountOfVideos, searches, active_users, totalViews, requests};
        res.send(data);
    } catch {
        res.status(401).send("Invalid request from created user, probably no fb token");
    }
})

module.exports = router;