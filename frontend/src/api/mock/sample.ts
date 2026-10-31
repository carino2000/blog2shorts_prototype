// mock 샘플 데이터 (frontend/CLAUDE.md 7장): 블록 10개(문단 7, 이미지 3), analysis, 장면 5개
// 글 내용은 이 프로젝트용으로 지어낸 것이다. 이미지는 public/mock/의 코드로 만든 SVG.
import { splitSubtitleChunks } from '../../lib/render'
import type { Asset, Block, Motion, Project, Scene, Subtitle } from '../types'
import { CHARS_PER_SEC, countChars } from '../../lib/duration'

export const SAMPLE_TITLE = '제주 동쪽 해안 길, 반나절 걸어본 기록'

export const SAMPLE_ASSETS: Asset[] = [
  { id: 'a1', origin: 'blog', url: '/mock/a1.svg', width: 1200, height: 800 },
  { id: 'a2', origin: 'blog', url: '/mock/a2.svg', width: 800, height: 1200 },
  { id: 'a3', origin: 'blog', url: '/mock/a3.svg', width: 1000, height: 1000 },
]

export const SAMPLE_BLOCKS: Block[] = [
  p('b1', '지난 주말에 성산에서 출발해 종달리까지 해안 길을 걸었습니다. 천천히 걸어서 3시간 정도 걸렸고, 중간에 카페 두 곳에 들렀어요.'),
  img('b2', 'a1', '성산 일출봉이 보이는 출발 지점', ['b1', 'b3']),
  p('b3', '출발은 오전 9시. 아침에는 바람이 강하지 않아서 걷기 좋았습니다. 바다 쪽으로 난 길이라 그늘은 거의 없으니 모자는 꼭 챙기세요.'),
  p('b4', '길 중간에 있는 작은 포구에서는 해녀분들이 물질을 마치고 나오는 모습을 볼 수 있었어요.'),
  img('b5', 'a2', '포구 옆 돌담길', ['b4', 'b6']),
  p('b6', '점심은 종달리 마을 안쪽 국숫집에서 먹었습니다. 고기국수 한 그릇에 9천 원이었고, 양이 넉넉했어요.'),
  p('b7', '오후에는 해가 강해져서 그늘이 있는 마을 길로 돌아갔습니다. 해안 길만 고집할 필요는 없어요.'),
  img('b8', 'a3', '종달리 마을 골목', ['b7', 'b9']),
  p('b9', '걷는 내내 길 안내 표지가 잘 되어 있어서 지도 없이도 헤매지 않았습니다.'),
  p('b10', '다음에는 해 질 무렵에 반대 방향으로 걸어볼 생각입니다. 자세한 경로와 카페 정보는 본문에 정리해 두었어요.'),
]

export const SAMPLE_ANALYSIS: NonNullable<Project['analysis']> = {
  summary:
    '성산에서 종달리까지 제주 동쪽 해안 길을 3시간 동안 걸은 기록이다. 오전 출발, 그늘 대비, 점심 장소와 오후 경로 조정 요령을 정리했다.',
  keyPoints: [
    '성산에서 종달리까지 천천히 걸어 3시간 정도 걸린다.',
    '해안 쪽은 그늘이 거의 없어 모자가 필요하고, 오후에는 마을 길로 돌아가면 편하다.',
    '길 안내 표지가 잘 되어 있어 지도 없이도 걸을 수 있다.',
  ],
}

type SceneSeed = { role: Scene['role']; text: string; assetId: string; motion: Motion; sourceBlockIds: string[] }

