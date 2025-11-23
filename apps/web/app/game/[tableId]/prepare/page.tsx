'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TablePrepareResponse } from '@shared/messages';

import { HostControls } from '../../../../components/prepare/HostControls';
import { ReadyPanel } from '../../../../components/prepare/ReadyPanel';
import { SeatGrid, type PrepareSeat } from '../../../../components/prepare/SeatGrid';
import { StatusBanner } from '../../../../components/prepare/StatusBanner';
import { resetSharedHand } from '../../../../lib/tableSocket';
import { usePrepareRoom } from '../../../../hooks/usePrepareRoom';
import styles from './PreparePage.module.css';

type PreparePageProps = {
  params: { tableId: string };
};

const FALLBACK_MIN_CAPACITY = 2;
const FALLBACK_MAX_CAPACITY = 8;

const PREPARE_PAGE_REFRESH_EVENT = 'prepare-page-refresh';

function seatStatusTone(status: TablePrepareResponse['status']) {
  switch (status) {
    case 'waiting':
      return { label: '等待玩家', background: 'rgba(34, 197, 94, 0.18)', color: '#4ade80' };
    case 'in-progress':
      return { label: '正在准备', background: 'rgba(234, 179, 8, 0.18)', color: '#facc15' };
    case 'full':
      return { label: '房间已满', background: 'rgba(248, 113, 113, 0.18)', color: '#fca5a5' };
    default:
      return { label: '未知状态', background: 'rgba(148, 163, 184, 0.25)', color: '#94a3b8' };
  }
}

