import { api } from './client'
import type { User } from '../types'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; full_name: string; password: string; mobile?: string }
export interface AuthResponse { access_token: string; token_type: string; user: User }
export interface OtpResponse { message: string; demo_otp: string }

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterPayload) => api.post<AuthResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
  sendOtp: (mobile: string) => api.post<OtpResponse>('/auth/otp/send', { mobile }),
  verifyOtp: (mobile: string, otp_code: string) =>
    api.post<AuthResponse>('/auth/otp/verify', { mobile, otp_code }),
}
