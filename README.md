# to-slack-chrome-ext

A simple Firefox extension for sending 'stuff' to HTTP endpoints. For example,
a Slack channel (via its WebHook).

Once installed, open the extension options and configure a target or three.

```
{
    "example.com": {
        "contexts": ["media"],
        "url": "https://example.com/jasmine"
    },
    "@jasmine": "https://hooks.slack.com/services/T123.../BD456..../a-neat-secret"
}
```

If you list a single target, it will be on the context menu directly. Multiple
available targets will be grouped together in a single submenu.
