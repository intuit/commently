import { buildKeyedComment } from "../src/helpers";
import { Gitlab, Comment } from "../src/core";

describe('buildKeyedComment', () => {
  let fauxThis : Gitlab
  let fauxComment: Comment
  beforeEach(() => {
    fauxThis = {
      header: 'header',
      footer: 'footer',
      key: 'key',
      delim: 'delim',
      useHistory: true,
      debug: jest.fn()
    } as unknown as Gitlab
    fauxComment = {
      id: 'comment-id',
      body: 'body'
    } as unknown as Comment
  })
  test('creates a comment with history', () => {
    const {id, body} = buildKeyedComment.bind(fauxThis)(fauxComment, 'new body', true)
    expect(id).toBe(fauxComment.id)
    expect(body).toMatchSnapshot()
    expect(fauxThis.debug).toBeCalledTimes(1)
  })
  test('creates a comment without history', () => {
    const {id, body} = buildKeyedComment.bind(fauxThis)(fauxComment, 'new body', false)
    expect(id).toBe(fauxComment.id)
    expect(body).toMatchSnapshot()
    expect(fauxThis.debug).toBeCalledTimes(1)
  })
})