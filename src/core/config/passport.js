import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import auth from '../middlewares/authMiddleware';

const facebookOptions = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_APP_CALLBACK_URL,
  profileFields: ['emails', 'name', 'photos']
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: 'No account found with this email address.'
          });
        }

        const user = await auth.findOne({ email });

        if (user) {
          return done(null, user, {
            message: 'An account with this email address already exists.'
          });
        }

        const newUser = await auth.create({
          email,
          name: profile.displayName,
          imageLink: profile.photos?.[0]?.value,
          role: 'user',
          isVerified: true,
          auth: [{ provider: 'google', providerId: profile.id }]
        });

        return done(null, newUser, {
          message: 'User account created successfully.'
        });
      } catch (error) {
        console.log('google strategy error', error);
        return done(error);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    facebookOptions,
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: 'No account found with this email address.'
          });
        }

        const user = await auth.findOne({ email });

        if (user) {
          return done(null, user, {
            message: 'An account with this email address already exists.'
          });
        }

        const newUser = await auth.create({
          email,
          name: profile.displayName,
          imageLink: profile.photos?.[0]?.value,
          role: 'user',
          isVerified: true,
          auth: [{ provider: 'facebook', providerId: profile.id }]
        });

        return done(null, newUser, {
          message: 'User account created successfully.'
        });
      } catch (error) {
        console.log('facebook strategy error', error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await auth.findById(id);
    done(null, user);
  } catch (error) {
    console.log('deserializeUser error', error);
    done(error);
  }
});
