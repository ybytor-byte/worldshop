import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class YandexStrategy extends PassportStrategy(GoogleStrategy, 'yandex') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('YANDEX_CLIENT_ID') || '',
      clientSecret: configService.get<string>('YANDEX_CLIENT_SECRET') || '',
      callbackURL: 'https://worldshopbackend-production.up.railway.app/auth/yandex/callback',
      scope: ['login:email', 'login:info'],
      authorizationURL: 'https://oauth.yandex.ru/authorize',
      tokenURL: 'https://oauth.yandex.ru/token',
    });
  }

  userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void {
    fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        done(null, {
          id: data.id,
          emails: [{ value: data.default_email }],
          displayName: data.display_name,
          provider: 'yandex',
        });
      })
      .catch((err) => done(err));
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = {
      id: profile.id,
      email: profile.emails?.[0]?.value || `yandex-${profile.id}@worldshop.ru`,
    };
    done(null, user);
  }
}