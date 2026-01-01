/**
 * 音效预生成脚本
 * 使用 Web Audio API 的 OfflineAudioContext 生成游戏音效并导出为 WAV/MP3 文件
 */

const fs = require('fs');
const path = require('path');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'sfx');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 采样率和配置
const SAMPLE_RATE = 44100;

/**
 * 将 AudioBuffer 转换为 WAV 格式
 */
function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const data = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        data.push(audioBuffer.getChannelData(i));
    }

    const length = data[0].length * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write interleaved data
    let offset = 44;
    for (let i = 0; i < data[0].length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, data[channel][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }

    return buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * 保存音频文件
 */
function saveAudioBuffer(audioBuffer, filename) {
    const wavBuffer = audioBufferToWav(audioBuffer);
    const outputPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(outputPath, Buffer.from(wavBuffer));
    console.log(`✓ Generated: ${filename}`);
}

// ============ 音效生成函数 ============

/**
 * 得分音效 - 清脆的"叮"声
 */
function generateCatch(ctx, points = 10) {
    const duration = 0.3;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    // 根据分数调整基础频率
    const baseFreq = 800 + Math.min(points * 10, 400);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let sample = 0;

            // 主音（正弦波）
            const freq1 = baseFreq * Math.pow(0.5, t / 0.15);
            const amp1 = 0.4 * Math.exp(-t / 0.05);
            sample += Math.sin(2 * Math.PI * freq1 * t) * amp1;

            // 泛音
            const freq2 = baseFreq * 2.5;
            const amp2 = 0.15 * Math.exp(-t / 0.03);
            sample += Math.sin(2 * Math.PI * freq2 * t) * amp2;

            data[i] = sample;
        }
    }

    return buffer;
}

/**
 * 解锁音效 - 欢快的上升音阶
 */
function generateUnlock(ctx) {
    const duration = 0.6;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let sample = 0;

            // 音阶音符
            notes.forEach((freq, idx) => {
                const startTime = idx * 0.1;
                if (t >= startTime) {
                    const noteT = t - startTime;
                    const attack = Math.min(noteT / 0.05, 1);
                    const decay = Math.exp(-noteT / 0.08);
                    const amp = 0.3 * attack * decay;
                    sample += Math.sin(2 * Math.PI * freq * t) * amp;
                }
            });

            // 闪亮音效（高频正弦波）
            if (t >= 0.3 && t <= 0.55) {
                const sparkleT = t - 0.3;
                const attack = Math.min(sparkleT / 0.05, 1);
                const decay = Math.exp(-sparkleT / 0.05);
                const amp = 0.15 * attack * decay;
                sample += Math.sin(2 * Math.PI * 2000 * t) * amp;
            }

            data[i] = sample;
        }
    }

    return buffer;
}

/**
 * 倒计时音效 - 滴答声
 */
function generateCountdown(ctx) {
    const duration = 0.1;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const amp = 0.2 * Math.exp(-t / 0.015);
            // 方波近似
            const square = Math.sin(2 * Math.PI * 1000 * t) > 0 ? 1 : -1;
            data[i] = square * amp;
        }
    }

    return buffer;
}

/**
 * 游戏开始音效 - 活泼的上升音
 */
function generateGameStart(ctx) {
    const duration = 0.5;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let sample = 0;

            // 上升的滑音（锯齿波带低通滤波效果）
            if (t <= 0.4) {
                const freq = 200 * Math.pow(4, Math.min(t / 0.2, 1));
                const amp = t < 0.15 ? 0.2 : 0.2 * Math.exp(-(t - 0.15) / 0.1);
                // 锯齿波近似
                const saw = ((t * freq) % 1) * 2 - 1;
                sample += saw * amp;
            }

            // 结束音
            if (t >= 0.2 && t <= 0.45) {
                const endT = t - 0.2;
                const attack = Math.min(endT / 0.05, 1);
                const decay = Math.exp(-endT / 0.08);
                const amp = 0.3 * attack * decay;
                sample += Math.sin(2 * Math.PI * 800 * t) * amp;
            }

            data[i] = sample;
        }
    }

    return buffer;
}

/**
 * 游戏结束音效 - 温和的结束感
 */
