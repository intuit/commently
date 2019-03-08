# commently-core

Commently Core is the underlying API package wrapped by the CLI

## Usage

To use, you can simply import it into your project like so. Remember that you will still need to provide a `GITHUB_TOKEN` or `GH_TOKEN`, as well as a `GITHUB_URL` (default to public github) in your environment to be able to comment.

```javascript
import Commently from 'commently/core';

const commently = new Commently({
  pr: '1234',
  owner: 'GithubOrg',
  repo: 'RepoName',
  title: 'The Title of Your PR Comment',
  key: 'unique-id'
});

commently
  .autoComment('The body of your PR')
  .then(response => {
    console.log(symbols.success, `Successfully commented on ...}`);
    console.log(response.data.html_url);
  })
  .catch(err => {
    console.log(symbols.error, 'Oops! Something went wrong...');
    console.log(err);
  });
```
