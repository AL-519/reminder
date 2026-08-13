const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 *1000
};

const signToken = (user) => {
    return jwt.sign({
        id: user._id,
        role: user.role
    }, process.env.JWT_SECRET,
    { expiresIn: '7d'});
};

async function register(req, res, next){
    try{
    const { name, email, phoneNumber=null, password } = req.body;

    if(!email || !password || !name){
        return res.status(400).json({
            success: false,
            message:"Required fields missing"});
    }

    const queryConditions = [{email}];
    if(phoneNumber){
        queryConditions.push({phoneNumber});
    }

    const isUserExists = await User.findOne({$or: queryConditions});
    
    if(isUserExists){
        return res.status(409).json({
            success: false,
            message:"User already exists"});
    }

    const user = await User.create({
        name,
        email,
        phoneNumber: phoneNumber || null,
        password,
        role: 'user'
    });

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
        success: true,
        message:'Registered Successfully',
        data:{
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
    }
    catch(err){
        next(err);
    }
}

async function login(req, res, next){
    try{
    const { email, phoneNumber, password} = req.body;
    if((!email && !phoneNumber) || !password){
        return res.status(400).json({success: false, message:"Required credentials missing"});
    }

    const queryCondition = email ? {email} : {phoneNumber};
    const user = await User.findOne(queryCondition);
    if(!user || !(await user.comparePassword(password))){
        return res.status(401).json({success: false, message:"Invalid Credentials"});
    } 
    
    const isPasswordValid = await user.comparePassword(password);
    if(!isPasswordValid){
        return res.status(401).json({success: false, message: "Invalid Credentials"});
    }

    const token = signToken(user);
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
        success: true,
        message: "User loggedin successfully",
        data:{
            user:{
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
}
    catch(err){
        next(err);
    }
}

async function logout(req, res, next){
    try{
    res.clearCookie("token", {
        httpOnly : true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({
        success: true,
        message:"User logged out successfully"
    });
    }
    catch(err){
        next(err);
    }
}

module.exports = {register, login, logout}