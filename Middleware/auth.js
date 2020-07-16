const RequestManager = require("../Managers/ExternalManagers/RequestsManager")
const LoginManager = require("../Managers/LoginManager")

const AUTHORIZER_URL = "https://chotuve-auth-server-g5-dev.herokuapp.com/authorizer";

async function authorize(sl_token){
    const header = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': sl_token
        }
    }

    //todo: post a
    const result = await RequestManager.getResponseByLinkWithHeader(AUTHORIZER_URL, header);
    const status = result.status;
    return (status === 200);
}

module.exports = async (req, res, next) => {
    try {
        const sl_token = req.headers["sl-token"];
        const refresh_token = req.headers["refresh-token"];

        if (sl_token && !refresh_token) {
            const authorized = await authorize(sl_token);
            console.log("Imprimo sl_token de validacion:" + sl_token);
            if (!authorized) {
                console.log("NO AUTORIZADO");
                res.status(401).send("Invalid request.");
            } else {
                console.log("AUTORIZADO");
                next();
            }
        } else if (sl_token && refresh_token) {
            try {
                console.log("Asked for Refresh token")
                console.log(refresh_token);
                const Sl_Token = await LoginManager.getNewSLToken(refresh_token);
                console.log("NEW SL_TOKEN: " + sl_token);
                res.locals.sl_token = Sl_Token;
                next();
            } catch {
                res.status(401).send("Invalid request in relogin, probably refresh token missing");
            }
        } else {
            res.status(5000).send("Unknown error");
        }
    } catch {
        res.status(401).json({
            error: new Error('Si estas viendo esto, Houston, tenemos un problema! (auth)')
        });
    }
};