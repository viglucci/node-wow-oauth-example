const rp = require('request-promise');
const slug = require('slug');
const {
    NAMESPACE_PROFILE_US,
    DEFAULT_LOCALE
} = require('../constants');

class CharacterService {

    constructor(oauthClient) {
        this.oauthClient = oauthClient;
    }

    async getCharacter(characterName, realmName) {
        const oauthToken = await this.oauthClient.getToken();
        const encodedCharacterName = encodeURIComponent(characterName);
        const realmNameSlug = slug(realmName);
        const characterSummaryDocumentURL = `https://us.api.blizzard.com/profile/wow/character/${realmNameSlug}/${encodedCharacterName}`;
        const response = await rp.get({
            uri: characterSummaryDocumentURL,
            json: true,
            qs: {
                locale: DEFAULT_LOCALE,
                namespace: NAMESPACE_PROFILE_US
            },
            headers: {
                Authorization: `Bearer ${oauthToken}`
            }
        });
        return response;
    }

    async getCharacterMedia(character) {
        const oauthToken = await this.oauthClient.getToken();
        const characterMediaDocumentURL = character.media.href;
        const response = await rp.get({
            uri: characterMediaDocumentURL,
            json: true,
            headers: {
                Authorization: `Bearer ${oauthToken}`
            }
        });
        return response;
    }

    async getUsersCharactersList(usersAccessToken) {
        const response = await rp.get({
            uri: `https://us.api.blizzard.com/profile/user/wow?namespace=profile-us`,
            json: true,
            headers: {
                Authorization: `Bearer ${usersAccessToken}`
            }
        });
        const { wow_accounts } = response;
        const characters = wow_accounts
            .map((account) => this._mapWowAccount(account))
            .flat()
            .sort((characterA, characterB) => {
                return (characterA.level < characterB.level) ? 1 : -1;
            });
        return characters;
    }

    _mapWowAccount(account) {
        const { characters } = account;
        return characters.map((character) => this._mapCharacter(account, character));
    }

    _mapCharacter(account, character) {
        character.account_id = account.id;
        const characterName = character.name.toLowerCase();
        const realmSlug = character.realm.slug;
        character.armoryUrl = `https://worldofwarcraft.com/character/us/${realmSlug}/${characterName}`;
        return character;
    }
}

module.exports = CharacterService;
