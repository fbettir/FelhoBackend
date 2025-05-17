import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: 'https://muerapp.eu.auth0.com/.well-known/jwks.json'
  }),
  audience: 'https://felholab-api', // ugyanaz, mint a frontend "audience" mezőben
  issuer: 'https://muerapp.eu.auth0.com/',
  algorithms: ['RS256']
});