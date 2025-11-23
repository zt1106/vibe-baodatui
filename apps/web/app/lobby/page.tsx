'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  RegisterUserResponse as RegisterUserResponseSchema,
  TablePrepareResponse as TablePrepareResponseSchema,
  UpdateNicknameResponse as UpdateNicknameResponseSchema
} from '@shared/messages';
import type { GameVariantId, TablePrepareResponse } from '@shared/messages';
import { DEFAULT_VARIANT_ID, listVariantDefinitions, type GameVariantDefinition } from '@shared/variants';

import { AvatarDialog } from '../../components/lobby/AvatarDialog';
import { LobbyFooter } from '../../components/lobby/LobbyFooter';
import { LobbyRoomsPanel } from '../../components/lobby/LobbyRoomsPanel';
import { LobbyTopBar } from '../../components/lobby/LobbyTopBar';
import { NameDialog } from '../../components/lobby/NameDialog';
import { useLobbyAuth } from '../../hooks/useLobbyAuth';
import { useLobbyRooms } from '../../hooks/useLobbyRooms';
import { useHeartbeat } from '../../lib/heartbeat';
import { fetchJson } from '../../lib/api';
import type { AsyncStatus } from '../../lib/types';
import styles from './LobbyPage.module.css';

export default function LobbyPage() {
  const router = useRouter();
  const heartbeat = useHeartbeat();
  const { apiBaseUrl, user, authStatus, authError, updateUser } = useLobbyAuth();
  const { rooms, notifications, status: roomsStatus } = useLobbyRooms(authStatus === 'ready');
  const [roomActionError, setRoomActionError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarSelection, setAvatarSelection] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [avatarUpdateError, setAvatarUpdateError] = useState<string | null>(null);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameDialogError, setNameDialogError] = useState<string | null>(null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<GameVariantId>(DEFAULT_VARIANT_ID);

  const variants = useMemo<GameVariantDefinition[]>(() => listVariantDefinitions(), []);

  const lobbyStatus: AsyncStatus =
    authStatus === 'ready' ? roomsStatus : authStatus === 'error' ? 'error' : 'loading';

  const handleBackHome = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleCreateRoom = useCallback(
    async (variantId?: GameVariantId) => {
      if (isCreatingRoom) {
        return;
      }
      if (!user) {
        setRoomActionError('请先完成登录。');
        return;
      }
      setRoomActionError(null);
      setIsCreatingRoom(true);
      try {
        const chosenVariant =
          variants.find(variant => variant.id === (variantId ?? selectedVariantId)) ?? variants[0];
        const requestedVariantId = chosenVariant?.id ?? DEFAULT_VARIANT_ID;
        const payload = await fetchJson<unknown>(`${apiBaseUrl}/tables`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: {
              userId: user.id,
              nickname: user.nickname,
              avatar: user.avatar
            },
            variantId: requestedVariantId
          })
        });
        const parsed = TablePrepareResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error('Invalid table payload');
        }
        const table: TablePrepareResponse = parsed.data;
        router.push(`/game/${encodeURIComponent(table.tableId)}/prepare`);
      } catch (error) {
        console.error('[web] failed to create room', error);
        setRoomActionError('创建房间失败，请稍后再试。');
      } finally {
        setIsCreatingRoom(false);
      }
    },
    [apiBaseUrl, isCreatingRoom, router, selectedVariantId, user, variants]
  );

  const handleOpenAvatarDialog = useCallback(() => {
    if (!user) return;
    setAvatarSelection(user.avatar);
    setAvatarUpdateError(null);
    setIsAvatarDialogOpen(true);
  }, [user]);

  const handleCloseAvatarDialog = useCallback(() => {
    setAvatarSelection(null);
    setAvatarUpdateError(null);
    setIsAvatarDialogOpen(false);
  }, []);

  const handleConfirmAvatar = useCallback(async () => {
    if (!user || !avatarSelection) {
      return;
    }
    setAvatarUpdateError(null);
    setIsUpdatingAvatar(true);
    try {
      const payload = await fetchJson<unknown>(`${apiBaseUrl}/auth/avatar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, avatar: avatarSelection })
      });
      const parsed = RegisterUserResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid avatar response');
      }
      updateUser(parsed.data.user);
      setIsAvatarDialogOpen(false);
    } catch (error) {
      console.error('[web] failed to update avatar', error);
      setAvatarUpdateError('更换头像失败，请稍后再试。');
    } finally {
      setIsUpdatingAvatar(false);
    }
  }, [apiBaseUrl, avatarSelection, updateUser, user]);

  const handleOpenNameDialog = useCallback(() => {
    if (!user) return;
    setNameDraft(user.nickname);
    setNameDialogError(null);
    setIsNameDialogOpen(true);
  }, [user]);

  const handleCloseNameDialog = useCallback(() => {
    setNameDraft('');
    setNameDialogError(null);
    setIsNameDialogOpen(false);
  }, []);

  const handleConfirmName = useCallback(async () => {
    if (!user) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDialogError('昵称不能为空。');
      return;
    }
    if (trimmed === user.nickname) {
      setNameDialogError('请输入不同的昵称。');
      return;
    }
    setNameDialogError(null);
    setIsUpdatingName(true);
    try {
      const response = await fetch(`${apiBaseUrl}/auth/nickname`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, nickname: trimmed })
      });
      if (!response.ok) {
        if (response.status === 409) {
          setNameDialogError('该昵称已被占用。');
          return;
        }
        throw new Error(`Request failed with status ${response.status}`);
      }
      const payload = await response.json();
      const parsed = UpdateNicknameResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Invalid nickname response');
      }
      updateUser(parsed.data.user);
      setIsNameDialogOpen(false);
    } catch (error) {
      console.error('[web] failed to update nickname', error);
      setNameDialogError('更换昵称失败，请稍后再试。');
    } finally {
      setIsUpdatingName(false);
    }
  }, [apiBaseUrl, nameDraft, updateUser, user]);

  const handleEnterGame = useCallback(
    (roomId: string) => {
      router.push(`/game/${encodeURIComponent(roomId)}/prepare`);
    },
    [router]
  );

  const trimmedName = nameDraft.trim();
  const isNameSubmitDisabled =
    isUpdatingName || !trimmedName || Boolean(user && trimmedName === user.nickname);

  return (
    <main className={styles.page}>
      <LobbyTopBar
        roomsCount={rooms.length}
        notifications={notifications}
        user={user}
        authStatus={authStatus}
        isCreatingRoom={isCreatingRoom}
        error={authError}
        onBackHome={handleBackHome}
        onCreateRoom={handleCreateRoom}
        onOpenAvatarDialog={handleOpenAvatarDialog}
        onOpenNameDialog={handleOpenNameDialog}
        variants={variants}
        selectedVariantId={selectedVariantId}
        onSelectVariant={setSelectedVariantId}
      />

      {roomActionError && <div className={styles.errorBanner}>{roomActionError}</div>}

      <LobbyRoomsPanel rooms={rooms} status={lobbyStatus} onEnterRoom={handleEnterGame} />

      <LobbyFooter status={heartbeat.status} latencyMs={heartbeat.latencyMs} />

      <AvatarDialog
        isOpen={isAvatarDialogOpen}
        selectedAvatar={avatarSelection}
        currentAvatar={user?.avatar}
        isUpdating={isUpdatingAvatar}
        error={avatarUpdateError}
        onClose={handleCloseAvatarDialog}
        onConfirm={handleConfirmAvatar}
        onSelectAvatar={setAvatarSelection}
      />

      <NameDialog
        isOpen={isNameDialogOpen}
        nameDraft={nameDraft}
        isUpdating={isUpdatingName}
        error={nameDialogError}
        isSubmitDisabled={isNameSubmitDisabled}
        onClose={handleCloseNameDialog}
        onConfirm={handleConfirmName}
        onChangeName={setNameDraft}
      />
    </main>
  );
}
