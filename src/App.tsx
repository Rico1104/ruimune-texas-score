import { useEffect, useMemo, useState } from "react";
import {
  BottomNav,
  ConfirmDialog,
  Header,
  HistoricalPlayerChips,
  NumericKeypad,
  ParchmentCard,
  PhoneFrame,
  PlayerList,
  PlayerModal,
  RoleStrip,
  RoomInfoCard,
  RuleCard,
  ScoreTable,
  SettlementBoard,
  TavernButton,
  Toast,
  WoodenSign,
  cn,
  formatShortDate,
  playerTotal,
  rankPlayers,
} from "./components/TavernUI";
import { Copy, Plus, RefreshCw, Save, Share2, Sparkles, Users } from "lucide-react";
import type { HistoricalPlayer, Page, Player, Role, Room, SavedResult, SavedResultPlayer } from "./types";

const STORAGE = {
  room: "ruimune_room",
  players: "ruimune_players",
  historicalPlayers: "ruimune_historical_players",
  latestLogs: "ruimune_latest_logs",
  savedResults: "ruimune_saved_results",
};

const nowIso = () => new Date().toISOString();

const defaultRoom: Room = {
  roomId: "2684",
  roomName: "周五德州局",
  adminName: "Rico",
  maxPlayers: 8,
  defaultBuyIn: 1,
  status: "waiting",
  createdAt: nowIso(),
};

const defaultPlayers: Player[] = [
  { id: "1", name: "Rico", isAdmin: true, baseBuyIn: 1, rebuy: 0 },
  { id: "2", name: "阿杰", isAdmin: false, baseBuyIn: 1, rebuy: 0 },
  { id: "3", name: "老K", isAdmin: false, baseBuyIn: 1, rebuy: 0 },
  { id: "4", name: "Momo", isAdmin: false, baseBuyIn: 1, rebuy: 0 },
  { id: "5", name: "小满", isAdmin: false, baseBuyIn: 1, rebuy: 0 },
  { id: "6", name: "七喜", isAdmin: false, baseBuyIn: 1, rebuy: 0 },
];

const defaultHistoricalPlayers: HistoricalPlayer[] = [
  { id: "p1", name: "Rico", lastUsedAt: "", totalGames: 0 },
  { id: "p2", name: "阿杰", lastUsedAt: "", totalGames: 0 },
  { id: "p3", name: "老K", lastUsedAt: "", totalGames: 0 },
  { id: "p4", name: "Momo", lastUsedAt: "", totalGames: 0 },
  { id: "p5", name: "小满", lastUsedAt: "", totalGames: 0 },
  { id: "p6", name: "七喜", lastUsedAt: "", totalGames: 0 },
];

const defaultLatestLogs = ["刚刚：阿杰 +1 补码", "刚刚：Rico +1 补码"];
const lanShareOrigin = "http://192.168.3.150:5174";
const onlineDatabaseUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "https://ruimune-texas-score-default-rtdb.firebaseio.com").replace(/\/$/, "");

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resultPlayersFrom(players: Player[]): SavedResultPlayer[] {
  return rankPlayers(players).map((player, index) => ({
    name: player.name,
    baseBuyIn: player.baseBuyIn,
    rebuy: player.rebuy,
    total: playerTotal(player),
    rank: index + 1,
  }));
}

type SharedRoomPayload = {
  room: Room;
  players: Player[];
  latestLogs: string[];
};

type OnlineRoomPayload = SharedRoomPayload & {
  updatedAt: string;
};

function encodeSharePayload(payload: SharedRoomPayload) {
  return window.btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodeSharePayload(value: string): SharedRoomPayload | null {
  try {
    return JSON.parse(decodeURIComponent(window.atob(value))) as SharedRoomPayload;
  } catch {
    return null;
  }
}

function resetForNewRoom(player: Player, defaultBuyIn: number, adminName: string) {
  return {
    ...player,
    isAdmin: player.name === adminName,
    baseBuyIn: defaultBuyIn,
    rebuy: 0,
  };
}

function roomPath(roomId: string) {
  return `${onlineDatabaseUrl}/rooms/${encodeURIComponent(roomId)}.json`;
}

async function saveOnlineRoom(payload: SharedRoomPayload) {
  if (!onlineDatabaseUrl || !payload.room.roomId) return;
  await fetch(roomPath(payload.room.roomId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, updatedAt: nowIso() } satisfies OnlineRoomPayload),
  });
}

