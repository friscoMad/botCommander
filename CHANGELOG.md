#Changelog

## 1.1.1 

 * The bot.send returns back the same value that the send functions returns.

## 1.1.0 

 * Added new inherited setting to check commands always in lowercase, this does not affect arguments or options.
 * Bug: Reverted some changes to avoid 'falsy' checks that could lead to bugs in some cases.
 * Bug: Parent options will no longer be lost in child commands, they should be set. Still parent options are not shown in child help.
 * Testing: Increased the number of test in some areas.