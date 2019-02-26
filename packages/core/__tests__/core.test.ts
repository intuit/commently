import Commently from '../core';

const mockOcto = jest.fn();
// @ts-ignore
// tslint:disable-next-line
jest.mock('@octokit/rest', () => (...args) => mockOcto(...args));

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
      // tslint:disable-next-line no-unused-expression
      expect(() => new Commently({})).toThrow();
    });

    it('should fail without an owner', () => {
      process.env.GH_TOKEN = 'yes';
      // tslint:disable-next-line no-unused-expression
      expect(() => new Commently({ pr: 1 })).toThrow();
    });

    it('should fail without a repo', () => {
      process.env.GH_TOKEN = 'yes';
      // tslint:disable-next-line no-unused-expression
      expect(() => new Commently({ owner: 'foo', pr: 1 })).toThrow();
    });

    it('should auto authenticate when token present', () => {
      process.env.GH_TOKEN = 'yes';
      // tslint:disable-next-line no-unused-expression
      new Commently({ owner: 'foo', repo: 'bar', pr: 1 });
      expect(mockOcto).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: 'token yes'
        })
      );
    });

    it('should NOT auto authenticate when no token present', () => {
      process.env.GH_TOKEN = undefined;
      // tslint:disable-next-line no-unused-expression
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
});