function generateGameOver(ctx) {
    const duration = 1.4;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
    const notes1 = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4
    const chordNotes = [261.63, 329.63, 392.00]; // C4, E4, G4

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let sample = 0;

            // 下降的和弦
            notes1.forEach((freq, idx) => {
                const startTime = idx * 0.15;
                if (t >= startTime && t <= startTime + 0.55) {
                    const noteT = t - startTime;
                    const attack = Math.min(noteT / 0.05, 1);
                    const sustain = noteT >= 0.05 && noteT <= 0.2 ? 1 : Math.exp(-(noteT - 0.2) / 0.15);
                    const amp = 0.25 * attack * sustain;
                    sample += Math.sin(2 * Math.PI * freq * t) * amp;
                }
            });

            // 最后的和弦持续音
            if (t >= 0.6) {
                const chordT = t - 0.6;
                const attack = Math.min(chordT / 0.1, 1);
                const sustain = chordT >= 0.1 && chordT <= 0.3 ? 1 : Math.exp(-(chordT - 0.3) / 0.25);
                const amp = 0.15 * attack * sustain;
                chordNotes.forEach(freq => {
                    sample += Math.sin(2 * Math.PI * freq * t) * amp;
                });
            }

            data[i] = sample;
        }
    }

    return buffer;
}

/**
 * 按钮点击音效 - 短促清脆
 */
function generateButtonClick(ctx) {
    const duration = 0.12;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const freq = 600 * Math.pow(0.67, t / 0.05);
            const amp = 0.15 * Math.exp(-t / 0.025);
            data[i] = Math.sin(2 * Math.PI * freq * t) * amp;
        }
    }

    return buffer;
}

/**
 * 卡片滑动音效 - 轻微的滑动声
 */
function generateCardScroll(ctx) {
    const duration = 0.06;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            const amp = 0.1 * Math.exp(-t / 0.015);
            // 高频噪声
            let noise = 0;
            for (let j = 0; j < 3; j++) {
                noise += (Math.random() * 2 - 1);
            }
            noise /= 3;
            data[i] = noise * amp;
        }
    }

    return buffer;
}

/**
 * 模式选择音效 - 特殊激活音
 */
function generateModeSelect(ctx) {
    const duration = 0.4;
    const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
            const t = i / ctx.sampleRate;
            let sample = 0;

            // 低音基础
            if (t <= 0.25) {
                const amp = 0.2 * Math.exp(-t / 0.06);
                sample += Math.sin(2 * Math.PI * 150 * t) * amp;
            }

            // 上升的音效
            if (t <= 0.25) {
                const freq = 300 * Math.pow(2, Math.min(t / 0.15, 1));
                const amp = 0.1 * Math.exp(-t / 0.06);
                const saw = ((t * freq) % 1) * 2 - 1;
                sample += saw * amp * 0.5;
            }

            // 高音点缀
            if (t >= 0.1 && t <= 0.35) {
                const highT = t - 0.1;
                const attack = Math.min(highT / 0.05, 1);
                const decay = Math.exp(-highT / 0.08);
                const amp = 0.2 * attack * decay;
                sample += Math.sin(2 * Math.PI * 1200 * t) * amp;
            }

            data[i] = sample;
        }
    }

    return buffer;
}

// ============ 主生成函数 ============

/**
 * 使用 Web Audio API 生成所有音效
 */
