/**
 * Emoji 配置文件
 * 定义需要转换为图片的 emoji 列表
 */

const EMOJIS = [
  // UI emoji
  { key: 'sound-on', emoji: '🔊', codepoint: '1f50a' },
  { key: 'sound-off', emoji: '🔇', codepoint: '1f507' },
  { key: 'settings', emoji: '⚙️', codepoint: '2699' },
  { key: 'infinite', emoji: '♾️', codepoint: '267e' },
  { key: 'timer', emoji: '⏱️', codepoint: '23f1' },
  { key: 'star', emoji: '⭐', codepoint: '2b50' },
  { key: 'paw', emoji: '🐾', codepoint: '1f43e' },
  { key: 'cat', emoji: '🐱', codepoint: '1f431' },
  { key: 'lock', emoji: '🔒', codepoint: '1f512' },
  { key: 'finger', emoji: '👆', codepoint: '1f446' },
  { key: 'party', emoji: '🎉', codepoint: '1f389' },
  { key: 'phone', emoji: '📲', codepoint: '1f4f2' },
  { key: 'gift', emoji: '🎁', codepoint: '1f381' },
  // 目标 emoji - 免费
  { key: 'sparkle', emoji: '✨', codepoint: '2728' },
  { key: 'butterfly', emoji: '🦋', codepoint: '1f98b' },
  { key: 'mouse', emoji: '🐭', codepoint: '1f42d' },
  // 目标 emoji - 广告解锁
  { key: 'fish', emoji: '🐟', codepoint: '1f41f' },
  { key: 'bird', emoji: '🐦', codepoint: '1f426' },
  { key: 'yarn', emoji: '🧶', codepoint: '1f9f6' },
  { key: 'ladybug', emoji: '🐞', codepoint: '1f41e' },
  { key: 'feather', emoji: '🪶', codepoint: '1fab6' },
  { key: 'laser', emoji: '🔴', codepoint: '1f534' },
];

const CONFIG = {
  // Twemoji CDN 基础 URL (72x72 PNG)
  cdnBase: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/',

  // 输出目录 (相对于项目根目录)
  outputDir: '../../assets/emoji',

  // 精灵图尺寸
  spriteSize: 72,

  // 输出文件名
  spriteImage: 'sprite.png',
  spriteJson: 'sprite.json',
};

module.exports = { EMOJIS, CONFIG };
