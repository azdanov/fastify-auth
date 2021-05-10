# fastify-auth

Playground for Fastify Auth.

Idea behind this project is to have a basic emulation of registration, login, logout and test endpoints.
On registration a JWT tokens are created for access and refresh. They are stored in cookies, access expires on session end, refresh after 30 days.
User is saved to a DB with a session assigned to this user.

No proper validation or error handling is done.
