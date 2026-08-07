const jwt = require('jsonwebtoken');

async function authUser(req, res, next){
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({message:"Unauthorized"});
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        console.log("JWT Verification Middleware Exception Log: ", err.message);
        return res.status(401).json({message:"Unauthorized"});
    }
}
module.exports = { authUser }