#!/usr/bin/env node

import * as arg from 'arg';
import {Github, Gitlab} from 'commently';
import * as symbols from 'log-symbols';

const args = arg({
  // Types
  '--pr': Number,
  '--commit': String,
  '--message': String,
  '--owner': String,
  '--repo': String,
  '--title': String,
  '--key': String,
  '--useHistory': Boolean,

  '--help': Boolean,
  '--verbose': Boolean,

  // Aliases
  '-m': '--message',
  '-t': '--title',
  '-h': '--help',
  '-v': '--verbose',
  '-c': '--commit'
});

if (args['--help']) {
  console.log('commently: Easily comment on PRs');
  console.log(`
    Required

    --message, -m  String     :    The comment to update the PR with

    Optional:

    --pr           Number     :    The pull request/issue to comment on. Detected in CI env
    --commit, -c   String     :    The commit comment on for gitlab. Detected in CI env
    --owner        String     :    The owner for the project. Detected in CI env
    --repo         String     :    The repo for the project. Detected in CI env
    --title, -t    String     :    The title to your comment with. Defaults to "Commently"
    --key          String     :    The unique key to id your comment with. Usually the name of the bot. Defaults to "commently"
    --useHistory   Boolean    :    Keep a history of the comments in the comment created by this library
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

interface CommentArguments {
  pr?: number;
  owner?: string;
  repo?: string;
  title?: string;
  key?: string;
  useHistory?: boolean,
  commit?: string;
  message: string;
}

interface CommentResponse {
  data?: {
    html_url?: string; // eslint-disable-line camelcase
  }
}

const addComment = (commentArgs: CommentArguments) => {
  const CorrectCommently = commentArgs.commit ? Gitlab : Github;
  const commently = new CorrectCommently(commentArgs)
  commently
    .autoComment(commentArgs.message)
    .then((response: CommentResponse) => {
      console.log(symbols.success, `Successfully commented on ${commentArgs.pr || commentArgs.commit}`);
      if (response.data && response.data.html_url) {
        console.log(response.data.html_url);
      }
    })
    .catch(err => {
      console.log(symbols.error, 'Oops! Something went wrong...');
      console.log(err);
    });
}

addComment({
  pr: args['--pr'],
  owner: args['--owner'],
  repo: args['--repo'],
  title: args['--title'],
  key: args['--key'],
  useHistory: args['--useHistory'],
  commit: args['--commit'],
  message: args['--message']
})
