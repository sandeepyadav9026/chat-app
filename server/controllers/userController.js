import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { destroyImage, uploadBase64Image } from "../lib/media.js";


//signup new user
export const signup = async (req, res) => { 
    try {
        const { fullname, email, password, bio } = req.body;
        if(!fullname || !email || !password || !bio){
            return res.json({ success: false, message: "Missing Details"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.json({success: false, message: "User already exists"});
        }
        const salt  = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({fullname, email, password: hashedPassword, bio});
        const token= generateToken(newUser._id)
        const userData = await User.findById(newUser._id).select("-password");

        res.json({success: true, userData, token, message: "Account Created successfully"});

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message});
    }
}

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
        const token = generateToken(userData._id);
        const safeUserData = await User.findById(userData._id).select("-password");
        res.json({ success: true, userData: safeUserData, token, message: "Login successful" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}


//Controller to check if user is authenticated
export const checkAuth =  (req, res) => {
    res.json({success: true, user: req.user});
}



//Controller to update user profile
export const updateProfile = async (req, res) => {
    try {
        const { fullname, fullName, bio, profilePic } = req.body;

        const userId = req.user._id;
        const nextFullName = fullname || fullName;
        const updatePayload = {
            bio,
            fullname: nextFullName,
        };

        if (profilePic) {
            const currentUser = await User.findById(userId);
            const upload = await uploadBase64Image(profilePic, "quickchat/profile");

            updatePayload.profilePic = upload.secureUrl;
            updatePayload.profilePicPublicId = upload.publicId;

            if (currentUser?.profilePicPublicId) {
                await destroyImage(currentUser.profilePicPublicId);
            }
        }

        const updateUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true }).select("-password");
        res.json({success: true, user: updateUser });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message})
    }
}
