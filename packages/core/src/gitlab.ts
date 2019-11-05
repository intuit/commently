/* eslint-disable camelcase, @typescript-eslint/camelcase */

import * as GitlabApi from 'gitlab';
import * as debug from 'debug';
import * as envCi from 'env-ci';
import { buildKeyedComment } from './helpers';

interface CommentlyArgs {
  /** The MR sha to comment on. Is detected in CI environments */
  commit?: string;
  /** The title at the top of the comment */
  title?: string;
  /** The unique key to identify the comment by, not shown to end users */
  key?: string;
  /** Key a history of the comments in the comment created by this library */
  useHistory?: boolean;
  /** The gitlab token if not in your environment */
  token?: string;
}

interface User {
  id: number;
}

interface MRInfo {
  project_id: number;
  iid: number;
  sha: string;
}

export interface Comment {
  author: {
    id: number;
  };
  body: string;
  sha: string;
  id: number;
}

/** Create a "commenter" that can comment on a pull request */
export class Gitlab {
  public readonly header: string;
  public readonly useHistory: boolean;
  public readonly key: string;
  public readonly footer: string;
  public readonly delim: string;
  public readonly debug: debug.IDebugger;

  private user?: User;
  private project_id?: number;
  private iid?: number;
  private readonly commitSha: string;
  private readonly gitlabToken: string;
  private readonly title: string;
  private readonly gitlab: GitlabApi.Gitlab;

  constructor(args: CommentlyArgs) {
    this.debug = debug('commently-gitlab');

    const env = envCi();
    const commitSha = args.commit || ('commit' in env && env.commit);
    const gitlabToken = process.env.GITLAB_TOKEN || args.token
    const gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com'
    const certsIgnored = process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
    if (!commitSha) {
      throw new Error(
        "A Commit SHA wasn't provided as an argument (--commit) or detected in the CI environment.",
      );
    }

    if (!gitlabToken) {
      throw new Error(
        "A gitlab token wasn't provided as an argument (--token) or detected in your environment.",
      );
    }

    this.gitlabToken = gitlabToken
    this.commitSha = commitSha
    this.title = args.title || '';
    this.key = args.key || 'commently';
    this.useHistory = 'useHistory' in args ? Boolean(args.useHistory) : true;

    this.header = `<!-- \n ${this.key}-id: ${this.commitSha} \n -->\n${this.title}\n`;
    this.footer = `Courtesy of your **[${this.key}](https://github.com/intuit/commently)** bot :package: :rocket:`;
    this.delim = `<!-- ${this.key}-section -->\n\n`;

    this.debug('Initialized: commit=%s', this.commitSha);

    this.gitlab = new GitlabApi.Gitlab({
      token: this.gitlabToken,
      host: gitlabUrl,
      rejectUnauthorized: !certsIgnored
    });
  }

  /**
   * Comment the body param on the pull requests
   *
   * @param {string} body - the comment to post
   * @param {boolean} append - whether to append the comment to the last comment
   */
  async autoComment(body: string, append = true) {
    this.debug('Auto Commenting: commitSha=%s append?=%s', this.commitSha, append);

    const keyedComment = await this.getKeyedComment();

    if (!keyedComment) {
      return this.createKeyedComment(body);
    }

    return this.editKeyedComment(keyedComment, body, append);
  }

  private async editKeyedComment(
    comment: Comment,
    bodyIn: string,
    append = true
  ) {
    const {id, body} = buildKeyedComment.bind(this)(comment, bodyIn, append)
    return this.editComment(
      id,
      body
    );
  }

  private async editComment(id: number, body: string) {
    return this.gitlab.MergeRequestNotes.edit(
      this.project_id as number, this.iid as number, id, body,
    );
  }

  private async getKeyedComment() {
    const allComments = await this.getComments();
    const user = await this.getUser() as User;
    return allComments.find(
      (comment) => {
        const hasHeader = comment.body && comment.body.indexOf(this.header) !== -1
        const weWrote = comment.author && comment.author.id === user.id
        return Boolean(hasHeader) && Boolean(weWrote)
      },
    );
  }

  private async getMr() {
    const currentMergeRequests = await this.gitlab.MergeRequests.all({}) as MRInfo[]
    const shaMergeRequest = currentMergeRequests && currentMergeRequests.find(info => info.sha === this.commitSha)
    const {project_id, iid} = shaMergeRequest as MRInfo
    if (!project_id || !iid) {
      throw new Error(
        'Could not find any merge requests at all. Are you sure you have your token and sha correctly setup?',
      )
    }

    this.project_id = project_id
    this.iid = iid
  }

  private async getComments() {
    if (!this.project_id || !this.iid) {
      await this.getMr()
    }

    const currentMergeRequestComments = await this.gitlab.MergeRequestNotes.all(
      this.project_id as number, this.iid as number,
    ) as Comment[]
    if (!Array.isArray(currentMergeRequestComments)) {
      throw new Error(
        'Could not find any comments at all. Are you sure you have your request correctly setup?',
      )
    }

    return currentMergeRequestComments
  }

  private async getUser() {
    if (this.user) {
      return this.user;
    }

    const user = await this.gitlab.Users.current({}) as User

    if (user && user.id) {
      this.user = user
    } else {
      throw new Error('Could not retrieve Gitlab user, your token is probably wrong');
    }

    return this.user
  }

  private async createComment(body: string) {
    return this.gitlab.MergeRequestNotes.create(
      this.project_id as number, this.iid as number, body,
    );
  }

  private async createKeyedComment(body: string) {
    this.debug('Creating new Keyed Comment');

    return this.createComment(
      `${this.header}${this.delim}${body}\n${this.delim}${this.footer}`
    );
  }
}
