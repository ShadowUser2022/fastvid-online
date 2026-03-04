"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileVideo, Zap, Play, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
	const [file, setFile] = useState<File | null>(null);
	const [isHovering, setIsHovering] = useState(false);
	const [speed, setSpeed] = useState(1.5);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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
			if (droppedFile.type.startsWith("video/")) {
				setFile(droppedFile);
			} else {
				alert("Будь ласка, завантажте відео файл.");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setFile(e.target.files[0]);
		}
	};

	const [status, setStatus] = useState<string>("");

	const processVideo = async () => {
		if (!file) return;
		setIsProcessing(true);
		setStatus("Uploading...");

		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("speed", speed.toString());

			// Оскільки ми не маємо реального прогрес-бару для FFmpeg через Fetch, 
			// ми змінюємо статуси вручну, щоб користувач розумів, що процес іде.
			setTimeout(() => {
				if (isProcessing) setStatus("Processing Video (FFmpeg)...");
			}, 2000);

			const response = await fetch("/api/process", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: "Server error" }));
				throw new Error(errorData.message || errorData.error || "Невідома помилка сервера");
			}

			setStatus("Finalizing & Downloading...");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `fastvid-${speed}x.mp4`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
			setStatus("Success!");
		} catch (error: any) {
			console.error("Помилка обробки:", error);
			alert(error.message || "Виникла помилка під час обробки відео. Переконайтесь, що FFmpeg встановлено.");
		} finally {
			setIsProcessing(false);
			setTimeout(() => setStatus(""), 3000);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
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
					Speed up your videos. <br className="hidden sm:block" />
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
					Watch hour-long lectures in 40 minutes. Simply upload your video, pick your speed, and get the fast-forwarded result instantly.
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
									accept="video/*"
									className="hidden"
								/>
								<div className="flex flex-col items-center gap-4 text-center pointer-events-none">
									<div className={`p-4 rounded-full transition-colors ${isHovering ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
										<UploadCloud className="w-8 h-8" />
									</div>
									<div>
										<h3 className="text-xl font-semibold text-zinc-200 mb-1">Click to upload or drag and drop</h3>
										<p className="text-zinc-500 text-sm">MP4, WebM, or MOV up to 500MB</p>
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
										<span>Speed Up Video</span>
										<Play className="w-5 h-5 fill-current" />
									</>
								)}
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</main>
	);
}
