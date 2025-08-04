import { PassportStatic } from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { logger } from '../utils/logger';

export const configurePassport = (passport: PassportStatic) => {
  // JWT Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET!,
        algorithms: ['HS256']
      },
      async (payload, done) => {
        try {
          const userRepository = getRepository(User);
          const user = await userRepository.findOne(payload.id);
          
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/oauth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const userRepository = getRepository(User);
            
            // Check if user exists
            let user = await userRepository.findOne({
              where: [
                { email: profile.emails![0].value },
                { providerId: profile.id, provider: 'google' }
              ]
            });

            if (!user) {
              // Create new user
              user = userRepository.create({
                email: profile.emails![0].value,
                name: profile.displayName,
                provider: 'google',
                providerId: profile.id,
                emailVerified: true,
                avatar: profile.photos?.[0]?.value,
                preferences: {
                  theme: 'system',
                  fontSize: 'medium',
                  notifications: {
                    email: true,
                    push: true,
                    reminders: true
                  }
                }
              });
              await userRepository.save(user);
              logger.info(`New Google user created: ${user.email}`);
            }

            return done(null, user);
          } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error as Error, false);
          }
        }
      )
    );
  }

  // Serialize/Deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const userRepository = getRepository(User);
      const user = await userRepository.findOne(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};