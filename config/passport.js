import LS from "passport-local";
import bcrypt from "bcryptjs";
import User from "../models/Users.js";

const LocalStrategy = LS.Strategy;

const initializePassport = (passport) => {
  // Define LocalStrategy for passport
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      try {
        // Check if user with given email exists
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Email is not registered" });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Password is incorrect" });
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error);
      }
    })
  );

  // Serialize user to store in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || false);
    } catch (error) {
      console.error("Error during deserialization:", error);
      done(error);
    }
  });
};

export default initializePassport;
