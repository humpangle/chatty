App lauches and displays group screen
We fetch user 21
If user has at least a group, we display user's groups and the most recent message sent to each group

If no user group, we display message asking user to add a group
---

User taps on a group

We navigate to messages screen sending along groupId

On messages screen, we fetch group with groupId and display first ten messages sent to that group. If user scrolls, we fetch more messages if they exist.

As soon as group is fetched, we subscribe to new messages for that user.

