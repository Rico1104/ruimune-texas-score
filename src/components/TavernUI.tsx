import {
  Beer,
  ClipboardList,
  Crown,
  Dice5,
  Edit3,
  Home,
  Lock,
  Plus,
  ScrollText,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import type {
  ChampionBoard,
  HistoricalPlayer,
  Page,
  Player,
  Role,
  Room,
  RoomStatus,
  SavedResultPlayer,
} from "../types";

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const playerTotal = (player: Player) => player.baseBuyIn + player.rebuy;

export const rankPlayers = (players: Player[]) =>
  [...players].sort((a, b) => playerTotal(b) - playerTotal(a) || a.name.localeCompare(b.name, "zh-Hans-CN"));

export const formatGameTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "今晚 20:00";
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${weekdays[date.getDay()]} ${date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

export const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return `${isToday ? "今天" : date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })} ${date.toLocaleTimeString(
    "zh-CN",
    { hour: "2-digit", minute: "2-digit", hour12: false }
  )}`;
};

type PhoneFrameProps = {
  children: React.ReactNode;
};

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-screen bg-[#1c100a] text-brassLight md:flex md:items-center md:justify-center md:p-6">
      <main className="phone-frame relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-wood-900 shadow-2xl md:min-h-[860px] md:rounded-[42px] md:border-[10px] md:border-[#111]">
        <div className="pointer-events-none absolute inset-0 tavern-bg" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_0%,rgba(246,191,91,.32),transparent_62%)]" />
        <div className="relative z-10 flex min-h-screen flex-1 flex-col md:min-h-[840px]">{children}</div>
      </main>
    </div>
  );
}

type HeaderProps = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function Header({ title = "睿mune", subtitle = "周末酒馆局", right }: HeaderProps) {
  return (
    <header className="px-5 pb-2 pt-7 text-center">
      <div className="flex items-start justify-between gap-3">
        <button className="round-badge" type="button" aria-label="邀请好友">
          <Beer size={24} />
          <span>邀好友</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="brand-title">{title}</h1>
          <div className="mx-auto mt-1 w-fit rounded-full border border-brass/70 bg-tavernGreen/85 px-5 py-1 text-sm font-semibold tracking-[.18em] text-brassLight shadow-brass">
            {subtitle}
          </div>
        </div>
        {right ?? (
          <button className="round-badge" type="button" aria-label="规则">
            <ScrollText size={23} />
            <span>规则</span>
          </button>
        )}
      </div>
    </header>
  );
}

export function WoodenSign({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <section className="mx-5 my-3 text-center">
      {eyebrow ? <p className="mb-2 text-sm font-semibold tracking-[.28em] text-brassLight/85">{eyebrow}</p> : null}
      <div className="wooden-sign">
        <span>{title}</span>
      </div>
    </section>
  );
}

export function ParchmentCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("parchment-card", className)}>{children}</section>;
}

type TavernButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
};

