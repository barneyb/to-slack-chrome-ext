# to-slack-chrome-ext

A simple chrome extension for sending 'stuff' to Slack channel(s), via WebHooks.

Once installed, hit the options pane and enter your config packet. Something like this:

```
{
  "#general": "https://hooks.slack.com/services/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",
  "@jasmine": "https://hooks.slack.com/services/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"
}
```

If you list a single hook, it will be on the context menu directly. Multiple hooks will be grouped together in a single submenu.
