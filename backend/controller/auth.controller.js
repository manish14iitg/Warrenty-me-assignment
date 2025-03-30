import { User } from "../models/user.model.js";
import bcryptjs from "bcryptjs"
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import axios from "axios"
import { oauth2Client } from "../utils/googleConfig.js";


export const signup = async (req,res) => {
    const {email,password,name} = req.body; // needs app.use(express.json()) to parse incoming json to javascript object
    try {
        if(!email || !password || !name){
            throw new Error("All fields are required.");
        }
        const userAlrteadyExits = await  User.findOne({email});
        if(userAlrteadyExits){
            return res.status(400).json({success : false, message: "User already Exits."});
        }

        // if this is a new user, store user data in database but first hash the password.
        const hashedPassword = await bcryptjs.hash(password,10);
        const user = new User({
            email,
            name,
            password: hashedPassword,
        })
        await user.save();
        // now we will authenticate this user by setting the cookies.
        generateTokenAndSetCookie(res,user._id);

        res.status(201).json({success:true, message: " User Created Successfully.", 
            user: 
            {...user._doc, password:undefined},});
    } catch (error) {
        res.status(400).json({success: false, message: error.message})
    }
    
}
export const login = async (req,res) => {
    const {email,password} = req.body;
    try {
        const user = await User.findOne({email});
        if(!user){
            res.status(400).json({success:false, message: "Invalid Credentials."});
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if(!isPasswordValid){
            res.status(400).json({success:false, message: "Invalid Credentials."});
        }
        generateTokenAndSetCookie(res,user._id);
        res.status(200).json({success:true, message:"Login Successfully.", user: {
            ...user._doc, password:undefined,
        }})
    } catch (error) {
        console.log("Error in Login : ", error);
        res.status(400).json({success:false, message:error.message})
    }
    
}
export const logout = async (req,res) => {
    res.clearCookie("token");
    res.status(200).json({success: true, message: "Logged out Successfully."});
}

export const checkAuth = async (req,res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if(!user){
            return res.status(400).json({success:false, message:"User not found."})
        }
        res.status(200).json({success:true, user});
    } catch (error) {
        console.log("Error in CheckAuth : ", error);
        res.status(500).json({success:false, message:error.message});
    }
}


/* GET Google Authentication API. */
export const googleAuth = async (req, res, next) => {
    const code = req.query.code;
    console.log("Received code:", code); 

    try {
        // Request access token
        const googleRes = await oauth2Client.getToken(code);
        console.log("Google Token Response:", googleRes);

        const tokenInfo = await oauth2Client.getTokenInfo(googleRes.tokens.access_token);
console.log("Token Scopes:", tokenInfo.scopes);

        // Set credentials
        oauth2Client.setCredentials(googleRes.tokens);

        // Fetch user info
        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        );
        console.log("User Info Response:", userRes.data);

        const { email, name } = userRes.data;

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ name, email });
        }

        const token = generateTokenAndSetCookie(res, user._id);
        res.status(200).json({
            success: true,
            message: "Login Successfully.",
            user: { ...user._doc },
            token,
            googleAccessToken: googleRes.tokens.access_token,
        });

    } catch (err) {
        console.error("Error in Google Auth:", err.response?.data || err.message);
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message
        });
    }
};

export const uploadDocumentToDrive = async (token, content, fileName) => {
    try {
      // Set credentials using the token
      oauth2Client.setCredentials({ access_token: token });
      
      // Create drive client
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      
      // Create file metadata
      const fileMetadata = {
        name: fileName || 'MyDocument.json',
        mimeType: 'application/json',
      };
      
      // Create media
      const media = {
        mimeType: 'application/json',
        body: content
      };
      
      // Upload file
      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink',
      });
      
      return {
        success: true,
        fileId: response.data.id,
        fileUrl: response.data.webViewLink
      };
    } catch (error) {
      console.error("Google Drive upload error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  };