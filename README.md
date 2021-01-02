# to-slack-chrome-ext

A simple chrome extension for sending 'stuff' to HTTP endpoints. For example,
a Slack channel (via its WebHook).

Once installed, open the extension options and configure a target or three.

```
{
    "example.com": {
        "contexts": ["media"],
        "url": "https://example.com/jasmine"
    },
    "@jasmine": "https://hooks.slack.com/services/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"
}
```

If you list a single target, it will be on the context menu directly. Multiple
available targets will be grouped together in a single submenu.