/** 재생성할 때마다 번갈아 쓰는 대본 두 벌 */
const VARIANTS: SceneSeed[][] = [
  [
    { role: 'hook', text: '제주 동쪽 해안 길을 3시간 동안 걸으면 어떤 풍경을 만날까요?', assetId: 'a1', motion: 'zoom_in', sourceBlockIds: ['b1'] },
    { role: 'body', text: '오전 9시에 성산에서 출발했어요. 아침에는 바람이 약해 걷기 좋지만, 그늘이 거의 없으니 모자는 꼭 챙기세요.', assetId: 'a1', motion: 'pan_left', sourceBlockIds: ['b3'] },
    { role: 'body', text: '중간에 있는 작은 포구에서는 물질을 마치고 나오는 해녀분들을 볼 수 있었어요.', assetId: 'a2', motion: 'zoom_out', sourceBlockIds: ['b4'] },
    { role: 'body', text: '점심은 종달리 마을 국숫집의 고기국수. 오후에 해가 강해지면 그늘진 마을 길로 돌아가도 괜찮아요.', assetId: 'a3', motion: 'pan_right', sourceBlockIds: ['b6', 'b7'] },
    { role: 'cta', text: '자세한 경로와 카페 정보는 블로그 본문에 정리해 두었어요. 걷기 전에 한 번 확인해 보세요.', assetId: 'a3', motion: 'zoom_in', sourceBlockIds: ['b10'] },
  ],
  [
    { role: 'hook', text: '지도 없이 걸어도 헤매지 않는 제주 해안 길이 있다는 거, 알고 계셨나요?', assetId: 'a3', motion: 'zoom_out', sourceBlockIds: ['b9'] },
    { role: 'body', text: '성산에서 종달리까지 천천히 걸어 3시간. 중간에 카페 두 곳에 들러 쉬어 갔어요.', assetId: 'a1', motion: 'pan_right', sourceBlockIds: ['b1'] },
    { role: 'body', text: '바다 쪽 길은 그늘이 거의 없어요. 아침 9시쯤 출발하면 바람도 약해서 걷기 좋습니다.', assetId: 'a1', motion: 'zoom_in', sourceBlockIds: ['b3'] },
    { role: 'body', text: '포구에서는 해녀분들의 물질을 볼 수 있었고, 점심은 종달리 고기국수로 든든하게 먹었어요.', assetId: 'a2', motion: 'pan_left', sourceBlockIds: ['b4', 'b6'] },
    { role: 'cta', text: '경로와 카페 정보는 블로그 본문에 자세히 적어 두었어요. 다음 제주 여행 전에 들러 보세요.', assetId: 'a3', motion: 'none', sourceBlockIds: ['b10'] },
  ],
]

export function variantCount(): number {
  return VARIANTS.length
}

/** blockIds: 근거로 쓸 수 있는 블록 ID. withImages=false면 assetId를 비운다(본문 입력, 이미지 0장) */
export function buildScenes(variant: number, blockIds: string[], withImages: boolean): Scene[] {
  const seeds = VARIANTS[variant % VARIANTS.length] ?? []
  return seeds.map((seed, i) => ({
    id: `s${i + 1}`,
    order: i + 1,
    role: seed.role,
    text: seed.text,
    assetId: withImages ? seed.assetId : null,
    motion: seed.motion,
    sourceBlockIds: seed.sourceBlockIds.map((id) => (blockIds.includes(id) ? id : blockIds[i % blockIds.length] ?? id)),
    durationSec: null,
    subtitles: [],
  }))
}

export function buildScript(scenes: Scene[]): NonNullable<Project['script']> {
  const text = (role: Scene['role']) =>
    scenes
      .filter((s) => s.role === role)
      .map((s) => s.text)
      .join(' ')
  const all = scenes.map((s) => s.text).join(' ')
  return { hook: text('hook'), body: text('body'), cta: text('cta'), estimatedSec: round1(countChars(all) / CHARS_PER_SEC) }
}

/** 본문 직접 입력: 빈 줄(없으면 줄바꿈) 기준으로 문단 블록을 만든다 */
export function blocksFromText(text: string): Block[] {
  const byBlank = text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)
  const parts = byBlank.length > 1 ? byBlank : text.split(/\n/).map((t) => t.trim()).filter(Boolean)
  return parts.map((t, i) => p(`b${i + 1}`, t))
}

/** 렌더 흉내: 글자 수 ÷ 7 + 0.3 (7장) */
export function mockDurationSec(text: string): number {
  return round1(countChars(text) / CHARS_PER_SEC + 0.3)
}

/** 백엔드 ⑥과 같은 규칙으로 나눈다. 시간은 글자 수 비례 */
export function mockSubtitles(text: string, durationSec: number): Subtitle[] {
  const pieces = splitSubtitleChunks(text)
  const total = pieces.reduce((n, t) => n + countChars(t), 0) || 1
  let t = 0
  return pieces.map((piece) => {
    const len = (durationSec * countChars(piece)) / total
    const sub = { startSec: round2(t), endSec: round2(t + len), text: piece }
    t += len
    return sub
  })
}


function p(id: string, text: string): Block {
  return { id, type: 'paragraph', text, assetId: null, linkedBlockIds: [] }
}

function img(id: string, assetId: string, caption: string, linked: string[]): Block {
  return { id, type: 'image', text: caption, assetId, linkedBlockIds: linked }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
