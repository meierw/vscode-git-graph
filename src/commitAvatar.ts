import crypto = require('crypto');
import fs = require('fs');
import http = require('http');

export class CommitAvatar {

  /**
   * Searches through the `services` (in the order they are specified)
   * for the users avatar picture.
   * @param username - Will be used for querying everything, except `'gravatar'`.
   * @param email - Will be used for querying `'gravatar'`.
   * @param services - Possible values: `['github', 'gitlab', 'gravatar']`.
   * Default: `['github', 'gravatar']`.
   * @returns A `Promise` with the first found avatar, or with `null` if nothing found.
   */
  public static async retrieve(username: string, email = '', services = ['github', 'gravatar']): Promise<string | null> {
    let result: string | null = null;

    // Could alternatively get all the promises at once,
    // so they start doing http requests in parallel,
    // but that probably will just saturate the network too much,
    // when the first service most likely will have the needed result.
    for (let i in services) {
      let serviceProper = services[i].replace(/\w\S*/g,
        function(s){return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();}
      );
      if (serviceProper === 'Gravatar') {
        result = await CommitAvatar.retrieveFromGravatar(email);
      } else {
        let retrieveMethod = (CommitAvatar as any)[`retrieveFrom${serviceProper}`];
        if (retrieveMethod) result = await retrieveMethod(username);
      }
      
      if (result !== null) break;
    }

    return result;
  }

  private static async retrieveFromGithub(email: string): Promise<string | null> {
    return 'githubBase64';
  }

  private static async retrieveFromGravatar(email: string, identicon = true): Promise<string | null> {
    let hash = crypto.createHash('md5').update(email).digest('hex');

    return new Promise((resolve) => {
      http.get({
        hostname: 'gravatar.com',
        path: `/avatar/${hash}${identicon ? '?d=identicon' : ''}`,
        agent: false
      }, (res: http.IncomingMessage) => {
        res.on('data', (data: Buffer) => {
          resolve(data.toString('base64') || null);
        });
      });
    });
  }
}
