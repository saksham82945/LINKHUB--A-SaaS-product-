import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // 1. Check email uniqueness
    const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailExists) throw new ConflictException('Email already registered');

    // 2. Check username uniqueness
    const usernameExists = await this.prisma.profile.findUnique({ where: { username: dto.username } });
    if (usernameExists) throw new ConflictException('Username already taken');

    // 3. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 4. Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // 5. Create user + profile in one transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          verifyToken,
          isVerified: true, // Auto-verify for easier local testing
        },
      });

      await tx.profile.create({
        data: {
          username: dto.username,
          displayName: dto.name,
          ownerUserId: newUser.id,
        },
      });

      return newUser;
    });

    // 6. Send verification email (non-blocking)
    this.sendVerificationEmail(user.email, user.name, verifyToken).catch(console.error);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  // ─────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // 1. Find user
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    // 2. Check password
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Invalid email or password');

    // 3. Check email verification
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // 4. Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user.id, user.email, user.role);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
      },
    };
  }

  // ─────────────────────────────────────────────────────
  // VERIFY EMAIL
  // ─────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) throw new BadRequestException('Invalid or expired verification link');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    });

    return { message: 'Email verified successfully! You can now log in.' };
  }

  // ─────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always return success (don't reveal if email exists — security)
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    this.sendResetEmail(user.email, user.name, resetToken).catch(console.error);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ─────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExp: { gt: new Date() }, // Not expired
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset link');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    });

    return { message: 'Password reset successful. You can now log in.' };
  }

  // ─────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ─────────────────────────────────────────────────────
  // GET CURRENT USER
  // ─────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        planExpiresAt: true,
        role: true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            theme: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async sendVerificationEmail(email: string, name: string, token: string) {
    // TODO: Integrate Resend SDK here
    const verifyUrl = `${this.config.get('CLIENT_URL')}/verify-email?token=${token}`;
    console.log(`[Email] Verification link for ${email}: ${verifyUrl}`);
  }

  private async sendResetEmail(email: string, name: string, token: string) {
    // TODO: Integrate Resend SDK here
    const resetUrl = `${this.config.get('CLIENT_URL')}/reset-password?token=${token}`;
    console.log(`[Email] Reset link for ${email}: ${resetUrl}`);
  }
}
