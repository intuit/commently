import Commently from '../core';

const mockOcto = jest.fn();
// @ts-ignore
jest.mock('@octokit/rest', () => (...args) => mockOcto(...args));

const mockEnv = jest.fn();
mockEnv.mockReturnValue({});
// @ts-ignore
jest.mock('env-ci', () => (...args) => mockEnv(...args));

const origToken = process.env.GH_TOKEN;

describe('commently', () => {
  describe('constructor', () => {
    beforeEach(() => {
      mockOcto.mockReset();
    });

    afterEach(() => {
      process.env.GH_TOKEN = origToken;
    });

    it('should fail without a pr number', () => {
      process.env.GH_TOKEN = 'yes';
      expect(() => new Commently({ owner: 'foo', repo: 'bar' })).toThrow();
    });

    it('should fail without an owner', () => {
      process.env.GH_TOKEN = 'yes';
      expect(() => new Commently({ pr: 1, repo: 'bar' })).toThrow();
    });

    it('should fail without a repo', () => {
      process.env.GH_TOKEN = 'yes';
      expect(() => new Commently({ owner: 'foo', pr: 1 })).toThrow();
    });

    it('should auto authenticate when token present', () => {
      process.env.GH_TOKEN = 'yes';
      // eslint-disable-next-line no-new
      new Commently({ owner: 'foo', repo: 'bar', pr: 1 });
      expect(mockOcto).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: 'token yes'
        })
      );
    });

    it('should NOT auto authenticate when no token present', () => {
      process.env.GH_TOKEN = undefined;
      // eslint-disable-next-line no-new
      new Commently({ owner: 'foo', repo: 'bar', pr: 1 });
      expect(mockOcto).not.toHaveBeenCalledWith(
        expect.objectContaining({
          auth: 'token yes'
        })
      );
    });
  });

  test('getKeyedComment', async () => {
    const commently = new Commently({
      owner: 'foo',
      repo: 'bar',
      pr: 99,
      title: 'test-title'
    });
    const comments = [
      {
        user: {
          id: 'user'
        },
        body: 'non-keyed'
      },
      {
        user: {
          id: 'not-user'
        },
        body: 'non-keyed'
      },
      {
        user: {
          id: 'user'
        },
        body: `${commently.header}\n and  something`
      }
    ];

    // @ts-ignore
    commently.getUser = jest.fn().mockResolvedValue({ id: 'user' });
    // @ts-ignore
    commently.getComments = jest.fn().mockResolvedValue(comments);

    // @ts-ignore
    await expect(commently.getKeyedComment()).resolves.toStrictEqual(
      comments[2]
    );
  });

  test('should not add history when useHistory is set to false', async () => {
    const updateComment = jest.fn();
    mockOcto.mockReturnValueOnce({
      issues: { updateComment }
    });

    const commently = new Commently({
      owner: 'foo',
      repo: 'bar',
      pr: 99,
      title: 'test-title',
      useHistory: false
    });
    const comments = [
      {
        user: {
          id: 'user'
        },
        body: `${commently.header}\n and  something`
      }
    ];

    // @ts-ignore
    commently.getUser = jest.fn().mockResolvedValue({ id: 'user' });
    // @ts-ignore
    commently.getComments = jest.fn().mockResolvedValue(comments);

    await commently.autoComment('another something');

    // @ts-ignore
    expect(updateComment.mock.calls[0][0].body).not.toContain('History');
  });
});
