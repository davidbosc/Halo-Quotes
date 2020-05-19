const axios = require('axios');
//This is a base64 encoded client_id:client_secret pair that is unique per spofitfy app.
//The key I'm using in my app has been redacted, so to use this code, yo would need to populate your own.
const ENCODED_ID_SECRET = "";

const getAccessToken = async () => {
    let access_token = "";
    let request = axios({
        method: 'post',
        url: "https://accounts.spotify.com/api/token",
        data: "grant_type=client_credentials",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + ENCODED_ID_SECRET
        }
    }).then(response => {
        access_token = response.data.access_token;
    })
    await request;
    return access_token;
}

exports.getAccessToken = getAccessToken;