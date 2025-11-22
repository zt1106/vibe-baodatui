import { z } from 'zod';

import { avatarSchema, nicknameSchema, UserId } from './common';

export const UserPayload = z.object({
  id: UserId,
  nickname: nicknameSchema,
  avatar: avatarSchema
});
export type UserPayload = z.infer<typeof UserPayload>;

export const RegisterUserRequest = z.object({
  nickname: nicknameSchema
});
export type RegisterUserRequest = z.infer<typeof RegisterUserRequest>;

export const RegisterUserResponse = z.object({
  user: UserPayload
});
export type RegisterUserResponse = z.infer<typeof RegisterUserResponse>;

export const UpdateAvatarRequest = z.object({
  userId: UserId,
  avatar: avatarSchema
});
export type UpdateAvatarRequest = z.infer<typeof UpdateAvatarRequest>;

export const UpdateAvatarResponse = RegisterUserResponse;
export type UpdateAvatarResponse = z.infer<typeof UpdateAvatarResponse>;

export const UpdateNicknameRequest = z.object({
  userId: UserId,
  nickname: nicknameSchema
});
export type UpdateNicknameRequest = z.infer<typeof UpdateNicknameRequest>;

export const UpdateNicknameResponse = RegisterUserResponse;
export type UpdateNicknameResponse = z.infer<typeof UpdateNicknameResponse>;

export const LoginUserRequest = RegisterUserRequest;
export type LoginUserRequest = z.infer<typeof LoginUserRequest>;

export const LoginUserResponse = RegisterUserResponse;
export type LoginUserResponse = z.infer<typeof LoginUserResponse>;