async function generateSounds() {
    // 在浏览器环境中使用 OfflineAudioContext
    // 这里我们使用一个简单的方法：创建一个 HTML 文件来生成音频
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>音效生成器</title>
</head>
<body>
    <h1>音效生成中...</h1>
    <div id="log"></div>
    <script>
        const log = document.getElementById('log');

        function audioBufferToWav(audioBuffer) {
            const numChannels = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const bitDepth = 16;
            const bytesPerSample = bitDepth / 8;
            const blockAlign = numChannels * bytesPerSample;

            const data = [];
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                data.push(audioBuffer.getChannelData(i));
            }

            const length = data[0].length * numChannels * bytesPerSample;
            const buffer = new ArrayBuffer(44 + length);
            const view = new DataView(buffer);

            const writeString = (offset, string) => {
                for (let i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            };

            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * blockAlign, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitDepth, true);
            writeString(36, 'data');
            view.setUint32(40, length, true);

            let offset = 44;
            for (let i = 0; i < data[0].length; i++) {
                for (let channel = 0; channel < numChannels; channel++) {
                    const sample = Math.max(-1, Math.min(1, data[channel][i]));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                }
            }

            return buffer;
        }

        function downloadBlob(buffer, filename) {
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            log.innerHTML += '<div>✓ Generated: ' + filename + '</div>';
        }

        async function generateAll() {
            const ctx = new OfflineAudioContext(2, 44100 * 2, 44100);

            // 得分音效（5个变体）
            ${[10, 15, 20, 25, 30].map(points => {
                const baseFreq = 800 + Math.min(points * 10, 400);
                return `
            (function() {
                const duration = 0.3;
                const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
                const baseFreq = ${baseFreq};
                for (let channel = 0; channel < 2; channel++) {
                    const data = buffer.getChannelData(channel);
                    for (let i = 0; i < data.length; i++) {
                        const t = i / ctx.sampleRate;
                        let sample = 0;
                        const freq1 = baseFreq * Math.pow(0.5, t / 0.15);
                        const amp1 = 0.4 * Math.exp(-t / 0.05);
                        sample += Math.sin(2 * Math.PI * freq1 * t) * amp1;
                        const freq2 = baseFreq * 2.5;
                        const amp2 = 0.15 * Math.exp(-t / 0.03);
                        sample += Math.sin(2 * Math.PI * freq2 * t) * amp2;
                        data[i] = sample;
                    }
                }
                downloadBlob(audioBufferToWav(buffer), 'catch_${points}.wav');
            })();
                `;
            }).join('\n')}

            // 其他音效将在完整版本中生成
            log.innerHTML += '<div>完成！请下载所有生成的文件到 assets/sfx/ 目录</div>';
        }

        generateAll();
    </script>
</body>
</html>
`;

    // 保存 HTML 生成器
    const generatorPath = path.join(__dirname, 'sound-generator.html');
    fs.writeFileSync(generatorPath, htmlTemplate);
    console.log('\n=================================');
    console.log('音频生成器已创建!');
    console.log('=================================');
    console.log('\n请在浏览器中打开以下文件生成音效:');
    console.log(`  file://${generatorPath}`);
    console.log('\n生成后，将下载的 WAV 文件移动到:');
    console.log(`  ${OUTPUT_DIR}`);
    console.log('\n或者使用以下在线工具转换 WAV 到 MP3:');
    console.log('  https://online-audio-converter.com/');
    console.log('=================================\n');
}

