import crypto = require('crypto');
import http = require('http');
import https = require('https');
import url = require('url');

export class CommitAvatar {
  public static async fromGithub(owner: string, repo: string, commitHash: string): Promise<string | null> {
    return new Promise((resolve) => {
      https.get({
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repo}/commits/${commitHash}`,
        headers: { 'User-Agent': 'Git Graph extension for Visual Studio Code' },
        agent: false
      }, (res: http.IncomingMessage) => {
        let commitJson = '';
        res.on('data', (chunk: Buffer) => { commitJson += chunk; });
        res.on('end', () => {
          let commit: any = JSON.parse(commitJson);
          let avatarUrl: string | null = commit.author && commit.author.avatar_url;
          if (!avatarUrl) {
            resolve(null);
            return;
          }
          this.downloadImage(avatarUrl).then(image => { resolve(image); });
        });
      });
    });
  }

  public static async fromGitlab(email: string): Promise<string | null> {
    return new Promise((resolve) => {
      https.get({
        hostname: 'gitlab.com',
        path: `/api/v4/users?search=${email}`,
        headers: {
          // This token only has read_user access. It's safe to share it publicly.
          'Private-Token': 'eAdE8w1NULKqMLj4SnvY'
        },
        agent: false
      }, (res: http.IncomingMessage) => {
        let searchResultJson = '';
        res.on('data', (chunk: Buffer) => { searchResultJson += chunk; });
        res.on('end', () => {
          let searchResult = JSON.parse(searchResultJson);
          if (searchResult.length !== 1) {
            resolve(null);
            return;
          }
          let avatarUrl: string = searchResult[0].avatar_url;
          this.downloadImage(avatarUrl).then(image => { resolve(image); });
        });
      });
    });
  }

  public static async fromGravatar(email: string, identicon = true): Promise<string | null> {
    let hash = crypto.createHash('md5').update(email).digest('hex');
    let avatarUrl = 'https://secure.gravatar.com/avatar' +
                    `/${hash}${identicon ? '?d=identicon' : ''}`;

    return new Promise((resolve) => {
      this.downloadImage(avatarUrl).then(image => { resolve(image); });
    });
  }

  private static async downloadImage(imageUrl: string): Promise<string | null> {
    let imgUrl = url.parse(imageUrl);
    return new Promise((resolve) => {
      https.get({
        hostname: imgUrl.hostname,
        path: imgUrl.path,
        agent: false
      }, (res: http.IncomingMessage) => {
        let imageBufferArray: Buffer[] = [];
        res.on('data', (chunk: Buffer) => { imageBufferArray.push(chunk); });
        res.on('end', () => {
          let image: Buffer = Buffer.concat(imageBufferArray);
          resolve(image.toString('base64') || null);
        });
      });
    });
  }
}
