import crypto = require('crypto');
import http = require('http');

export class CommitAvatar {
  public static async fromGithub(commitHash: string): Promise<string | null> {
    // Example where I pushed with known email: https://api.github.com/repos/meierw/buildbot/commits/6e14c159864306fc571571d7163cb9ebc4c8f8c7
    // Example where I pushed with unknown email: https://api.github.com/repos/meierw/vscode-git-graph/commits/fc0bef9af8e556a304f82719ed389d1d95629ad5
    return 'githubBase64';
  }

  public static async fromGitlab(commitHash: string): Promise<string | null> {
    // Gitlab user can be found exactly by email
    // Need to login with free account first though
    // https://gitlab.com/api/v4/users?search=valters.meirens@gmail.com
    return 'gitlabBase64';
  }

  public static async fromGravatar(email: string, identicon = true): Promise<string | null> {
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

/* Research notes:
Github user can't be found by email like in Gitlab,
unless the user has made his email public. So the only
way, to find the github profile properly, is to check
the commit info, which contains the "author" field.

The minimum steps that we'll need to take for Github are:
  * Create a local user definition for a specific `user.name` and `user.email` combo
  * Get the lastest commit by this local user
  * Check out Gravatar if nothing relevant was found on Github
  * Cache it so that this process is not repeated for every commit made by this local user
*/