// 生成完整的 HTML 生成器（包含所有音效）
function generateFullHTMLGenerator() {
    // 这里需要包含所有音效的生成代码
    // 由于篇幅较长，我们使用一个更简洁的方法
    console.log('正在生成完整的音频生成器...');

    const completeHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>音效生成器 - 完整版</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        #log { margin-top: 20px; padding: 15px; background: white; border-radius: 8px; }
        .success { color: #4CAF50; }
        .info { color: #2196F3; }
        button { padding: 10px 20px; margin: 5px; font-size: 16px; cursor: pointer; }
        button:hover { background: #ddd; }
    </style>
</head>
<body>
    <h1>🎵 游戏音效生成器</h1>
    <button onclick="generateAll()">🚀 生成所有音效</button>
    <div id="log"></div>

    <script>
        const log = document.getElementById('log');
        const SAMPLE_RATE = 44100;

        function logMsg(msg, type = 'info') {
            const div = document.createElement('div');
            div.className = type;
            div.textContent = msg;
            log.appendChild(div);
        }

        function audioBufferToWav(audioBuffer) {
            const numChannels = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const bitDepth = 16;
            const bytesPerSample = bitDepth / 8;
            const blockAlign = numChannels * bytesPerSample;

            const data = [];
            for (let i = 0; i < numChannels; i++) {
                data.push(audioBuffer.getChannelData(i));
            }

            const length = data[0].length * blockAlign;
            const buffer = new ArrayBuffer(44 + length);
            const view = new DataView(buffer);

            const writeString = (offset, str) => {
                for (let i = 0; i < str.length; i++) {
                    view.setUint8(offset + i, str.charCodeAt(i));
                }
            };

            writeString(0, 'RIFF');
            view.setUint32(4, 36 + length, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * blockAlign, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitDepth, true);
            writeString(36, 'data');
            view.setUint32(40, length, true);

            let offset = 44;
            for (let i = 0; i < data[0].length; i++) {
                for (let ch = 0; ch < numChannels; ch++) {
                    const s = Math.max(-1, Math.min(1, data[ch][i]));
                    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    offset += 2;
                }
            }
            return buffer;
        }

        function downloadFile(buffer, filename) {
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            logMsg('✓ ' + filename, 'success');
        }

        // ============ 音效生成函数 ============

        function generateCatch(ctx, points) {
            const duration = 0.3;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            const baseFreq = 800 + Math.min(points * 10, 400);

            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    let s = 0;
                    const f1 = baseFreq * Math.pow(0.5, t / 0.15);
                    const a1 = 0.4 * Math.exp(-t / 0.05);
                    s += Math.sin(2 * Math.PI * f1 * t) * a1;
                    const f2 = baseFreq * 2.5;
                    const a2 = 0.15 * Math.exp(-t / 0.03);
                    s += Math.sin(2 * Math.PI * f2 * t) * a2;
                    data[i] = s;
                }
            }
            return buffer;
        }

        function generateUnlock(ctx) {
            const duration = 0.6;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            const notes = [523.25, 659.25, 783.99, 1046.50];

            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    let s = 0;
                    notes.forEach((freq, idx) => {
                        const st = idx * 0.1;
                        if (t >= st) {
                            const nt = t - st;
                            const att = Math.min(nt / 0.05, 1);
                            const dec = Math.exp(-nt / 0.08);
                            s += Math.sin(2 * Math.PI * freq * t) * 0.3 * att * dec;
                        }
                    });
                    if (t >= 0.3 && t <= 0.55) {
                        const spt = t - 0.3;
                        const att = Math.min(spt / 0.05, 1);
                        const dec = Math.exp(-spt / 0.05);
                        s += Math.sin(2 * Math.PI * 2000 * t) * 0.15 * att * dec;
                    }
                    data[i] = s;
                }
            }
            return buffer;
        }

        function generateCountdown(ctx) {
            const duration = 0.1;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    const a = 0.2 * Math.exp(-t / 0.015);
                    data[i] = (Math.sin(2 * Math.PI * 1000 * t) > 0 ? 1 : -1) * a;
                }
            }
            return buffer;
        }

        function generateGameStart(ctx) {
            const duration = 0.5;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    let s = 0;
                    if (t <= 0.4) {
                        const f = 200 * Math.pow(4, Math.min(t / 0.2, 1));
                        const a = t < 0.15 ? 0.2 : 0.2 * Math.exp(-(t - 0.15) / 0.1);
                        s += (((t * f) % 1) * 2 - 1) * a;
                    }
                    if (t >= 0.2 && t <= 0.45) {
                        const et = t - 0.2;
                        const att = Math.min(et / 0.05, 1);
                        const dec = Math.exp(-et / 0.08);
                        s += Math.sin(2 * Math.PI * 800 * t) * 0.3 * att * dec;
                    }
                    data[i] = s;
                }
            }
            return buffer;
        }

        function generateGameOver(ctx) {
            const duration = 1.4;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            const notes1 = [523.25, 392.00, 329.63, 261.63];
            const chordNotes = [261.63, 329.63, 392.00];

            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    let s = 0;
                    notes1.forEach((freq, idx) => {
                        const st = idx * 0.15;
                        if (t >= st && t <= st + 0.55) {
                            const nt = t - st;
                            const att = Math.min(nt / 0.05, 1);
                            const sus = nt >= 0.05 && nt <= 0.2 ? 1 : Math.exp(-(nt - 0.2) / 0.15);
                            s += Math.sin(2 * Math.PI * freq * t) * 0.25 * att * sus;
                        }
                    });
                    if (t >= 0.6) {
                        const ct = t - 0.6;
                        const att = Math.min(ct / 0.1, 1);
                        const sus = ct >= 0.1 && ct <= 0.3 ? 1 : Math.exp(-(ct - 0.3) / 0.25);
                        const a = 0.15 * att * sus;
                        chordNotes.forEach(f => { s += Math.sin(2 * Math.PI * f * t) * a; });
                    }
                    data[i] = s;
                }
            }
            return buffer;
        }

        function generateButtonClick(ctx) {
            const duration = 0.12;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    const f = 600 * Math.pow(0.67, t / 0.05);
                    const a = 0.15 * Math.exp(-t / 0.025);
                    data[i] = Math.sin(2 * Math.PI * f * t) * a;
                }
            }
            return buffer;
        }

        function generateCardScroll(ctx) {
            const duration = 0.06;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    const a = 0.1 * Math.exp(-t / 0.015);
                    let n = 0;
                    for (let j = 0; j < 3; j++) n += Math.random() * 2 - 1;
                    data[i] = (n / 3) * a;
                }
            }
            return buffer;
        }

        function generateModeSelect(ctx) {
            const duration = 0.4;
            const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const data = buffer.getChannelData(ch);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    let s = 0;
                    if (t <= 0.25) s += Math.sin(2 * Math.PI * 150 * t) * 0.2 * Math.exp(-t / 0.06);
                    if (t <= 0.25) {
                        const f = 300 * Math.pow(2, Math.min(t / 0.15, 1));
                        const a = 0.1 * Math.exp(-t / 0.06);
                        s += (((t * f) % 1) * 2 - 1) * a * 0.5;
                    }
                    if (t >= 0.1 && t <= 0.35) {
                        const ht = t - 0.1;
                        const att = Math.min(ht / 0.05, 1);
                        const dec = Math.exp(-ht / 0.08);
                        s += Math.sin(2 * Math.PI * 1200 * t) * 0.2 * att * dec;
                    }
                    data[i] = s;
                }
            }
            return buffer;
        }

        async function generateAll() {
            log.innerHTML = '';
            logMsg('开始生成音效...', 'info');

            const ctx = new OfflineAudioContext(2, SAMPLE_RATE * 2, SAMPLE_RATE);

            // 生成所有音效
            const sounds = [
                { fn: () => generateCatch(ctx, 10), name: 'catch_10.wav' },
                { fn: () => generateCatch(ctx, 15), name: 'catch_15.wav' },
                { fn: () => generateCatch(ctx, 20), name: 'catch_20.wav' },
                { fn: () => generateCatch(ctx, 25), name: 'catch_25.wav' },
                { fn: () => generateCatch(ctx, 30), name: 'catch_30.wav' },
                { fn: () => generateUnlock(ctx), name: 'unlock.wav' },
                { fn: () => generateCountdown(ctx), name: 'countdown.wav' },
                { fn: () => generateGameStart(ctx), name: 'game_start.wav' },
                { fn: () => generateGameOver(ctx), name: 'game_over.wav' },
                { fn: () => generateButtonClick(ctx), name: 'button_click.wav' },
                { fn: () => generateCardScroll(ctx), name: 'card_scroll.wav' },
                { fn: () => generateModeSelect(ctx), name: 'mode_select.wav' },
            ];

            for (const sound of sounds) {
                const buffer = sound.fn();
                downloadFile(audioBufferToWav(buffer), sound.name);
                // 添加延迟避免浏览器阻止多个下载
                await new Promise(r => setTimeout(r, 100));
            }

            logMsg('完成！请将所有下载的 WAV 文件移动到项目的 assets/sfx/ 目录', 'success');
            logMsg('然后使用在线工具将 WAV 转换为 MP3: https://online-audio-converter.com/', 'info');
        }
    </script>
</body>
</html>`;

    const generatorPath = path.join(__dirname, 'sound-generator.html');
    fs.writeFileSync(generatorPath, completeHTML);

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          音效生成器已创建！                            ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n📁 生成器位置:');
    console.log(`   ${generatorPath}`);
    console.log('\n📋 使用步骤:');
    console.log('   1. 在浏览器中打开上述 HTML 文件');
    console.log('   2. 点击 "生成所有音效" 按钮');
    console.log('   3. 下载所有生成的 WAV 文件');
    console.log('   4. 将文件移动到项目的 assets/sfx/ 目录');
    console.log('   5. 使用在线工具转换为 MP3 (可选):');
    console.log('      https://online-audio-converter.com/');
    console.log('\n📂 目标目录:');
    console.log(`   ${OUTPUT_DIR}`);
    console.log('\n╔════════════════════════════════════════════════════════╗\n');
}

// 运行生成器
generateFullHTMLGenerator();
