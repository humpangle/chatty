App lauches  and routes to Main screen (we displays Chat screen by default) -
if User was not previously logged in (no auth in storage), we discard all previous screens (i.e Main screen) and route to Signin screen.
            why we discard
            ==============
I discovered that when Sigin screen is layered untop of Main screen, the android emulator consumes a lot of CPU and memory. By discarding the Main screen, I was able to prevent this.

If user was previously logged in
1. we fetch the user and subscribe to new groups created by other users to which the current user was added as group member.
2. We subscribe to the latest messages sent to all groups to which user is part.

Even though groups are displayed in Main -> Chat -> Group screen, we handle the subscription in the Navigation component (parent of all screens) so that when user navigates away from Group screen, Group screen will keep receiving newly created groups and messages.

Group screen
===========
We fetch logged in user

We display a button which when clicked takes user to screen to create new group.

If user has at least a group,
1. we display user's groups and the most recent message sent to each group. When new group created, we append to list of displayed groups.
2. When new message sent to group, we replace currently displayed most recent message for each group.

If no user group, we display message asking user to add a group.
---


Group screen
============
User taps on a group

We navigate to messages screen sending along groupId

messages screen
===============
we fetch group with groupId and display first ten messages sent to that group. If user scrolls, we fetch more messages if they exist.

When user creates message, we prepend message to list of messages.

As soon as group is fetched, we subscribe to new messages sent to the group for the user. When other users send messages to the group, we prepend the message to list of displayed messages (but it will shown at bottom because the list is displayed inverted).

