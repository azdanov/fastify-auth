# fastify-auth

Playground for Fastify Auth.

Idea behind this project is to have a basic emulation of registration, login, logout and test endpoints.
On registration a JWT tokens are created for access and refresh. They are stored in cookies, access expires on session end, refresh after 30 days.
User is saved to a DB with a session assigned to this user.

No proper validation or error handling is done.

Modify `hosts` to add Caddy support for https development:
`127.0.0.1:3000 fastify-auth.dev`

Then run `caddy run --config Caddyfile` and `npm run start` to have https enabled dev environment.
