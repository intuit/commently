import {Comment, Github, Gitlab} from './core'
import * as Octokit from '@octokit/rest';

type TComment = Comment | Octokit.IssuesListCommentsResponseItem
type TThis = Github | Gitlab

export function buildKeyedComment (
  this: TThis,
  comment: TComment,
  body: string,
  append = true,
) {
  this.debug('Editing existing Keyed Comment. id=%s', comment.id);
  const historyDelim = `<!-- ${this.key}-history -->`;

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

    const newComment = [
      header,
      `${body}\n`,
      this.useHistory && history,
      footer
    ].filter((part): part is string => typeof part === 'string');
    parts.push(...newComment);

    return {
      id: comment.id,
      body: parts.join(this.delim)
    };
  }

  return {
    id: comment.id,
    body: [this.header, body+'\n', this.footer].join(this.delim),
  }
}