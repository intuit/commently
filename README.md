# commently - Comment easily 😀💬

[![npm](https://img.shields.io/npm/v/commently.svg)](https://www.npmjs.com/package/commently)
[![CircleCI](https://circleci.com/gh/intuit/commently/tree/master.svg?style=shield)](https://circleci.com/gh/intuit/commently/tree/master)
[![CLI Package Known Vulnerabilities](https://snyk.io/test/github/intuit/commently/badge.svg?targetFile=packages%2Fcli%2Fpackage.json)](https://snyk.io/test/github/intuit/commently?targetFile=packages%2Fcli%2Fpackage.json)
[![Core Package Known Vulnerabilities](https://snyk.io/test/github/intuit/commently/badge.svg?targetFile=packages%2Fcore%2Fpackage.json)](https://snyk.io/test/github/intuit/commently?targetFile=packages%2Fcore%2Fpackage.json)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)

## Installation

```
yarn add commently-cli --dev
```

Alternatively, you can run via `npx`

```
npx commently-cli
```

## Usage

```
yarn commently

commently: Easily comment on PRs

    Required

    --message      String     :    The comment to update the PR with

    Optional:

    --pr           Number     :    The pull request/issue to comment on. Detected in CI env
    --owner        String     :    The owner for the project. Detected in CI env
    --repo         String     :    The repo for the project. Detected in CI env
    --title        String     :    The title of your comment. Defaults to "Commently"
    --key.         String     :    The unique key for your comment. Defaults to "commently"
    --help, -h     Boolean    :    Show the help dialog
    --verbose, -v  Boolean    :    Output the debug log
```

## Development Setup

To get started developing `commently` run the following commands from the root directory.

```sh
yarn
yarn build:watch
```

## Dev Usage

```sh
yarn build
GH_TOKEN=YOUR_TOKEN ./packages/cli/dist/cli.js -v --pr 510 --owner intuit --repo commently --message "Test this"
```

This will build both of the projects.

### clean

Remove all dependencies and build versions.

```sh
yarn clean
```

## License

`commently` is provided under the MIT license.
