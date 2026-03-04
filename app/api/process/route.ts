import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs/promises';

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

		// Перевірка тривалості відео (ліміт 600 секунд = 10 хв для Free)
		const getDuration = (path: string): Promise<number> => {
			return new Promise((resolve) => {
				const ffprobe = spawn('ffprobe', [
					'-v', 'error',
					'-show_entries', 'format=duration',
					'-of', 'default=noprint_wrappers=1:nokey=1',
					path
				]);
				let output = '';
				ffprobe.stdout.on('data', (data) => output += data.toString());
				ffprobe.on('close', () => resolve(parseFloat(output) || 0));
				ffprobe.on('error', () => resolve(0)); // Якщо ffprobe не знайдено, пропускаємо перевірку (або ставимо дефолт)
			});
		};

		const duration = await getDuration(inputPath);
		if (duration > 600) {
			await fs.unlink(inputPath).catch(console.error);
			return NextResponse.json({
				error: "Професійна версія потрібна",
				message: "Безкоштовний ліміт — 10 хвилин. Для довших відео, будь ласка, підпишіться на Pro."
			}, { status: 403 });
		}

		return new Promise<NextResponse>((resolve) => {
			const ffmpeg = spawn('ffmpeg', [
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
			]);

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
