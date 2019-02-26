# commently-cli

## Usage

You can use `commently` locally or in a CI environent. When using it locally it is required to provide the pr, owner, repo, and message flags.

```sh
GH_TOKEN=YOUR_TOKEN commently --pr 510 --owner Fuego --repo Vulcan --message "Test this"
```

When used in the CI it will detect the pr, owner and repo so you only have to provide a message.

```sh
GH_TOKEN=YOUR_TOKEN commently --message "Test this"
```
