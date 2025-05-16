import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = '146243868267-n40i568t8hmufauoj6tc28klp8fr42oh.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

export const verifyGoogleToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Hiányzik a hitelesítési token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  client
    .verifyIdToken({ idToken: token, audience: CLIENT_ID })
    .then((ticket) => {
      const payload = ticket.getPayload();
      if (!payload) {
        res.status(401).json({ message: 'Érvénytelen token.' });
        return;
      }

      (req as any).user = payload;
      next();
    })
    .catch(() => {
      res.status(401).json({ message: 'Tokenellenőrzés sikertelen.' });
    });
};
