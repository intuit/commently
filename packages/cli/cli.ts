#!/usr/bin/env node

import * as arg from 'arg';
import Commently from 'commently';
import * as symbols from 'log-symbols';

const args = arg({
  // Types
  '--pr': Number,
  '--message': String,
  '--owner': String,
  '--repo': String,
  '--title': String,
  '--key': String,

  '--help': Boolean,
  '--verbose': Boolean,

  // Aliases
  '-m': '--message',
  '-t': '--title',
  '-h': '--help',
  '-v': '--verbose'
});

if (args['--help']) {
  console.log('commently: Easily comment on PRs');
  console.log(`
    Required

    --message      String     :    The comment to update the PR with

    Optional:

    --pr           Number     :    The pull request/issue to comment on. Detected in CI env
    --owner        String     :    The owner for the project. Detected in CI env
    --repo         String     :    The repo for the project. Detected in CI env
    --title        String     :    The title to your comment with. Defaults to "Commently"
    --key        String     :    The unique key to id your comment with. Defaults to "commently"
    --help, -h     Boolean    :    Show the help dialog
    --verbose, -v  Boolean    :    Output the debug log
  `);
  process.exit(0);
}

if (args['--verbose']) {
  process.env.DEBUG = 'commently';
}

if (!args['--message']) {
  throw new Error('--message is required');
}

const commently = new Commently({
  pr: args['--pr'],
  owner: args['--owner'],
  repo: args['--repo'],
  title: args['--title'],
  key: args['--key']
});

commently
  .autoComment(args['--message'])
  .then(response => {
    console.log(symbols.success, `Successfully commented on ${args['--pr']}`);
    console.log(response.data.html_url);
  })
  .catch(err => {
    console.log(symbols.error, 'Oops! Something went wrong...');
    console.log(err);
  });
