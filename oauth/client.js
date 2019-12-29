const oauth2 = require("simple-oauth2");

const credentials = {
    client: {
        id: process.env.OAUTH_CLIENT_ID,
        secret: process.env.OAUTH_CLIENT_SECRET
    },
    auth: {
        tokenHost: "https://us.battle.net"
    }
};

class OAuthClient {
    constructor() {
        this.client = oauth2.create(credentials);
        this.token = null;
    }

    async getToken() {
        if (this.token === null || this.token.expired()) {
            const token = await this.client.clientCredentials.getToken();
            this.token = this.client.accessToken.create(token);
            return this.token;
        } else {
            return this.token.token.access_token;
        }
    }
}

module.exports = OAuthClient;
