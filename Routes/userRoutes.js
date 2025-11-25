const express = require("express");
const router = express.Router();
const User = require('./../models/user');
const { jwtAuthMiddleware, generateToken } = require('../jwt')

// post route to add person
router.post('/signup', async (req, res) => {
    try {

        const data = req.body // Assuming the req. body contain the user data

        // check if there is already an admin user   -> ye isliye only one admin can signup
        const adminUser = await User.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {                                     //   🎯 Why both conditions needed together?
                                                                                        //👉 Condition 1: naya user admin ban raha hai
            return res.status(400).json({ error: 'admin user already exists' })
        }                                                                             //👉 Condition 2: admin already database me existing hai
                                                                                           //  To stop creating second admin account.  

      
      // check Adhar card number must have exactly 12 digit
     if (!/^\d{12}$/.test(data.aadharCardNumber)) {
        return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
     }

     //check if a user with the same Aadhar card number id already exists
     const existingUser = await User.findOne({aadharCardNumber: data.aadharCardNumber});
     if(existingUser){
        return res.status(400).json({error: 'user with same aadhar card number already exists'})
     }

     // create a new user documnet using the mongoose model
     const newUser = new User(data);

     // save the new user to the database
     const response = await newUser.save();
     console.log('data saved')

     const payload = {
        id: response.id
     }
     console.log(JSON.stringify(payload));

     const token = generateToken(payload);

     res.status(200).json({response: response, token: token})
     
    } catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'})
   }
})

// login route
router.post('/login' , async(req, res ) => {
    try{
      
        // extract AadharCardNumber and Password from req body
        const{aadharCardNumber, password} = req.body;

        // check if aadharCardNumber and password is missing
        if(!aadharCardNumber || !password){
            return res.status(400).json({error: 'Aadhar Card Number and password are require'});
        }

        // find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        // if user does not exixts and password does not match , return error
        if(!user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid Aadhar Card Number or password'})
        }

        // gererate token
        const payload = {
            id: user.id,
        }
        const token = generateToken(payload);

        // return token as response
        res.json({token})
    }catch(err){
           console.log(err);
        res.status(500).json({error: 'Internal Server Error'})
    }
})

// profile route
router.get('/profile' , jwtAuthMiddleware, async(req, res) =>{
    try{
     const userData = req.user;
     const userId = userData.id;
     const user = await User.findById(userId)
     res.status(200).json({user});

    }catch(err){
      console.log(err);
        res.status(500).json({error: 'Internal Server Error'})
    }
})

// update password
router.put('/profile/password', jwtAuthMiddleware, async(req, res) =>{
    try{
       const userId = req.user.id // extract the id from the token
       const {currentPassword, newPassword} = req.body; // extract current and new password from req. body

       // check if current password and newpassword are present in the req. body
       if(!currentPassword || !newPassword){
        return res.status(400).json({error: 'both currentPassword and newPassword are required'});
       }

       // find the user by userid
       const user = await User.findById(userId);

       // if user does not exists and password does not matck, return error
       if(!user || !(await user.comparePassword(currentPassword))){
        return res.status(401).json({error: 'Invalid currentPassword'});

        // update the user password
          user.password = newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({message: 'password updated'})
        
       }
    }catch(err){
           console.log(err);
        res.status(500).json({error: 'Internal Server Error'})
    }

})

module.exports = router;