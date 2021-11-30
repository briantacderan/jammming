const authEP = 'https://accounts.spotify.com/authorize';
const searchEP = 'https://api.spotify.com/v1/search?type=track&q=';
const baseEP = 'https://api.spotify.com/v1/';
const clientId = '651afa461d654cd68a3ff8e75f126979';
const redirectUri = 'http://jammyjamjam4life.surge.sh';
let accessToken;

export const Spotify = {
  getAccessToken() {
    if (accessToken) {

      return accessToken;
    }
    // check for access token match
    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      const expiresIn = Number(expiresInMatch[1]);
      // This clears the parameters, allowing us to grab a new access token when it expires
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');

      return accessToken;
    } else {
      const accessUrl = `${ authEP }?client_id=${ clientId }&response_type=token&scope=playlist-modify-public&redirect_uri=${ redirectUri }`;
      window.location = accessUrl;
    }
  },
  search(term) {
    const accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${ accessToken }` };
    return fetch(`${ searchEP }${ term }`, { headers: headers
    }).then(response => response.json()
    ).then(jsonResponse => {
      if (!jsonResponse.tracks) {

        return [];
      }
      return jsonResponse.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri
      }));
    });
  },
  savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {

      return;
    }
    accessToken = Spotify.getAccessToken();
    const headers = { Authorization: `Bearer ${ accessToken }` };
    let userId;

    return fetch(`${ baseEP }me`, { headers: headers }
    ).then(response => response.json()
    ).then(jsonResponse => {
      userId = jsonResponse.id;

      return fetch(`${ baseEP }users/${ userId }/playlists`, {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ name: name })
      }).then(response => response.json()
      ).then(jsonResponse => {
        const playlistId = jsonResponse.id;

        return fetch(`${ baseEP }playlists/${ playlistId }/tracks`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ uris: trackUris })
        });
      });
    });
  }
}
