import { verifyToken } from '../../utility/tokenGenerate.js';
import { jwtSecret } from '../config/config.js';

const auth = (...roles) => {
  return (req, res, next) => {
    try {
      const extractedToken = req.headers.authorization;
      const token = extractedToken?.split(' ')[1];
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      const verifiedUser = verifyToken(token, jwtSecret);
      if (!verifiedUser) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid token' });
      }
      req.user = verifiedUser;

      if (roles.length && !roles.includes(verifiedUser.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'You are not authenticated'
      });
    }
  };
};

export default auth;
