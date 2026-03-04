import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
	try {
		const path = process.env.PATH;
		let ffmpegPath = "not found";
		try {
			ffmpegPath = execSync('which ffmpeg').toString().trim();
		} catch (e) { }

		const binContents = [];
		try {
			binContents.push(...execSync('ls /usr/bin/ffmpeg || echo "no /usr/bin/ffmpeg"').toString().split('\n'));
			binContents.push(...execSync('ls /usr/local/bin/ffmpeg || echo "no /usr/local/bin/ffmpeg"').toString().split('\n'));
		} catch (e) { }

		return NextResponse.json({
			path,
			ffmpegPath,
			binContents,
			env: Object.keys(process.env).filter(k => k.includes('PKGS') || k.includes('GA'))
		});
	} catch (error) {
		return NextResponse.json({ error: String(error) });
	}
}