export function TavernButton({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  ...props
}: TavernButtonProps) {
  return (
    <button
      className={cn(
        "tavern-button",
        variant === "primary" && "tavern-button-primary",
        variant === "secondary" && "tavern-button-secondary",
        variant === "danger" && "tavern-button-danger",
        variant === "ghost" && "tavern-button-ghost",
        size === "sm" && "px-3 py-2 text-sm",
        size === "md" && "px-4 py-3 text-base",
        size === "lg" && "px-5 py-4 text-xl",
        className
      )}
      {...props}
    >
      {icon ? <span className="inline-flex">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

type BottomNavProps = {
  currentPage: Page;
  role: Role;
  roomStatus: RoomStatus;
  onNavigate: (page: Page) => void;
};

export function BottomNav({ currentPage, role, roomStatus, onNavigate }: BottomNavProps) {
  const scorePage: Page = roomStatus === "settled" ? "settlement" : role === "admin" ? "adminScore" : "playerView";
  const items: Array<{ label: string; page: Page; icon: React.ReactNode; activeOn: Page[] }> = [
    { label: "首页", page: "home", icon: <Home size={22} />, activeOn: ["home"] },
    {
      label: "房间",
      page: role === "admin" ? "roomLobby" : "joinRoom",
      icon: <Users size={22} />,
      activeOn: ["createRoom", "joinRoom", "roomLobby"],
    },
    { label: "记分", page: scorePage, icon: <ClipboardList size={22} />, activeOn: ["adminScore", "playerView", "settlement"] },
    { label: "我的", page: "my", icon: <User size={22} />, activeOn: ["my"] },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = item.activeOn.includes(currentPage);
        return (
          <button key={item.label} className={cn("bottom-nav-item", active && "active")} type="button" onClick={() => onNavigate(item.page)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function PlayerAvatar({ name, isAdmin, rank }: { name: string; isAdmin?: boolean; rank?: number }) {
  const seed = name.charCodeAt(0) || 0;
  const faces = ["♠", "♥", "♣", "♦", "杯", "筹"];
  return (
    <div className="relative flex items-center gap-2">
      {typeof rank === "number" ? <span className={cn("rank-medal", rank <= 3 && "rank-medal-top")}>{rank}</span> : null}
      <span className="player-avatar">
        {faces[seed % faces.length]}
        {isAdmin ? (
          <span className="absolute -right-1 -top-2 rounded-full bg-brass p-0.5 text-wood-900">
            <Crown size={11} fill="currentColor" />
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function RoomInfoCard({ room, role }: { room: Room; role?: Role }) {
  const statusText = room.status === "waiting" ? "等待开局" : room.status === "playing" ? "进行中" : "已结算";
  return (
    <ParchmentCard className="grid grid-cols-3 gap-0 px-0 py-0 text-center">
      <InfoCell label="房间号" value={room.roomId} />
      <InfoCell label="开局时间" value={formatGameTime(room.createdAt)} />
      <InfoCell label="房间状态" value={statusText} dot={room.status === "playing"} />
      <div className="col-span-3 border-t border-inkBrown/20 px-4 py-3 text-sm font-semibold text-inkBrown/80">
        {room.roomName} · 主管理员 {room.adminName}
        {role === "player" ? " · 普通玩家仅查看" : ""}
      </div>
    </ParchmentCard>
  );
}

function InfoCell({ label, value, dot }: { label: string; value: string; dot?: boolean }) {
  return (
    <div className="border-r border-inkBrown/25 px-2 py-4 last:border-r-0">
      <p className="text-xs font-bold tracking-[.18em] text-inkBrown/70">{label}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-lg font-black text-inkBrown">
        {dot ? <span className="h-2 w-2 rounded-full bg-emerald-700" /> : null}
        {value}
      </p>
    </div>
  );
}

export function RuleCard() {
  return (
    <ParchmentCard>
      <h3 className="section-title">记分规则</h3>
      <div className="mt-3 grid gap-2 text-sm font-semibold text-inkBrown/80">
        <p>起手每人 1 个买入</p>
        <p>之后每补 1 个买入，记 +1</p>
        <p>本局总分 = 当晚累计买入数</p>
      </div>
    </ParchmentCard>
  );
}

export function PlayerList({
  players,
  editable,
  onEdit,
  onDelete,
  onTransferAdmin,
}: {
  players: Player[];
  editable?: boolean;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onTransferAdmin?: (player: Player) => void;
}) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="player-row">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar name={player.name} isAdmin={player.isAdmin} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-black text-inkBrown">{player.name}</p>
                {player.isAdmin ? <span className="mini-badge">管理员</span> : null}
              </div>
              <p className="text-xs font-semibold text-inkBrown/65">起手买入 {player.baseBuyIn}</p>
            </div>
          </div>
          {editable ? (
            <div className="flex shrink-0 gap-1">
              {!player.isAdmin ? (
                <button className="icon-button crown" type="button" onClick={() => onTransferAdmin?.(player)} aria-label="转让管理员">
                  <Crown size={16} />
                </button>
              ) : null}
              <button className="icon-button" type="button" onClick={() => onEdit?.(player)} aria-label="编辑姓名">
                <Edit3 size={16} />
              </button>
              <button className="icon-button danger" type="button" onClick={() => onDelete?.(player)} aria-label="删除玩家">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <span className="text-sm font-black text-inkBrown/75">{player.baseBuyIn} 买入</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function ScoreTable({
  players,
  mode,
  onPlus,
  onMinus,
  onEdit,
}: {
  players: Player[];
  mode: "admin" | "player";
  onPlus?: (player: Player) => void;
  onMinus?: (player: Player) => void;
  onEdit?: (player: Player) => void;
}) {
  const ranked = rankPlayers(players);
  return (
    <div className="score-table">
      <div className={cn("score-grid score-head", mode === "player" && "score-grid-player")}>
        <span>{mode === "admin" ? "玩家" : "排名"}</span>
        <span>{mode === "admin" ? "起手" : "玩家"}</span>
        <span>补码</span>
        <span>合计</span>
        <span>操作</span>
      </div>
      {(mode === "admin" ? players : ranked).map((player, index) => (
        <div key={player.id} className={cn("score-grid score-row", mode === "player" && "score-grid-player")}>
          {mode === "admin" ? (
            <div className="score-player-cell">
              <div className="flex items-center justify-center gap-2">
                <PlayerAvatar name={player.name} isAdmin={player.isAdmin} rank={index + 1} />
              </div>
              <button className="score-player-name" type="button" onClick={() => onEdit?.(player)}>
                <span>{player.name}</span>
                <Edit3 size={13} className="shrink-0 opacity-70" />
              </button>
            </div>
          ) : (
            <span className="rank-medal rank-medal-top mx-auto">{index + 1}</span>
          )}
          {mode === "admin" ? <span>{player.baseBuyIn}</span> : <span className="truncate font-black">{player.name}</span>}
          <span>{player.rebuy}</span>
          <span className="chip-total">{playerTotal(player)}</span>
          {mode === "admin" ? (
            <div className="flex justify-center gap-2">
              <button className="score-action plus" type="button" onClick={() => onPlus?.(player)} aria-label={`${player.name} 加一`}>
                +1
              </button>
              <button className="score-action minus" type="button" onClick={() => onMinus?.(player)} aria-label={`${player.name} 减一`}>
                -1
              </button>
            </div>
          ) : (
            <span className="mx-auto flex items-center justify-center gap-1 text-[11px] font-black text-inkBrown/70">
              <Lock size={13} />
              不可操作
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function NumericKeypad({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const press = (key: string) => {
    if (key === "del") onChange(value.slice(0, -1));
    else if (value.length < 4) onChange(`${value}${key}`);
  };
  return (
    <div>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="digit-box">
            {value[index] ?? ""}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button key={num} className="keypad-key" type="button" onClick={() => press(num)}>
            {num}
          </button>
        ))}
        <div />
        <button className="keypad-key" type="button" onClick={() => press("0")}>
          0
        </button>
        <button className="keypad-key" type="button" onClick={() => press("del")}>
          删除
        </button>
      </div>
    </div>
  );
}

export function SettlementBoard({ players }: { players: SavedResultPlayer[] }) {
  return (
    <div className="score-table">
      <div className="settlement-grid score-head">
        <span>排名</span>
        <span>玩家</span>
        <span>起手</span>
        <span>补码</span>
        <span>合计</span>
      </div>
      {players.map((player) => (
        <div key={`${player.rank}-${player.name}`} className="settlement-grid score-row">
          <span className={cn("rank-medal mx-auto", player.rank <= 3 && "rank-medal-top")}>{player.rank}</span>
          <span className="truncate font-black">{player.name}</span>
          <span>{player.baseBuyIn}</span>
          <span>{player.rebuy}</span>
          <span className="chip-total">{player.total}</span>
        </div>
      ))}
    </div>
  );
}

export function ChampionPodium({ board }: { board: ChampionBoard | null }) {
  if (!board) return null;
  const entryByRank = new Map(board.entries.map((entry) => [entry.rank, entry]));
  const displayEntries = ([2, 1, 3] as const).map((rank) => entryByRank.get(rank) ?? null);
  return (
    <section className="champion-board">
      <div className="champion-rays" />
      <div className="champion-board-top">
        <div>
          <p className="text-xs font-black tracking-[.18em] text-brassLight/75">睿mune 荣耀牌匾</p>
          <h3>冠军榜</h3>
        </div>
        <div className="champion-session">
          <span>第 {board.sessionNumber} 场</span>
          <strong>{formatShortDate(board.date)}</strong>
        </div>
      </div>
      <div className="champion-podium">
        {displayEntries.map((entry, index) => {
          const rank = ([2, 1, 3] as const)[index];
          return (
          <div key={rank} className={cn("champion-place", `champion-place-rank-${rank}`, rank === 1 && "champion-place-first", !entry && "champion-place-empty")}>
            <span className="champion-medal">{rank}</span>
            <p className="champion-name">{entry?.name ?? "虚位以待"}</p>
            {entry ? (
              <>
                <strong>{entry.score}</strong>
                <small>分</small>
              </>
            ) : (
              <small>未上榜</small>
            )}
          </div>
          );
        })}
      </div>
      <div className="champion-stage">
        <span>亚军席</span>
        <strong>CHAMPION</strong>
        <span>季军席</span>
      </div>
      <p className="mt-3 text-center text-xs font-black text-brassLight/70">{board.roomName} · {board.roomId}</p>
    </section>
  );
}

export function HistoricalPlayerChips({
  historicalPlayers,
  selectedNames,
  onPick,
}: {
  historicalPlayers: HistoricalPlayer[];
  selectedNames?: string[];
  onPick: (name: string) => void;
}) {
  const selected = new Set(selectedNames ?? []);
  return (
    <div className="flex flex-wrap gap-2">
      {historicalPlayers.map((player) => {
        const disabled = selected.has(player.name);
        return (
          <button
            key={player.id}
            className={cn("history-chip", disabled && "opacity-45 grayscale")}
            type="button"
            disabled={disabled}
            onClick={() => onPick(player.name)}
          >
            {player.name}
          </button>
        );
      })}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

type PlayerModalProps = {
  open: boolean;
  mode: "add" | "edit";
  value: string;
  historicalPlayers: HistoricalPlayer[];
  selectedNames: string[];
  onValueChange: (value: string) => void;
  onPick: (name: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PlayerModal({
  open,
  mode,
  value,
  historicalPlayers,
  selectedNames,
  onValueChange,
  onPick,
  onCancel,
  onConfirm,
}: PlayerModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-black text-brassLight">{mode === "add" ? "新增玩家" : "编辑姓名"}</h3>
          <button className="icon-button dark" type="button" onClick={onCancel} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <input
          className="tavern-input"
          placeholder="输入玩家姓名"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          autoFocus
        />
        <p className="mb-2 mt-4 text-sm font-bold text-brassLight/80">常用玩家快捷选择</p>
        <HistoricalPlayerChips historicalPlayers={historicalPlayers} selectedNames={selectedNames} onPick={onPick} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <TavernButton type="button" variant="secondary" onClick={onCancel}>
            取消
          </TavernButton>
          <TavernButton type="button" onClick={onConfirm}>
            {mode === "add" ? "确认加入" : "确认修改"}
          </TavernButton>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认移除",
  compact,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  compact?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className={cn("modal-backdrop", compact && "modal-backdrop-center")}>
      <div className={cn("modal-panel", compact && "modal-panel-compact")}>
        <div className="mb-3 flex items-center gap-2 text-brassLight">
          <Shield size={compact ? 18 : 22} />
          <h3 className="text-xl font-black">{title}</h3>
        </div>
        <p className="text-sm font-semibold leading-6 text-brassLight/80">{message}</p>
        <div className={cn("grid grid-cols-2 gap-3", compact ? "mt-4" : "mt-6")}>
          <TavernButton type="button" variant="secondary" onClick={onCancel}>
            取消
          </TavernButton>
          <TavernButton type="button" variant="danger" onClick={onConfirm}>
            {confirmText}
          </TavernButton>
        </div>
      </div>
    </div>
  );
}

export function RoleStrip({ room, role }: { room: Room; role: Role }) {
  return (
    <div className="mx-5 mb-3 grid grid-cols-[1fr_auto] items-center gap-2">
      <div className="wood-label">
        <Crown size={18} />
        <span>主管理员</span>
        <strong>{room.adminName}</strong>
      </div>
      <div className="wood-label justify-center">
        {role === "admin" ? <Shield size={18} /> : <Lock size={18} />}
        <span>{role === "admin" ? "仅管理员可操作" : "普通玩家 · 仅查看"}</span>
      </div>
    </div>
  );
}

export const icons = { Plus, Dice5 };
