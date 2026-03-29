"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileVideo, Zap, Play, X, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LimitModal from "@/components/LimitModal";
import { gaEvent } from "@/lib/ga";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [isHovering, setIsHovering] = useState(false);
	const [speed, setSpeed] = useState(1.5);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showLimitModal, setShowLimitModal] = useState(false);
	const [adUnlocked, setAdUnlocked] = useState(false);
	const [usageCount, setUsageCount] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Load usage from localStorage on mount
	useEffect(() => {
		const today = new Date().toLocaleDateString();
		const storedData = localStorage.getItem('fastvid_usage');
		if (storedData) {
			const { date, count } = JSON.parse(storedData);
			if (date === today) {
				setUsageCount(count);
			} else {
				// Reset for new day
				localStorage.setItem('fastvid_usage', JSON.stringify({ date: today, count: 0 }));
				setUsageCount(0);
			}
		} else {
			localStorage.setItem('fastvid_usage', JSON.stringify({ date: today, count: 0 }));
		}
	}, []);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsHovering(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsHovering(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsHovering(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile.type.startsWith("video/") || droppedFile.type.startsWith("audio/") || droppedFile.name.endsWith(".wav") || droppedFile.name.endsWith(".aac")) {
				setFile(droppedFile);
			} else {
				alert("Please upload a video or audio file.");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			setFile(selectedFile);
			gaEvent("file_selected", {
				file_name: selectedFile.name,
				file_size: selectedFile.size
			});
		}
	};

	const [status, setStatus] = useState<string>("");
	const [logs, setLogs] = useState<string[]>([]);

	const addLog = (msg: string) => {
		setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
		setStatus(msg);
	};

	const processVideo = async () => {
		if (!file) return;

		// Check limit (3 per day)
		if (usageCount >= 3 && !adUnlocked) {
			setShowLimitModal(true);
			gaEvent("limit_reached", { usage_count: usageCount });
			return;
		}

		setIsProcessing(true);
		setLogs([]);
		addLog("Uploading to server...");
		gaEvent("process_start", { speed: speed });

		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("speed", speed.toString());
			if (adUnlocked) {
				formData.append("adUnlocked", "true");
				setAdUnlocked(false); // use once
			}

			const response = await fetch("/api/process", {
				method: "POST",
				body: formData,
			});

			if (response.status === 403) {
				// Free limit reached — show the monetization modal
				setShowLimitModal(true);
				setIsProcessing(false);
				return;
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: "Server error" }));
				const msg = errorData.message || errorData.error || "Unknown server error";
				addLog(`Error: ${msg}`);
				throw new Error(msg);
			}

			addLog("ffmpeg processing finished...");
			addLog("Downloading result...");

			const blob = await response.blob();
			const ext = response.headers.get("X-File-Ext") || "mp4";
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `fastvid-${speed}x.${ext}`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
			addLog("Successfully downloaded!");
			gaEvent("process_success", { speed: speed, ad_unlocked: adUnlocked });

			// Update usage count
			const today = new Date().toLocaleDateString();
			const newCount = usageCount + 1;
			setUsageCount(newCount);
			localStorage.setItem('fastvid_usage', JSON.stringify({ date: today, count: newCount }));

			if (adUnlocked) {
				setAdUnlocked(false);
			}
		} catch (error: any) {
			console.error("Processing error:", error);
			alert(error.message || "FFmpeg execution error. Please check FFmpeg installation.");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
			{/* Limit Reached Modal */}
			<LimitModal
				isOpen={showLimitModal}
				onClose={() => setShowLimitModal(false)}
				onAdWatched={() => setAdUnlocked(true)}
			/>

			{/* Animated background graphic decorators */}
			<div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

			<div className="z-10 w-full max-w-2xl flex flex-col items-center text-center gap-6 mb-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-4"
				>
					<Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
					<span>No Chipmunk Voice Effect</span>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="text-4xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500"
				>
					Speed up your media. <br className="hidden sm:block" />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
						Save your time.
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="text-lg text-zinc-400 max-w-xl"
				>
					Watch hour-long lectures in 40 minutes. Simply upload your video or audio, pick your speed, and get the fast-forwarded result instantly.
				</motion.p>
			</div>

			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, delay: 0.3 }}
				className="z-10 w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-500/10"
			>
				<AnimatePresence mode="wait">
					{!file ? (
						<motion.div
							key="upload"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="flex flex-col gap-6"
						>
							<div
								className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${isHovering ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"}`}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
							>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									accept="video/*,audio/*,.wav,.aac"
									className="hidden"
								/>
								<div className="flex flex-col items-center gap-4 text-center pointer-events-none">
									<div className={`p-4 rounded-full transition-colors ${isHovering ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
										<UploadCloud className="w-8 h-8" />
									</div>
									<div>
										<h3 className="text-xl font-semibold text-zinc-200 mb-1">Click to upload or drag and drop</h3>
										<p className="text-zinc-500 text-sm">MP4, WebM, MOV, WAV, or AAC up to 500MB</p>
									</div>
								</div>
							</div>
						</motion.div>
					) : (
						<motion.div
							key="file-ready"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="flex flex-col gap-8"
						>
							<div className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
								<div className="flex items-center gap-4 truncate">
									<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
										<FileVideo className="w-6 h-6" />
									</div>
									<div className="truncate">
										<p className="font-medium text-zinc-200 truncate">{file.name}</p>
										<p className="text-sm text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
									</div>
								</div>
								<button
									onClick={() => setFile(null)}
									className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
									disabled={isProcessing}
									title="Remove file"
								>
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between">
									<label className="text-sm font-medium text-zinc-300">Target Speed: <span className="text-indigo-400 text-lg font-bold ml-1">{speed}x</span></label>
									<div className="flex gap-2 text-xs font-medium text-zinc-500">
										<button onClick={() => setSpeed(1.25)} className="hover:text-zinc-300 transition-colors">1.25x</button>
										<button onClick={() => setSpeed(1.5)} className="hover:text-zinc-300 transition-colors">1.5x</button>
										<button onClick={() => setSpeed(2.0)} className="hover:text-zinc-300 transition-colors">2.0x</button>
									</div>
								</div>

								<input
									type="range"
									min="1.1"
									max="3.0"
									step="0.05"
									value={speed}
									onChange={(e) => setSpeed(parseFloat(e.target.value))}
									className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
									disabled={isProcessing}
								/>
							</div>

							<button
								onClick={processVideo}
								disabled={isProcessing}
								className="relative flex items-center justify-center gap-2 w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed group overflow-hidden"
							>
								{/* Button shimmer effect */}
								<div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

								{isProcessing ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										<span>{status || "Processing..."}</span>
									</>
								) : (
									<>
										<span>Speed Up File</span>
										<Play className="w-5 h-5 fill-current" />
									</>
								)}
							</button>

							{/* Real-time Status Logs for Debugging */}
							{logs.length > 0 && (
								<div className="mt-4 p-3 bg-black/40 rounded-lg border border-zinc-800 text-left">
									<p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">System Status Trace</p>
									<div className="space-y-1">
										{logs.map((log, i) => (
											<div key={i} className="text-xs font-mono text-zinc-400 flex gap-2">
												<span className="text-indigo-500/60 leading-none">›</span>
												{log}
											</div>
										))}
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* AdSense Banner — between uploader and How it Works */}
			<div className="z-10 w-full max-w-4xl mt-12 mb-2">
				<ins
					className="adsbygoogle"
					style={{ display: 'block' }}
					data-ad-client="ca-pub-1705879673378260"
					data-ad-format="auto"
					data-full-width-responsive="true"
				/>
			</div>

			{/* HOW IT WORKS */}
			<section className="z-10 w-full max-w-4xl mt-12 mb-12">
				<h2 className="text-3xl font-bold text-center text-zinc-100 mb-3">How it works</h2>
				<p className="text-center text-zinc-500 mb-12">Three simple steps. No account required.</p>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					{[
						{ step: "01", title: "Upload your file", desc: "Drag & drop any media file up to 500MB directly on the page." },
						{ step: "02", title: "Choose your speed", desc: "Pick 1.25x, 1.5x, or 2x — or fine-tune with the slider. Audio pitch stays natural." },
						{ step: "03", title: "Download instantly", desc: "Click Speed Up File. Your browser downloads the ready file in seconds." },
					].map(({ step, title, desc }) => (
						<div key={step} className="flex flex-col gap-3 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
							<span className="text-5xl font-black text-indigo-500/30 leading-none">{step}</span>
							<h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
							<p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* WHY CHOOSE US & FAQ SECTION */}
			<section className="z-10 w-full max-w-4xl mt-20 mb-20 px-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
					{/* Why FastVid */}
					<div>
						<h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
							<Zap className="w-5 h-5 text-indigo-400" />
							Why FastVid.online?
						</h2>
						<ul className="space-y-4 text-zinc-400">
							<li className="flex gap-3">
								<span className="text-indigo-500 font-bold">✓</span>
								<p><strong className="text-zinc-200">No &quot;Chipmunk&quot; Effect:</strong> Our advanced algorithms maintain your natural voice pitch even at 2x speed.</p>
							</li>
							<li className="flex gap-3">
								<span className="text-indigo-500 font-bold">✓</span>
								<p><strong className="text-zinc-200">Privacy First:</strong> Your videos are processed securely and deleted automatically after processing.</p>
							</li>
							<li className="flex gap-3">
								<span className="text-indigo-500 font-bold">✓</span>
								<p><strong className="text-zinc-200">Optimized for Education:</strong> Perfect for students watching long Zoom lectures or online courses.</p>
							</li>
						</ul>
					</div>

					{/* FAQ */}
					<div>
						<h2 className="text-2xl font-bold text-zinc-100 mb-6">Frequently Asked Questions</h2>
						<div className="space-y-6">
							<div>
								<h3 className="text-zinc-200 font-semibold mb-2">How to speed up video without changing pitch?</h3>
								<p className="text-sm text-zinc-500 leading-relaxed">Simply upload your MP4 or MOV file to FastVid. Our tool uses professional audio filters (atempo) to ensure the voice remains natural while the video plays faster.</p>
							</div>
							<div>
								<h3 className="text-zinc-200 font-semibold mb-2">Is it possible to accelerate YouTube lectures?</h3>
								<p className="text-sm text-zinc-500 leading-relaxed">Yes! If you download the lecture video, you can process it here to get much better audio quality at high speeds (1.5x, 2.0x) compared to standard players.</p>
							</div>
							<div>
								<h3 className="text-zinc-200 font-semibold mb-2">Is FastVid free to use?</h3>
								<p className="text-sm text-zinc-500 leading-relaxed">We offer 3 high-quality video processes per day for free. For unlimited access and larger files, check out our Pro Plan.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CONTACT SECTION */}
			<section className="z-10 w-full max-w-4xl mb-20">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-zinc-100 mb-3">Get in Touch</h2>
					<p className="text-center text-zinc-500">We're here to help and listen to your ideas</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit">
							<UploadCloud className="w-6 h-6" />
						</div>
						<h3 className="text-lg font-semibold text-zinc-100">Support</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">Need help with FastVid? Having technical issues or questions about using our service?</p>
						<a
							href="mailto:myappsense@gmail.com?subject=FastVid Support Request&body=Hi, I need help with FastVid:"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2"
						>
							myappsense@gmail.com
						</a>
					</div>
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit">
							<Zap className="w-6 h-6" />
						</div>
						<h3 className="text-lg font-semibold text-zinc-100">Proposals & Partnerships</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">Have ideas for collaboration, feature suggestions, or business proposals? We'd love to hear from you!</p>
						<a
							href="mailto:myappsense@gmail.com?subject=FastVid Proposal&body=Hi, I'd like to discuss:"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2"
						>
							myappsense@gmail.com
						</a>
					</div>
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit">
							<MessageCircle className="w-6 h-6" />
						</div>
						<h3 className="text-lg font-semibold text-zinc-100">Quick Chat</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">Prefer instant messaging? Reach out on Telegram for quick questions and support.</p>
						<a
							href="https://t.me/Tolik_Motion"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2"
						>
							@Tolik_Motion
						</a>
					</div>
				</div>
			</section>

			{/* PRO PLAN */}
			<section className="z-10 w-full max-w-4xl mb-24">
				<div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-zinc-900/60 p-8 sm:p-12">
					<div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
					<div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between relative z-10">
						<div className="flex flex-col gap-4">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium w-fit">
								<Zap className="w-3.5 h-3.5 fill-current" /> Pro Plan
							</div>
							<h2 className="text-3xl font-extrabold text-zinc-100">Unlock full power</h2>
							<ul className="flex flex-col gap-2 text-sm text-zinc-400">
								{[
									"Videos up to 3 hours long",
									"Priority server queue (faster processing)",
									"Up to 4x speed with pitch correction",
									"Batch processing (multiple files)",
								].map(f => (
									<li key={f} className="flex items-center gap-2">
										<span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
										{f}
									</li>
								))}
							</ul>
						</div>
						<div className="flex flex-col items-center sm:items-end gap-4 shrink-0">
							<div className="text-center sm:text-right">
								<p className="text-5xl font-black text-zinc-100">$9<span className="text-2xl text-zinc-400">/mo</span></p>
								<p className="text-zinc-500 text-sm mt-1">or $79/year — save 27%</p>
							</div>
							<a
								href="mailto:myappsense@gmail.com?subject=FastVid Pro Plan&body=Hi, I want to subscribe to FastVid Pro!"
								className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.03] active:scale-[0.98]"
							>
								<Zap className="w-4 h-4 fill-current" />
								Get Pro Access
							</a>
							<p className="text-xs text-zinc-600">We&apos;ll reply within 24 hours</p>
						</div>
					</div>
				</div>
			</section>

			<div className="pb-8 text-center">
				<div className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest mb-2">
					fastvid.online • {new Date().getFullYear()}
				</div>
				<div className="flex items-center justify-center gap-3 text-xs text-zinc-600">
					<a href="mailto:myappsense@gmail.com" className="hover:text-zinc-400 transition-colors">
						Support
					</a>
					<span>•</span>
					<a href="mailto:myappsense@gmail.com" className="hover:text-zinc-400 transition-colors">
						Contact
					</a>
					<span>•</span>
					<a href="https://t.me/Tolik_Motion" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">
						Telegram
					</a>
				</div>
			</div>
		</main>
	);
}
