import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

export interface AuthTokens {
  accessToken: string;
  user: { id: string; email: string; username: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    username: string,
    password: string,
  ): Promise<AuthTokens> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({ email, username, passwordHash });

    return this.signTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return this.signTokens(user);
  }

  private signTokens(user: any): AuthTokens {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}
