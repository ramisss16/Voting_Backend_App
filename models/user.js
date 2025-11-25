const { uniqueId } = require("lodash");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt')


// define user schema
const userSchema = new mongoose.Schema({
    name:{
     type: String,
     require: true
    },

    age:{
        type: Number,
        require: true
    },

    email:{
        type: String,
    
    },

    mobile:{
        type: String
    },

    address:{
        type: String,
        require: true
    },

    aadharCardNumber:{
        type: Number,
        require: true,
        unique: true
    },

    password:{
        type: String,
        require: true
    },

    role:{
        type: String,
        enum: ['voter','admin'],
        default: 'voter'
    },

    isvoted:{
        type: Boolean,
        default: false
    }


});

userSchema.pre('save', async function(next){
    const person = this;

    // Hash the password only if it has been modified (or is new)
    if(!person.isModified('password')) return next();
    try{
        // hash password generation
        const salt = await bcrypt.genSalt(10);

        // hash password
        const hashedPassword = await bcrypt.hash(person.password, salt);
        
        // Override the plain password with the hashed one
        person.password = hashedPassword;
        next();
    }catch(err){
        return next(err);
    }
})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        // Use bcrypt to compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }catch(err){
        throw err;
    }
}


// define user model
const User = mongoose.model('User' , userSchema );
module.exports = User;