async function loadOnlineRoom(roomId: string) {
  if (!onlineDatabaseUrl) return null;
  const response = await fetch(roomPath(roomId), { method: "GET" });
  if (!response.ok) throw new Error("Failed to load room");
  return (await response.json()) as OnlineRoomPayload | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [currentRole, setCurrentRole] = useState<Role>("admin");
  const [room, setRoom] = useState<Room>(() => readStorage(STORAGE.room, defaultRoom));
  const [players, setPlayers] = useState<Player[]>(() => readStorage(STORAGE.players, defaultPlayers));
  const [historicalPlayers, setHistoricalPlayers] = useState<HistoricalPlayer[]>(() =>
    readStorage(STORAGE.historicalPlayers, defaultHistoricalPlayers)
  );
  const [latestLogs, setLatestLogs] = useState<string[]>(() => readStorage(STORAGE.latestLogs, defaultLatestLogs));
  const [savedResults, setSavedResults] = useState<SavedResult[]>(() => readStorage(STORAGE.savedResults, []));
  const [joinCode, setJoinCode] = useState("");
  const [toast, setToast] = useState("");
  const [playerModal, setPlayerModal] = useState<{ open: boolean; mode: "add" | "edit"; value: string; target?: Player }>({
    open: false,
    mode: "add",
    value: "",
  });
  const [confirmDelete, setConfirmDelete] = useState<Player | null>(null);
  const [pendingRebuy, setPendingRebuy] = useState<{ player: Player; delta: 1 | -1 } | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => localStorage.setItem(STORAGE.room, JSON.stringify(room)), [room]);
  useEffect(() => localStorage.setItem(STORAGE.players, JSON.stringify(players)), [players]);
  useEffect(() => localStorage.setItem(STORAGE.historicalPlayers, JSON.stringify(historicalPlayers)), [historicalPlayers]);
  useEffect(() => localStorage.setItem(STORAGE.latestLogs, JSON.stringify(latestLogs)), [latestLogs]);
  useEffect(() => localStorage.setItem(STORAGE.savedResults, JSON.stringify(savedResults)), [savedResults]);

  useEffect(() => {
    if (currentRole !== "admin" || !onlineDatabaseUrl || !/^\d{4}$/.test(room.roomId)) return;
    const handle = window.setTimeout(() => {
      void saveOnlineRoom({ room, players, latestLogs });
    }, 450);
    return () => window.clearTimeout(handle);
  }, [currentRole, room, players, latestLogs]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const share = url.searchParams.get("share");
    const roomCode = url.searchParams.get("room");
    if (!share && !roomCode) return;

    if (roomCode && /^\d{4}$/.test(roomCode)) {
      setJoinCode(roomCode);
      setCurrentRole("player");
      setCurrentPage("joinRoom");
      showToast(`房号 ${roomCode} 已填好，点击进入房间`);
      url.searchParams.delete("room");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    if (!share) return;
    const payload = decodeSharePayload(share);
    if (!payload?.room?.roomId || !Array.isArray(payload.players)) {
      showToast("分享链接失效，请让房主重新复制邀请链接");
      return;
    }

    setRoom(payload.room);
    setPlayers(payload.players);
    setLatestLogs(payload.latestLogs?.length ? payload.latestLogs : defaultLatestLogs);
    setJoinCode(payload.room.roomId);
    setCurrentRole("player");
    setCurrentPage("joinRoom");
    showToast(`已加载房间 ${payload.room.roomId}，点击进入房间`);

    url.searchParams.delete("share");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const selectedNames = players.map((player) => player.name);
  const settlementPlayers = useMemo(() => resultPlayersFrom(players), [players]);
  const winner = settlementPlayers[0]?.name ?? "暂无";

  const addHistoricalIfMissing = (name: string) => {
    setHistoricalPlayers((prev) =>
      prev.some((player) => player.name === name)
        ? prev
        : [...prev, { id: makeId("p"), name, lastUsedAt: "", totalGames: 0 }]
    );
  };

  const openAddModal = (value = "") => setPlayerModal({ open: true, mode: "add", value });
  const openEditModal = (player: Player) => setPlayerModal({ open: true, mode: "edit", value: player.name, target: player });
  const closePlayerModal = () => setPlayerModal({ open: false, mode: "add", value: "" });

  const beginCreateRoom = () => {
    const adminName = room.adminName.trim() || "Rico";
    setCurrentRole("admin");
    setRoom((prev) => ({ ...prev, adminName, status: "waiting", defaultBuyIn: 1 }));
    setPlayers((prev) => prev.map((player) => resetForNewRoom(player, 1, adminName)));
    setLatestLogs([]);
    setCurrentPage("createRoom");
  };

  const confirmPlayerModal = () => {
    const name = playerModal.value.trim();
    if (!name) {
      showToast(playerModal.mode === "edit" ? "玩家姓名不能为空" : "请输入玩家姓名");
      return;
    }

    if (playerModal.mode === "edit" && playerModal.target) {
      const duplicated = players.some((player) => player.id !== playerModal.target?.id && player.name === name);
      if (duplicated) {
        showToast("本局已有该玩家");
        return;
      }
      setPlayers((prev) => prev.map((player) => (player.id === playerModal.target?.id ? { ...player, name } : player)));
      if (playerModal.target.isAdmin) setRoom((prev) => ({ ...prev, adminName: name }));
      addHistoricalIfMissing(name);
      showToast("玩家姓名已更新");
      closePlayerModal();
      return;
    }

    if (players.some((player) => player.name === name)) {
      showToast("该玩家已在本局");
      return;
    }
    if (players.length >= room.maxPlayers) {
      showToast("已达到玩家上限");
      return;
    }
    setPlayers((prev) => [
      ...prev,
      { id: makeId("player"), name, isAdmin: false, baseBuyIn: room.defaultBuyIn, rebuy: 0 },
    ]);
    addHistoricalIfMissing(name);
    showToast(`${name} 已加入本局`);
    closePlayerModal();
  };

  const removePlayer = (player: Player) => {
    if (player.isAdmin) {
      showToast("不能删除主管理员");
      setConfirmDelete(null);
      return;
    }
    setPlayers((prev) => prev.filter((item) => item.id !== player.id));
    showToast(`${player.name} 已移除`);
    setConfirmDelete(null);
  };

  const transferAdmin = (player: Player) => {
    setPlayers((prev) =>
      prev.map((item) => ({
        ...item,
        isAdmin: item.id === player.id,
      }))
    );
    setRoom((prev) => ({ ...prev, adminName: player.name }));
    addHistoricalIfMissing(player.name);
    showToast(`已转让主管理员给 ${player.name}`);
  };

  const saveAndOpenRoom = () => {
    if (!/^\d{4}$/.test(room.roomId)) {
      showToast("房号必须是 4 位数字");
      return;
    }
    const adminName = room.adminName.trim() || "Rico";
    let nextPlayers = players.map((player) => resetForNewRoom(player, room.defaultBuyIn, adminName));
    if (!nextPlayers.some((player) => player.name === adminName)) {
      if (nextPlayers.length >= room.maxPlayers) {
        showToast("管理员必须在玩家列表里，请先移除一位玩家");
        return;
      }
      nextPlayers = [
        { id: makeId("player"), name: adminName, isAdmin: true, baseBuyIn: room.defaultBuyIn, rebuy: 0 },
        ...nextPlayers.map((player) => ({ ...player, isAdmin: false, baseBuyIn: room.defaultBuyIn, rebuy: 0 })),
      ];
    }
    setPlayers(nextPlayers);
    addHistoricalIfMissing(adminName);
    setRoom((prev) => ({
      ...prev,
      adminName,
      roomName: prev.roomName.trim() || "周五德州局",
      status: "waiting",
      createdAt: nowIso(),
    }));
    setCurrentRole("admin");
    setCurrentPage("roomLobby");
    showToast("房间已开好");
  };

  const startScoring = () => {
    setRoom((prev) => ({ ...prev, status: "playing" }));
    setCurrentRole("admin");
    setCurrentPage("adminScore");
  };

  const changeRebuy = (player: Player, delta: 1 | -1) => {
    if (delta < 0 && player.rebuy <= 0) {
      showToast("补码不能低于 0");
      return;
    }
    setPlayers((prev) => prev.map((item) => (item.id === player.id ? { ...item, rebuy: Math.max(0, item.rebuy + delta) } : item)));
    setLatestLogs((prev) => [`刚刚：${player.name} ${delta > 0 ? "+1" : "-1"} 补码`, ...prev].slice(0, 6));
    setPendingRebuy(null);
  };

  const settleGame = () => {
    setRoom((prev) => ({ ...prev, status: "settled" }));
    setCurrentPage("settlement");
  };

  const saveResult = () => {
    const date = nowIso();
    const resultPlayers = resultPlayersFrom(players);
    const result: SavedResult = {
      id: `game_${Date.now()}`,
      roomId: room.roomId,
      roomName: room.roomName,
      adminName: room.adminName,
      date,
      players: resultPlayers,
      winner: resultPlayers[0]?.name ?? "",
    };
    setSavedResults((prev) => [result, ...prev]);
    setHistoricalPlayers((prev) => {
      const map = new Map(prev.map((player) => [player.name, { ...player }]));
      players.forEach((player) => {
        const existing = map.get(player.name);
        map.set(player.name, {
          id: existing?.id ?? makeId("p"),
          name: player.name,
          lastUsedAt: date,
          totalGames: (existing?.totalGames ?? 0) + 1,
        });
      });
      return Array.from(map.values());
    });
    showToast("结果已保存");
  };

  const newRound = () => {
    setPlayers((prev) => prev.map((player) => ({ ...player, baseBuyIn: room.defaultBuyIn, rebuy: 0 })));
    setRoom((prev) => ({ ...prev, status: "waiting", createdAt: nowIso() }));
    setCurrentRole("admin");
    setCurrentPage("roomLobby");
    showToast("新一局已准备好");
  };

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") {
      const lanUrl = new URL(lanShareOrigin);
      url.protocol = lanUrl.protocol;
      url.hostname = lanUrl.hostname;
      url.port = lanUrl.port;
    }
    url.searchParams.delete("share");
    url.searchParams.set("room", room.roomId);
    return url.toString();
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(`房号：${room.roomId}\n邀请链接：${buildShareUrl()}`);
      showToast("房号和邀请链接已复制");
    } catch {
      showToast(`房号：${room.roomId}`);
    }
  };

  const inviteFriend = async () => {
    const shareText = `睿mune 德州房间 ${room.roomId}：${buildShareUrl()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "睿mune 德州房间", text: shareText, url: buildShareUrl() });
        return;
      } catch {
        // Fall back to copying below.
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(`邀请链接已复制，房号 ${room.roomId}`);
    } catch {
      showToast(`把房号 ${room.roomId} 发给朋友即可加入`);
    }
  };

  const navigate = (page: Page) => {
    if (page === "adminScore" && room.status === "waiting") {
      setCurrentPage("roomLobby");
      return;
    }
    if ((page === "adminScore" || page === "playerView") && room.status === "settled") {
      setCurrentPage("settlement");
      return;
    }
    setCurrentPage(page);
  };

  const joinRoom = async () => {
    if (!/^\d{4}$/.test(joinCode)) {
      showToast("请输入 4 位房号");
      return;
    }

    if (onlineDatabaseUrl) {
      setIsJoining(true);
      try {
        const onlineRoom = await loadOnlineRoom(joinCode);
        if (onlineRoom?.room?.roomId && Array.isArray(onlineRoom.players)) {
          setRoom(onlineRoom.room);
          setPlayers(onlineRoom.players);
          setLatestLogs(onlineRoom.latestLogs ?? []);
          setCurrentRole("player");
          setCurrentPage(onlineRoom.room.status === "settled" ? "settlement" : "playerView");
          showToast("已进入线上房间");
          return;
        }
      } catch {
        showToast("线上房间查询失败，请稍后再试");
        return;
      } finally {
        setIsJoining(false);
      }
    }

    if (joinCode === room.roomId) {
      setCurrentRole("player");
      setCurrentPage(room.status === "settled" ? "settlement" : "playerView");
      showToast("已进入房间");
      return;
    }
    showToast("房间不存在，请确认房号");
  };

  return (
    <PhoneFrame>
      <Header />
      <div className="flex-1 overflow-y-auto px-0 pb-28">
        {currentPage === "home" && (
          <HomePage
            onCreate={beginCreateRoom}
            onJoin={() => setCurrentPage("joinRoom")}
          />
        )}
        {currentPage === "createRoom" && (
          <CreateRoomPage
            room={room}
            players={players}
            historicalPlayers={historicalPlayers}
            onRoomChange={setRoom}
            onAdd={() => openAddModal()}
            onPickHistory={(name) => openAddModal(name)}
            onEdit={openEditModal}
            onDelete={setConfirmDelete}
            onTransferAdmin={transferAdmin}
            onSave={saveAndOpenRoom}
            onBack={() => setCurrentPage("home")}
          />
        )}
        {currentPage === "joinRoom" && (
          <JoinRoomPage value={joinCode} onChange={setJoinCode} onJoin={joinRoom} onClear={() => setJoinCode("")} isJoining={isJoining} />
        )}
        {currentPage === "roomLobby" && (
          <RoomLobbyPage
            room={room}
            players={players}
            role={currentRole}
            onAdd={() => openAddModal()}
            onEdit={openEditModal}
            onDelete={setConfirmDelete}
            onTransferAdmin={transferAdmin}
            onCopy={copyRoomId}
            onInvite={inviteFriend}
            onStart={startScoring}
          />
        )}
        {currentPage === "adminScore" && (
          <AdminScorePage
            room={room}
            players={players}
            onPlus={(player) => setPendingRebuy({ player, delta: 1 })}
            onMinus={(player) => setPendingRebuy({ player, delta: -1 })}
            onEdit={openEditModal}
            onSettle={settleGame}
            onAdd={() => openAddModal()}
          />
        )}
        {currentPage === "playerView" && (
          <PlayerViewPage room={room} players={players} latestLogs={latestLogs} onSettlement={() => setCurrentPage("settlement")} />
        )}
        {currentPage === "settlement" && (
          <SettlementPage
            room={room}
            role={currentRole}
            players={settlementPlayers}
            winner={winner}
            onSave={saveResult}
            onNewRound={newRound}
          />
        )}
        {currentPage === "my" && <MyPage room={room} savedResults={savedResults} historicalPlayers={historicalPlayers} />}
      </div>
      <BottomNav currentPage={currentPage} role={currentRole} roomStatus={room.status} onNavigate={navigate} />
      <Toast message={toast} />
      <PlayerModal
        open={playerModal.open}
        mode={playerModal.mode}
        value={playerModal.value}
        historicalPlayers={historicalPlayers}
        selectedNames={playerModal.mode === "edit" ? players.filter((player) => player.id !== playerModal.target?.id).map((player) => player.name) : selectedNames}
        onValueChange={(value) => setPlayerModal((prev) => ({ ...prev, value }))}
        onPick={(name) => setPlayerModal((prev) => ({ ...prev, value: name }))}
        onCancel={closePlayerModal}
        onConfirm={confirmPlayerModal}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="确认移除该玩家吗？"
        message="本局记分也会移除，已保存过的历史局记录不受影响。"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removePlayer(confirmDelete)}
      />
      <ConfirmDialog
        open={Boolean(pendingRebuy)}
        title={pendingRebuy?.delta === 1 ? "确认 +1 补码？" : "确认 -1 补码？"}
        message={
          pendingRebuy
            ? `${pendingRebuy.player.name} 当前补码 ${pendingRebuy.player.rebuy}，确认${pendingRebuy.delta === 1 ? "增加" : "减少"} 1 个买入吗？`
            : ""
        }
        confirmText={pendingRebuy?.delta === 1 ? "确认 +1" : "确认 -1"}
        compact
        onCancel={() => setPendingRebuy(null)}
        onConfirm={() => pendingRebuy && changeRebuy(pendingRebuy.player, pendingRebuy.delta)}
      />
    </PhoneFrame>
  );
}

function HomePage({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <>
      <WoodenSign title="德州牌局" eyebrow="今晚开牌" />
      <div className="mx-5 mt-2 text-center">
        <p className="text-lg font-black text-brassLight">只做德州 · 专注记分 · 好友开局</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <TavernButton size="lg" onClick={onCreate} icon={<Plus size={21} />}>
            创建房间
          </TavernButton>
          <TavernButton size="lg" variant="secondary" onClick={onJoin} icon={<Users size={21} />}>
            加入房间
          </TavernButton>
        </div>
      </div>
      <ParchmentCard className="mx-5 mt-5">
        <h2 className="section-title">规则摘要</h2>
        <div className="mt-3 grid gap-2 text-sm font-bold text-inkBrown/80">
          <p>起手每人 1 个买入</p>
          <p>每补 1 个买入记 +1</p>
          <p>仅管理员可操作分数</p>
        </div>
      </ParchmentCard>
      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        {["创建4位房号", "房间实时同步", "查看本局结算"].map((item) => (
          <div key={item} className="mini-feature">
            <Sparkles size={18} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CreateRoomPage({
  room,
  players,
  historicalPlayers,
  onRoomChange,
  onAdd,
  onPickHistory,
  onEdit,
  onDelete,
  onTransferAdmin,
  onSave,
  onBack,
}: {
  room: Room;
  players: Player[];
  historicalPlayers: HistoricalPlayer[];
  onRoomChange: (room: Room) => void;
  onAdd: () => void;
  onPickHistory: (name: string) => void;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onTransferAdmin: (player: Player) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const selectedNames = players.map((player) => player.name);
  return (
    <>
      <WoodenSign title="创建房间" />
      <ParchmentCard className="mx-5">
        <div className="grid gap-3">
          <LabeledInput label="房间名称" value={room.roomName} onChange={(value) => onRoomChange({ ...room, roomName: value })} />
          <LabeledInput
            label="4位房号"
            value={room.roomId}
            inputMode="numeric"
            onChange={(value) => onRoomChange({ ...room, roomId: value.replace(/\D/g, "").slice(0, 4) })}
          />
          <LabeledInput label="管理员" value={room.adminName} onChange={(value) => onRoomChange({ ...room, adminName: value })} />
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput
              label="玩家上限"
              type="number"
              value={String(room.maxPlayers)}
              onChange={(value) => onRoomChange({ ...room, maxPlayers: Math.max(2, Number(value) || 8) })}
            />
            <LabeledInput label="默认起手" value={`${room.defaultBuyIn} 个买入`} disabled onChange={() => undefined} />
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-inkBrown/65">仅管理员可操作分数</p>
      </ParchmentCard>
      <ParchmentCard className="mx-5 mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-title">本局玩家</h2>
          <div className="flex gap-2">
            <TavernButton size="sm" onClick={onAdd} icon={<Plus size={15} />}>
              添加
            </TavernButton>
          </div>
        </div>
        <PlayerList players={players} editable onEdit={onEdit} onDelete={onDelete} onTransferAdmin={onTransferAdmin} />
        <p className="mb-2 mt-4 text-xs font-black tracking-[.12em] text-inkBrown/65">从历史玩家选择</p>
        <HistoricalPlayerChips historicalPlayers={historicalPlayers} selectedNames={selectedNames} onPick={onPickHistory} />
      </ParchmentCard>
      <div className="mx-5 mt-4">
        <RuleCard />
      </div>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <TavernButton variant="secondary" onClick={onBack}>
          返回首页
        </TavernButton>
        <TavernButton onClick={onSave} icon={<Save size={18} />}>
          保存并开房
        </TavernButton>
      </div>
    </>
  );
}

function JoinRoomPage({
  value,
  onChange,
  onJoin,
  onClear,
  isJoining,
}: {
  value: string;
  onChange: (value: string) => void;
  onJoin: () => void;
  onClear: () => void;
  isJoining: boolean;
}) {
  return (
    <>
      <WoodenSign title="加入房间" />
      <ParchmentCard className="mx-5">
        <p className="mb-5 text-center text-sm font-black text-inkBrown/75">输入房主提供的 4 位房号</p>
        <NumericKeypad value={value} onChange={onChange} />
      </ParchmentCard>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <TavernButton onClick={onJoin} disabled={isJoining}>
          {isJoining ? "查找中" : "进入房间"}
        </TavernButton>
        <TavernButton variant="secondary" onClick={onClear}>
          清空重输
        </TavernButton>
      </div>
      <p className="mx-7 mt-4 text-center text-sm font-bold leading-6 text-brassLight/85">进入后仅管理员可修改分数，普通玩家仅查看</p>
    </>
  );
}

function RoomLobbyPage({
  room,
  players,
  role,
  onAdd,
  onEdit,
  onDelete,
  onTransferAdmin,
  onCopy,
  onInvite,
  onStart,
}: {
  room: Room;
  players: Player[];
  role: Role;
  onAdd: () => void;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onTransferAdmin: (player: Player) => void;
  onCopy: () => void;
  onInvite: () => void;
  onStart: () => void;
}) {
  const isAdmin = role === "admin";
  return (
    <>
      <WoodenSign title="德州房间" />
      <RoleStrip room={room} role={role} />
      <div className="mx-5">
        <RoomInfoCard room={room} role={role} />
      </div>
      <div className="mx-5 mt-4 rounded-xl border border-brass/55 bg-wood-800/75 px-4 py-3 text-sm font-semibold leading-6 text-brassLight shadow-brass">
        起手每人1个买入；补码每次+1；管理员统一操作分数
      </div>
      <ParchmentCard className="mx-5 mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">玩家列表</h2>
          {isAdmin ? (
            <TavernButton size="sm" onClick={onAdd} icon={<Plus size={15} />}>
              添加玩家
            </TavernButton>
          ) : null}
        </div>
        <PlayerList players={players} editable={isAdmin} onEdit={onEdit} onDelete={onDelete} onTransferAdmin={onTransferAdmin} />
      </ParchmentCard>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <TavernButton variant="secondary" onClick={onInvite} icon={<Share2 size={18} />}>
          邀请好友
        </TavernButton>
        <TavernButton variant="secondary" onClick={onCopy} icon={<Copy size={18} />}>
          复制房号
        </TavernButton>
      </div>
      {isAdmin ? (
        <div className="mx-5 mt-3">
          <TavernButton className="w-full" size="lg" onClick={onStart}>
            开始计分
          </TavernButton>
        </div>
      ) : null}
    </>
  );
}

function AdminScorePage({
  room,
  players,
  onPlus,
  onMinus,
  onEdit,
  onSettle,
  onAdd,
}: {
  room: Room;
  players: Player[];
  onPlus: (player: Player) => void;
  onMinus: (player: Player) => void;
  onEdit: (player: Player) => void;
  onSettle: () => void;
  onAdd: () => void;
}) {
  return (
    <>
      <WoodenSign title="德州记分" />
      <RoleStrip room={room} role="admin" />
      <div className="mx-5">
        <RoomInfoCard room={room} role="admin" />
      </div>
      <ParchmentCard className="mx-5 mt-4 px-2">
        <ScoreTable players={players} mode="admin" onPlus={onPlus} onMinus={onMinus} onEdit={onEdit} />
      </ParchmentCard>
      <p className="mx-7 mt-3 text-sm font-bold text-brassLight/85">变更后实时同步给所有玩家</p>
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <TavernButton size="lg" onClick={onSettle}>
          本局结算
        </TavernButton>
        <TavernButton size="lg" variant="danger" onClick={onAdd} icon={<Plus size={18} />}>
          新增玩家
        </TavernButton>
      </div>
    </>
  );
}

function PlayerViewPage({
  room,
  players,
  latestLogs,
  onSettlement,
}: {
  room: Room;
  players: Player[];
  latestLogs: string[];
  onSettlement: () => void;
}) {
  return (
    <>
      <WoodenSign title="德州记分" />
      <RoleStrip room={room} role="player" />
      <p className="mx-7 text-sm font-bold leading-6 text-brassLight/85">仅主管理员可修改分数，你当前只能查看实时比分</p>
      <div className="mx-5 mt-3">
        <RoomInfoCard room={room} role="player" />
      </div>
      <div className="mx-5 mt-3 w-fit rounded-full border border-emerald-500/70 bg-emerald-950/75 px-3 py-1 text-xs font-black text-emerald-200">
        实时同步中
      </div>
      <ParchmentCard className="mx-5 mt-3 px-2">
        <ScoreTable players={players} mode="player" />
      </ParchmentCard>
      <ParchmentCard className="mx-5 mt-4">
        <h2 className="section-title">最新动态</h2>
        <div className="mt-3 grid gap-2 text-sm font-bold text-inkBrown/75">
          {latestLogs.map((log, index) => (
            <p key={`${log}-${index}`}>{log}</p>
          ))}
        </div>
      </ParchmentCard>
      {room.status === "settled" ? (
        <div className="mx-5 mt-4">
          <TavernButton className="w-full" onClick={onSettlement}>
            查看本局结算
          </TavernButton>
        </div>
      ) : null}
    </>
  );
}

function SettlementPage({
  room,
  role,
  players,
  winner,
  onSave,
  onNewRound,
}: {
  room: Room;
  role: Role;
  players: SavedResultPlayer[];
  winner: string;
  onSave: () => void;
  onNewRound: () => void;
}) {
  return (
    <>
      <WoodenSign title="本局结算" eyebrow="德州 · 当晚累计买入榜" />
      <div className="mx-5">
        <RoomInfoCard room={room} role={role} />
      </div>
      <ParchmentCard className="mx-5 mt-4 px-2">
        <SettlementBoard players={players} />
      </ParchmentCard>
      <div className="mx-5 mt-4 rounded-xl border border-brass bg-tavernGreen/90 px-4 py-4 text-center shadow-brass">
        <p className="text-sm font-bold text-brassLight/75">今晚牌桌冠军</p>
        <p className="mt-1 text-3xl font-black text-brassLight">{winner}</p>
      </div>
      <div className="mx-5 mt-4">
        <RuleCard />
      </div>
      {role === "admin" ? (
        <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
          <TavernButton onClick={onSave} icon={<Save size={18} />}>
            保存结果
          </TavernButton>
          <TavernButton variant="secondary" onClick={onNewRound} icon={<RefreshCw size={18} />}>
            再开一局
          </TavernButton>
        </div>
      ) : null}
    </>
  );
}

function MyPage({
  room,
  savedResults,
  historicalPlayers,
}: {
  room: Room;
  savedResults: SavedResult[];
  historicalPlayers: HistoricalPlayer[];
}) {
  return (
    <>
      <WoodenSign title="我的" />
      <ParchmentCard className="mx-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-inkBrown/60">用户名</p>
            <h2 className="text-3xl font-black text-inkBrown">{room.adminName || "Rico"}</h2>
          </div>
          <div className="rounded-full border-2 border-brass bg-wood-800 px-4 py-3 text-2xl shadow-brass">🍺</div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="已创建房间" value="1" />
          <Stat label="已参与牌局" value={String(Math.max(1, savedResults.length))} />
          <Stat label="最近房号" value={room.roomId} />
        </div>
      </ParchmentCard>
      <ParchmentCard className="mx-5 mt-4">
        <h2 className="section-title">历史记录</h2>
        <div className="mt-3 grid gap-3">
          {savedResults.length === 0 ? (
            <p className="text-sm font-bold text-inkBrown/65">暂无已保存牌局，结算后点“保存结果”就会出现在这里。</p>
          ) : (
            savedResults.map((result) => (
              <div key={result.id} className="history-record">
                <div>
                  <p className="font-black text-inkBrown">{result.roomName}</p>
                  <p className="text-xs font-bold text-inkBrown/65">冠军：{result.winner}</p>
                </div>
                <span className="text-xs font-black text-inkBrown/65">{formatShortDate(result.date)}</span>
              </div>
            ))
          )}
        </div>
      </ParchmentCard>
      <ParchmentCard className="mx-5 mt-4">
        <h2 className="section-title">历史玩家</h2>
        <div className="mt-3 grid gap-2">
          {historicalPlayers.map((player) => (
            <div key={player.id} className="history-record">
              <div>
                <p className="font-black text-inkBrown">{player.name}</p>
                <p className="text-xs font-bold text-inkBrown/65">参与局数：{player.totalGames}</p>
              </div>
              <span className="text-xs font-black text-inkBrown/65">{player.lastUsedAt ? formatShortDate(player.lastUsedAt) : "尚未保存"}</span>
            </div>
          ))}
        </div>
      </ParchmentCard>
    </>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black tracking-[.14em] text-inkBrown/65">{label}</span>
      <input
        className={cn("paper-input", disabled && "opacity-70")}
        value={value}
        type={type}
        inputMode={inputMode}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-inkBrown/20 bg-wood-800/10 px-2 py-3 text-center">
      <p className="text-lg font-black text-inkBrown">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-inkBrown/65">{label}</p>
    </div>
  );
}
