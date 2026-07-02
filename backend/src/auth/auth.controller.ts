import { Controller, Post, Body, Get, Query, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.findOrCreateGoogleUser(
      (req.user as any).id,
      (req.user as any).email,
    );
    res.redirect(
      `https://world-shop.online/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&provider=google`,
    );
  }

  @Get('yandex')
  @UseGuards(AuthGuard('yandex'))
  @ApiOperation({ summary: 'Yandex OAuth login' })
  async yandexAuth() {}

  @Get('yandex/callback')
  @UseGuards(AuthGuard('yandex'))
  @ApiOperation({ summary: 'Yandex OAuth callback' })
  async yandexCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.findOrCreateYandexUser(
      (req.user as any).id,
      (req.user as any).email,
    );
    res.redirect(
      `https://world-shop.online/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&provider=yandex`,
    );
  }
}