import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import ffmpegPath from 'ffmpeg-static';

export const maxDuration = 60; // Set Vercel/Railway max duration higher if possible

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get('video') as File | null;
		const speed = parseFloat(formData.get('speed') as string) || 1.1;

		if (!file) {
			return NextResponse.json({ error: "No video uploaded" }, { status: 400 });
		}

		const timestamp = Date.now();
		const inputPath = `/tmp/input_${timestamp}.mp4`;
		const outputPath = `/tmp/output_${timestamp}.mp4`;

		// Записуємо отриманий файл у тимчасову директорію
		await fs.writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

		return new Promise<NextResponse>((resolve) => {
			if (!ffmpegPath) {
				resolve(NextResponse.json({ error: "FFmpeg binary not found" }, { status: 500 }));
				return;
			}

			const ffmpeg = spawn(ffmpegPath, [
				'-i', inputPath,
				'-filter:v', `setpts=PTS/${speed}`,
				'-filter:a', `atempo=${speed}`,
				'-c:v', 'libx264',
				'-preset', 'fast',
				'-crf', '23',
				outputPath
			]);

			ffmpeg.on('close', async (code) => {
				try {
					if (code !== 0) {
						resolve(NextResponse.json({ error: "FFmpeg process failed with code " + code }, { status: 500 }));
						return;
					}

					const output = await fs.readFile(outputPath);

					// Видаляємо тимчасові файли
					await fs.unlink(inputPath).catch(console.error);
					await fs.unlink(outputPath).catch(console.error);

					resolve(new NextResponse(output, {
						headers: {
							'Content-Type': 'video/mp4',
							'Content-Disposition': `attachment; filename="fastvid-${speed}x.mp4"`,
						}
					}));
				} catch (err) {
					console.error("Error reading output file:", err);
					resolve(NextResponse.json({ error: "Failed to read output" }, { status: 500 }));
				}
			});

			ffmpeg.on("error", (err) => {
				console.error("FFmpeg error:", err);
				resolve(NextResponse.json({ error: "FFmpeg execution error" }, { status: 500 }));
			});
		});
	} catch (error) {
		console.error("API Route Error:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
