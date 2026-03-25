import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';

export const maxDuration = 60; // Set Vercel/Railway max duration higher if possible

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get('video') as File | null;
		const speed = parseFloat(formData.get('speed') as string) || 1.1;
		const adUnlocked = formData.get('adUnlocked') === 'true'; // Unlock after watching ad

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.aac') || file.name.endsWith('.mp3');
		const originalExt = file.name.split('.').pop() || (isAudio ? 'mp3' : 'mp4');
		const timestamp = Date.now();
		const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
		const inputPath = `/tmp/input_${timestamp}_${safeFileName}`;
		const outputPath = `/tmp/output_${timestamp}.${originalExt}`;

		await fs.writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

		// Check video duration — logic moved to frontend iteration count (3/day)
		// We keep basic check to prevent abuse of very long videos on free tier if needed, 
		// but for now we follow user's request for "3 per day"

		return new Promise<NextResponse>((resolve) => {
			let ffmpegArgs: string[] = [];
			
			if (isAudio) {
				ffmpegArgs = [
					'-i', inputPath,
					'-filter:a', `atempo=${speed}`,
					'-vn', // explicitly disable video
					'-threads', '2',
					outputPath
				];
			} else {
				ffmpegArgs = [
					'-i', inputPath,
					'-filter_complex', `[0:v]setpts=PTS/${speed},fps=30[v];[0:a]atempo=${speed}[a]`,
					'-map', '[v]',
					'-map', '[a]',
					'-c:v', 'libx264',
					'-preset', 'ultrafast',    // Найшвидший пресет - менше CPU/RAM
					'-crf', '28',              // Трохи нижча якість = менше RAM
					'-threads', '2',           // Обмеження потоків для Railway free tier
					'-movflags', '+faststart',
					outputPath
				];
			}

			const ffmpeg = spawn('ffmpeg', ffmpegArgs);

			let stderr = "";
			ffmpeg.stderr.on('data', (data) => stderr += data.toString());

			ffmpeg.on('close', async (code) => {
				try {
					if (code !== 0) {
						console.error("FFmpeg Error Out:", stderr);
						resolve(NextResponse.json({
							error: "FFmpeg process failed",
							details: stderr,
							code
						}, { status: 500 }));
						return;
					}

					const output = await fs.readFile(outputPath);

					// Видаляємо тимчасові файли
					await fs.unlink(inputPath).catch(console.error);
					await fs.unlink(outputPath).catch(console.error);

					resolve(new NextResponse(output, {
						headers: {
							'Content-Type': isAudio ? (originalExt === 'wav' ? 'audio/wav' : `audio/${originalExt}`) : 'video/mp4',
							'Content-Disposition': `attachment; filename="fastvid-${speed}x.${originalExt}"`,
							'X-File-Ext': originalExt
						}
					}));
				} catch (err) {
					console.error("Error reading output file:", err);
					resolve(NextResponse.json({ error: "Failed to read output" }, { status: 500 }));
				}
			});

			ffmpeg.on("error", (err) => {
				console.error("FFmpeg spawn error:", err);
				resolve(NextResponse.json({
					error: "FFmpeg execution error",
					message: err.message,
					details: "Make sure FFmpeg is installed in the system PATH"
				}, { status: 500 }));
			});
		});
	} catch (error) {
		console.error("API Route Error:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
