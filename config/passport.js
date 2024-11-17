import LS from 'passport-local';
import bcrypt from 'bcryptjs';
import User from '../models/Users.js';

const LocalStrategy = LS.Strategy;

const initializePassport = (passport) => {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Check if user with given email exists
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: 'Email is not registered' });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Password is incorrect' });
        }
      } catch (error) {
        console.error('Error during authentication:', error);
        return done(error, false);
      }
    })
  );

  // Serialize user to store in session (save user ID in session)
  passport.serializeUser((user, done) => {
    done(null, user.id); // Storing the user ID in the session
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (user) {
        done(null, user);
      } else {
        done(null, false); // If no user is found for the stored ID
      }
    } catch (error) {
      console.error('Error during deserialization:', error);
      done(error, false); // Ensure to return false if an error occurs during deserialization
    }
  });
};

export default initializePassport;
