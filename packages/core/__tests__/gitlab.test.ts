import {Gitlab} from '../src/gitlab';

const mockEnv = jest.fn();
mockEnv.mockReturnValue({});
// @ts-ignore
jest.mock('env-ci', () => (...args) => mockEnv(...args));

const origToken = process.env.GITLAB_TOKEN;

describe('gitlab', () => {
  describe('constructor', () => {

    afterEach(() => {
      process.env.GITLAB_TOKEN = origToken;
    });

    it('should fail without a commit', () => {
      process.env.GITLAB_TOKEN = 'yes';
      expect(() => new Gitlab({})).toThrow();
    });

    it('should fail without a token', () => {
      process.env.GITLAB_TOKEN = '';
      expect(() => new Gitlab({commit: 'sssss'})).toThrow();
    });
  });

  test('getKeyedComment', async () => {
    const commently = new Gitlab({
      commit: 'sssss',
      token: 'sssss',
    });
    const comments = [
      {
        author: {
          id: 'user'
        },
        body: 'non-keyed'
      },
      {
        author: {
          id: 'not-user',
        },
        body: 'non-keyed',
      },
      {
        author: {
          id: 'user',
        },
        body: `${commently.header}\n and  something`,
      },
    ];

    // @ts-ignore
    commently.getUser = jest.fn().mockResolvedValue({ id: 'user' });
    // @ts-ignore
    commently.getComments = jest.fn().mockResolvedValue(comments);

    // @ts-ignore
    await expect(commently.getKeyedComment()).resolves.toStrictEqual(
      comments[2],
    );
  });
});
