import type express from 'express';
import {
  LoginUserRequest,
  LoginUserResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  UpdateAvatarRequest,
  UpdateNicknameRequest
} from '@shared/messages';
import type {
  createUserRegistry
} from '../../infrastructure/userRegistry';
import {
  DuplicateNicknameError,
  UserNotFoundError
} from '../../infrastructure/userRegistry';

type Users = ReturnType<typeof createUserRegistry>;

export function registerAuthRoutes(app: express.Express, users: Users) {
  app.post('/auth/register', (req, res) => {
    const parsed = RegisterUserRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    try {
      const user = users.register(parsed.data.nickname);
      res.status(201).json(RegisterUserResponse.parse({ user }));
    } catch (error) {
      if (error instanceof DuplicateNicknameError) {
        res.status(409).json({ error: 'Nickname already registered' });
        return;
      }
      console.error('[server] failed to register user', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.post('/auth/login', (req, res) => {
    const parsed = LoginUserRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    try {
      const user = users.login(parsed.data.nickname);
      res.json(LoginUserResponse.parse({ user }));
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ error: 'Nickname not found' });
        return;
      }
      console.error('[server] failed to login user', error);
      res.status(500).json({ error: 'Failed to login user' });
    }
  });

  app.patch('/auth/avatar', (req, res) => {
    const parsed = UpdateAvatarRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    const user = users.updateAvatar(parsed.data.userId, parsed.data.avatar);
    if (!user) {
      res.status(404).json({ error: 'Unknown user' });
      return;
    }
    res.json(RegisterUserResponse.parse({ user }));
  });

  app.patch('/auth/nickname', (req, res) => {
    const parsed = UpdateNicknameRequest.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    try {
      const user = users.updateNickname(parsed.data.userId, parsed.data.nickname);
      if (!user) {
        res.status(404).json({ error: 'Unknown user' });
        return;
      }
      res.json(RegisterUserResponse.parse({ user }));
    } catch (error) {
      if (error instanceof DuplicateNicknameError) {
        res.status(409).json({ error: 'Nickname already registered' });
        return;
      }
      console.error('[server] failed to update nickname', error);
      res.status(500).json({ error: 'Failed to update nickname' });
    }
  });
}
