import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res,userId) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn:"7d"
    })

    res.cookie("token", token, {
        httpOnly: true, // not accesible by client side js
        secure: process.env.NODE_ENV === "production", // while development it is http and in production it is https, that s means secure.
        sameSite: "strict", // prevents csrf attack.
        maxAge: 7 * 24 * 60 * 60 * 1000,

    })
    return token;
}