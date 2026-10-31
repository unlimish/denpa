/**
 * **canvas に描くプレイヤーが、次の塊を読んでよいか** (`canvas-player.ts` の `room`)。
 *
 * - 手元の尺 (`lead`。デコードして鳴らす番を待っている音の秒) が `ahead` を超えたら待つ
 * - デコードし始める前は手元の尺で測れないので、バイト数 (`earlyBytes`) で区切る
 * - **読むのが速すぎる元 (端末に保存した録画の Blob) は、バイト数でも抑える** (`rate`。平均のバイト/秒)。
 *   手元の尺は worker がデコードして返してから伸びるので、Blob はその前に尻まで読めてしまう —
 *   900MB を一度に worker へ流し込み、返ってくる音の知らせで画面が詰まって描き直せず (音はブツ切れ)、
 *   抱えきれない映像で読み直しを繰り返していた。観ている位置より `ahead` 秒ぶん (の 1.5 倍) 先までにする
 * - **ただし手元が `low` 秒を切ったら、上限を超えていても読む。** 平均より重い場面が続くと上限に先に当たり、
 *   読むのを止めたまま手元を使い切ると時計も止まって、上限が二度と外れず止まったまま戻らなかった
 *   (平均の2倍の場面へ飛ぶと 90 秒ほどで当たる)
 */
export interface ReadState {
  /** 手元の尺 (秒) */
  lead: number;
  /** リクエストし直してから渡したバイト数 */
  fed: number;
  /** リクエストし直した位置から観た長さ (秒) */
  played: number;
  /** 読み込み元の平均の速さ (バイト/秒)。速すぎる元だけ */
  rate: number | undefined;
}

export interface ReadLimits {
  /** 先へ読む上限 (秒) */
  ahead: number;
  /** デコードし始める前に渡しておく上限 (バイト) */
  earlyBytes: number;
  /** `rate` で抑えるときも、ここまでは読む (バイト。頭と最初のキーフレームが入る量) */
  floorBytes: number;
  /** 手元がこれ (秒) を切ったら、`rate` の上限を超えていても読む */
  low: number;
}

export function mayRead(state: ReadState, limits: ReadLimits): boolean {
  const { lead, fed, played, rate } = state;
  if (lead >= limits.ahead) return false;
  if (rate === undefined) return lead > 0 || fed < limits.earlyBytes;
  // デコードし始める前の区切りも、この上限が受け持つ
  const cap = Math.max(limits.floorBytes, (played + limits.ahead) * rate * 1.5);
  return lead < limits.low || fed <= cap;
}