export default function PreparePage({ params }: PreparePageProps) {
  const tableId = decodeURIComponent(params.tableId ?? '');
  const router = useRouter();
  const {
    user,
    authStatus,
    authError,
    prepareState,
    prepareStatus,
    prepareError,
    reloadPrepareState,
    sendTableEvent,
    releaseLease,
    setPrepareError
  } = usePrepareRoom(tableId);
  const [configDraft, setConfigDraft] = useState<number | null>(null);
  const navigatedToPlayRef = useRef(false);

  useEffect(() => {
    navigatedToPlayRef.current = false;
  }, [tableId]);

  useEffect(() => {
    if (!prepareState) {
      setConfigDraft(null);
      return;
    }
    setConfigDraft(prepareState.config.capacity);
  }, [prepareState]);

  const handleLeaveRoom = useCallback(() => {
    releaseLease();
    router.push('/lobby');
  }, [releaseLease, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleExternalRefresh = () => {
      reloadPrepareState();
    };
    window.addEventListener(PREPARE_PAGE_REFRESH_EVENT, handleExternalRefresh);
    return () => {
      window.removeEventListener(PREPARE_PAGE_REFRESH_EVENT, handleExternalRefresh);
    };
  }, [reloadPrepareState]);

  useEffect(() => {
    if (!tableId || !prepareState || !user) return;
    if (prepareState.status !== 'in-progress') return;
    const isSeated = prepareState.players.some(player => player.userId === user.id);
    if (!isSeated || navigatedToPlayRef.current) return;
    navigatedToPlayRef.current = true;
    resetSharedHand();
    router.push(`/game/${encodeURIComponent(tableId)}/play`);
  }, [prepareState, router, tableId, user?.id]);

  useEffect(() => {
    if (prepareStatus !== 'error' || prepareError !== '你已被房主移出房间。') {
      return;
    }
    const timer = setTimeout(() => router.push('/lobby'), 1200);
    return () => clearTimeout(timer);
  }, [prepareError, prepareStatus, router]);

  const handleStartGame = useCallback(() => {
    sendTableEvent('table:start', { tableId });
  }, [sendTableEvent, tableId]);

  const handleKickPlayer = useCallback(
    (targetUserId: number) => {
      sendTableEvent('table:kick', { tableId, userId: targetUserId });
    },
    [sendTableEvent, tableId]
  );

  const variantConfig = prepareState?.config.variant ?? null;
  const variantCapacity = variantConfig?.capacity ?? null;
  const capacityLockedValue = variantCapacity?.locked ?? null;
  const capacityMin = capacityLockedValue ?? variantCapacity?.min ?? FALLBACK_MIN_CAPACITY;
  const capacityMax = capacityLockedValue ?? variantCapacity?.max ?? FALLBACK_MAX_CAPACITY;
  const playerCount = prepareState?.players.length ?? 0;
  const capacity = prepareState?.config.capacity ?? capacityMax;
  const resolvedCapacity = capacity || capacityMax;
  const isHost = Boolean(user && prepareState && prepareState.host.userId === user.id);
  const canAdjustCapacity = Boolean(isHost && variantConfig && !capacityLockedValue);

  const handleAdjustCapacity = useCallback(
    (delta: number) => {
      if (!canAdjustCapacity) return;
      setConfigDraft(current => {
        const baseline = current ?? prepareState?.config.capacity ?? capacityMax;
        const next = Math.min(Math.max(baseline + delta, capacityMin), capacityMax);
        return next;
      });
    },
    [capacityMax, capacityMin, canAdjustCapacity, prepareState?.config.capacity]
  );

  const handleSaveConfig = useCallback(() => {
    if (configDraft === null) return;
    if (prepareState?.config.variant.capacity.locked) return;
    sendTableEvent('table:updateConfig', { tableId, capacity: configDraft });
  }, [configDraft, sendTableEvent, tableId]);
  const selfPlayer = useMemo(() => {
    if (!prepareState || !user) return null;
    return prepareState.players.find(player => player.userId === user.id) ?? null;
  }, [prepareState, user?.id]);
  const isSelfSeated = Boolean(selfPlayer);
  const selfPrepared = Boolean(selfPlayer?.prepared);
  const everyonePrepared = prepareState?.players.every(player => player.prepared) ?? false;
  const canHostStart = isHost && playerCount === resolvedCapacity && everyonePrepared;
  const configIsDirty = Boolean(
    isHost &&
      canAdjustCapacity &&
      prepareState &&
      configDraft !== null &&
      configDraft !== prepareState.config.capacity
  );
  const canTogglePrepared = prepareStatus === 'ready' && isSelfSeated;
  const preparedButtonLabel = !isSelfSeated ? '等待入座' : selfPrepared ? '已准备' : '准备';
  const handleTogglePrepared = useCallback(() => {
    if (!isSelfSeated) {
      setPrepareError('请先加入座位。');
      return;
    }
    sendTableEvent('table:setPrepared', { tableId, prepared: !selfPrepared });
  }, [isSelfSeated, selfPrepared, sendTableEvent, tableId]);
  const seats = useMemo<PrepareSeat[]>(() => {
    if (!prepareState) return [];
    const total = prepareState.config.capacity;
    return Array.from({ length: total }, (_, index) => ({
      seatNumber: index + 1,
      player: prepareState.players[index] ?? null
    }));
  }, [prepareState]);

  const statusTone = prepareState ? seatStatusTone(prepareState.status) : null;

  return (
    <main className={styles.page}>
      <StatusBanner
        tableId={tableId}
        tone={statusTone}
        variantName={variantConfig?.name ?? null}
        variantDescription={variantConfig?.description ?? null}
        user={user}
        host={prepareState?.host ?? null}
        authStatus={authStatus}
        authError={authError}
        onLeave={handleLeaveRoom}
      />

      {!tableId && (
        <section className={styles.warning}>无效的房间地址，请返回大厅重新选择。</section>
      )}

      <section className={styles.content}>
        <SeatGrid
          seats={seats}
          playerCount={playerCount}
          capacity={resolvedCapacity || null}
          status={prepareStatus}
          error={prepareError}
          isHost={isHost}
          hostUserId={prepareState?.host.userId ?? null}
          currentUserId={user?.id ?? null}
          onKickPlayer={handleKickPlayer}
        />

        <div className={styles.sidebar}>
          {isHost && (
            <HostControls
              playerCount={playerCount}
              capacity={resolvedCapacity || null}
              canStart={canHostStart}
              canAdjustCapacity={canAdjustCapacity}
              configDraft={configDraft}
              capacityDisplay={resolvedCapacity || null}
              capacityLockedValue={capacityLockedValue}
              configIsDirty={configIsDirty}
              onStart={handleStartGame}
              onAdjustCapacity={handleAdjustCapacity}
              onSaveCapacity={handleSaveConfig}
            />
          )}

          <ReadyPanel
            capacity={resolvedCapacity || null}
            playerCount={playerCount}
            isSelfSeated={isSelfSeated}
            selfPrepared={selfPrepared}
            canTogglePrepared={canTogglePrepared}
            preparedButtonLabel={preparedButtonLabel}
            onTogglePrepared={handleTogglePrepared}
          />

          <section className={styles.placeholder}>
            <h3 className={styles.placeholderTitle}>上一局战报</h3>
            <p className={styles.placeholderText}>战报整理中，敬请期待。</p>
          </section>

          <section className={`${styles.placeholder} ${styles.placeholderTall}`}>
            <h3 className={styles.placeholderTitle}>聊天室</h3>
            <p className={styles.placeholderText}>聊天面板开发中，稍后开放。</p>
          </section>
        </div>
      </section>
    </main>
  );
}
