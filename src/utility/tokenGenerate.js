import jwt from 'jsonwebtoken';

const createToken = (payload, secret, expiresIn) => {
  const options = {
    algorithm: 'HS256',
    expiresIn: expiresIn
  };

  const token = jwt.sign(payload, secret, options);
  return token;
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

export { createToken };
