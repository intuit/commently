import * as Octokit from '@octokit/rest';
import * as debug from 'debug';
import * as envCi from 'env-ci';

interface CommentlyArgs {
  pr?: number;
  owner?: string;
  repo?: string;
  title?: string;
}

interface EnvCi {
  pr?: number;
  slug?: string;
}

interface User {
  id: number;
}

export default class Commently {
  public readonly header: string;

  private user?: User;
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly title: string;
  private readonly issueId: number;
  private readonly footer: string;
  private readonly delim: string;
  private readonly debug: debug.IDebugger;

  constructor(args: CommentlyArgs) {
    this.debug = debug('commently');

    const { pr, slug = '' } = envCi() as EnvCi;
    const [owner, repo] = slug.split('/');
    const prNumber = args.pr || pr;

    if (!prNumber) {
      throw new Error(
        "A PR number wasn't provided as an argument (--pr) or detected in the CI environment."
      );
    }

    this.title = args.title || 'commently';
    this.owner = args.owner || owner;
    this.repo = args.repo || repo;

    if (!this.owner) {
      throw new Error(
        "A owner wasn't provided as an argument (--owner) or detected in the CI environment."
      );
    }

    if (!this.repo) {
      throw new Error(
        "A repo wasn't provided as an argument (--repo) or detected in the CI environment."
      );
    }

    this.issueId = prNumber;
    this.header = `<!-- \n ${this.title}-id: ${this.issueId} \n -->\n${
      this.title
    }\n`;
    this.footer = `Courtesy of your **[${
      this.title
    }](https://github.com/intuit/commently)** bot :package::rocket:`;
    this.delim = `<!-- ${this.title}-section -->\n\n`;

    this.debug('Initialized: owner=%s repo=%s', this.owner, this.repo);

    const startUpArgs: Octokit.Options = {
      baseUrl: process.env.GITHUB_URL || 'https://api.github.com'
    };
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

    if (token) {
      startUpArgs.auth = `token ${token}`;
    }

    this.octokit = new Octokit(startUpArgs);
  }

  async autoComment(body: string, append = true) {
    this.debug('Auto Commenting: issueId=%s append?=%s', this.issueId, append);

    const keyedComment = await this.getKeyedComment();

    if (!keyedComment) {
      return this.createKeyedComment(body);
    }

    return this.editKeyedComment(keyedComment, body, append);
  }

  private async editKeyedComment(
    comment: Octokit.IssuesListCommentsResponseItem,
    body: string,
    append = true
  ) {
    this.debug('Editing existing Keyed Comment. id=%s', comment.id);
    const historyDelim = `<!-- ${this.title}-history -->`;

    if (append) {
      const parts = comment.body.split(this.delim);
      const header = parts.shift();
      const last = (parts.shift() || '')
        .replace('- ', '')
        .replace(/`/g, '')
        .replace('@', '<span>@</span>');
      const footer = parts.pop();
      let history = parts.shift();

      if (history) {
        const historyParts = history.split(historyDelim);
        const historyHeader = historyParts.shift();
        const historyFooter = historyParts.pop();
        // Only keep 10 items in history
        const historySubParts = (historyParts.pop() || '').split('<hr>');

        if (historySubParts.length > 10) {
          historySubParts.splice(0, historySubParts.length - 10);
        }

        historyParts.push(historySubParts.join('<hr>'));
        historyParts.push(`<hr><p>${last.split('\n').join('<br>')}</p>`);
        history = [historyHeader, historyParts.join('\n'), historyFooter].join(
          `${historyDelim}`
        );
      } else {
        history = `<details><summary>History</summary><div>\n${historyDelim}\n<hr><p>${last
          .split('\n')
          .join('<br>')}</p>${historyDelim}\n</div></details>\n</br>`;
      }

      const newComment = [header, `${body}\n`, history, footer].filter(
        (part): part is string => typeof part === 'string'
      );
      parts.push(...newComment);

      return this.editComment(comment.id, parts.join(this.delim));
    }

    return this.editComment(
      comment.id,
      `${this.header}${this.delim}${body}\n${this.delim}${this.footer}`
    );
  }

  private async editComment(id: number, body: string) {
    return this.octokit.issues.updateComment({
      body,
      // eslint-disable-next-line
      comment_id: id,
      owner: this.owner,
      repo: this.repo
    });
  }

  private async getKeyedComment() {
    const allComments = await this.getComments();
    const user = await this.getUser();
    const userComments = allComments.filter(
      comment => comment.user.id === user.id
    );
    const keyedComments = userComments.filter(
      comment => comment.body.indexOf(this.header) !== -1
    );

    return keyedComments[0];
  }

  private async getComments(
    options: Partial<Octokit.IssuesListCommentsParams> = {}
  ) {
    const response = await this.octokit.issues.listComments({
      number: this.issueId,
      owner: this.owner,
      repo: this.repo,
      ...options
    });

    if (!response || !response.data) {
      throw new Error(`Could not get comments for issue: ${this.issueId}`);
    }

    return response.data;
  }

  private async getUser() {
    if (this.user) {
      return this.user;
    }

    const response = await this.octokit.users.getAuthenticated({});

    if (response && response.data) {
      this.user = response.data as User;
      return this.user;
    }

    throw new Error('Could not retrieve Github user');
  }

  private async createComment(body: string) {
    return this.octokit.issues.createComment({
      body,
      number: this.issueId,
      owner: this.owner,
      repo: this.repo
    });
  }

  private async createKeyedComment(body: string) {
    this.debug('Creating new Keyed Comment');

    return this.createComment(
      `${this.header}${this.delim}${body}\n${this.delim}${this.footer}`
    );
  }
}
