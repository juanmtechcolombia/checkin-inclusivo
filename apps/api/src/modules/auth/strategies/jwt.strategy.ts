import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars!!',
    });
  }

  async validate(payload: any) {
    // Return user properties to be attached to request.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      hotelId: payload.hotelId,
      guestId: payload.guestId,
      bookingCode: payload.bookingCode,
    };
  }
}
