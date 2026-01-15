import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register new tenant and admin user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)  // ✅ Contract: Login returns 200 OK (not 201)
  @ApiOperation({ summary: 'Login with brute force protection' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, request);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)  // ✅ Contract: Refresh returns 200 OK (not 201)
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  refresh(@Body() body: { refreshToken: string }, @Req() request: Request) {
    return this.authService.refreshToken(body.refreshToken, request);
  }
}
