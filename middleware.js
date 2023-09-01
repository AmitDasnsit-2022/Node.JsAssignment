const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const verifyToken = (req, res, next) => {                //Middleware method to verify token
    const token = req.header('Authorization').split(' ')[1];
      if (!token) return res.status(403).json({ message: 'Token not provided' });
    //   console.log('Token', token);
    //   console.log('KEy',jwtSecret);
      jwt.verify(token, jwtSecret, (err, decoded) => {
        // console.error('>>>Errror',err); 
        if (err) return res.status(401).json({ message: 'Amit token' });
        req.userId = decoded.userId;                         // Change req.user to req.userId
        next();
      });
    };
    module.exports = {
        verifyToken,
      };