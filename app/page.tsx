"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileVideo, Zap, Play, X, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LimitModal from "@/components/LimitModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { gaEvent } from "@/lib/ga";
import { translations, Lang } from "@/lib/translations";

export default function Home() {
	const [lang, setLang] = useState<Lang>("en");
	const t = translations[lang];

	const [file, setFile] = useState<File | null>(null);
	const [isHovering, setIsHovering] = useState(false);
	const [speed, setSpeed] = useState(1.5);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showLimitModal, setShowLimitModal] = useState(false);
	const [adUnlocked, setAdUnlocked] = useState(false);
	const [usageCount, setUsageCount] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const today = new Date().toLocaleDateString();
		const storedData = localStorage.getItem("fastvid_usage");
		if (storedData) {
			const { date, count } = JSON.parse(storedData);
			if (date === today) {
				setUsageCount(count);
			} else {
				localStorage.setItem("fastvid_usage", JSON.stringify({ date: today, count: 0 }));
				setUsageCount(0);
			}
		} else {
			localStorage.setItem("fastvid_usage", JSON.stringify({ date: today, count: 0 }));
		}
	}, []);

	// Auto-detect browser language
	useEffect(() => {
		const browserLang = navigator.language.slice(0, 2).toLowerCase();
		const map: Record<string, Lang> = { uk: "uk", de: "de", pl: "pl", es: "es", pt: "pt" };
		if (map[browserLang]) setLang(map[browserLang]);
	}, []);

	const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsHovering(true); };
	const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsHovering(false); };
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsHovering(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const f = e.dataTransfer.files[0];
			if (f.type.startsWith("video/") || f.type.startsWith("audio/") || f.name.endsWith(".wav") || f.name.endsWith(".aac")) {
				setFile(f);
			} else {
				alert("Please upload a video or audio file.");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0];
			setFile(selectedFile);
			gaEvent("file_selected", { file_name: selectedFile.name, file_size: selectedFile.size });
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
		if (usageCount >= 3 && !adUnlocked) {
			setShowLimitModal(true);
			gaEvent("limit_reached", { usage_count: usageCount });
			return;
		}
		setIsProcessing(true);
		setLogs([]);
		addLog("Uploading to server...");
		gaEvent("process_start", { speed });
		try {
			const formData = new FormData();
			formData.append("video", file);
			formData.append("speed", speed.toString());
			if (adUnlocked) { formData.append("adUnlocked", "true"); setAdUnlocked(false); }

			const response = await fetch("/api/process", { method: "POST", body: formData });
			if (response.status === 403) { setShowLimitModal(true); setIsProcessing(false); return; }
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
			a.href = url; a.download = `fastvid-${speed}x.${ext}`;
			document.body.appendChild(a); a.click();
			window.URL.revokeObjectURL(url); a.remove();
			addLog("Successfully downloaded!");
			gaEvent("process_success", { speed, ad_unlocked: adUnlocked });
			const today = new Date().toLocaleDateString();
			const newCount = usageCount + 1;
			setUsageCount(newCount);
			localStorage.setItem("fastvid_usage", JSON.stringify({ date: today, count: newCount }));
			if (adUnlocked) setAdUnlocked(false);
		} catch (error: any) {
			console.error("Processing error:", error);
			alert(error.message || "FFmpeg execution error.");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4 pt-10 pb-10 sm:p-24 relative overflow-hidden">
			<LimitModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} onAdWatched={() => setAdUnlocked(true)} />

			{/* Background blobs */}
			<div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

			{/* Language Switcher */}
			<div className="z-20 fixed top-4 right-4 sm:top-6 sm:right-6">
				<LanguageSwitcher current={lang} onChange={setLang} />
			</div>

			{/* HERO */}
			<div className="z-10 w-full max-w-2xl flex flex-col items-center text-center gap-4 sm:gap-6 mb-8 sm:mb-12">
				<motion.div
					initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
					className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-2 sm:mb-4"
				>
					<Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
					<span>{t.badge}</span>
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
					className="text-3xl sm:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500"
				>
					{t.hero1} <br className="hidden sm:block" />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
						{t.hero2}
					</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
					className="text-base sm:text-lg text-zinc-400 max-w-xl"
				>
					{t.hero_desc}
				</motion.p>
			</div>

			{/* UPLOADER CARD */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
				className="z-10 w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-2xl shadow-indigo-500/10"
			>
				<AnimatePresence mode="wait">
					{!file ? (
						<motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-6">
							<div
								className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden active:bg-indigo-500/10 active:border-indigo-500 ${isHovering ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"}`}
								onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
							>
								<input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*,audio/*,.wav,.aac" className="hidden" />
								<div className="flex flex-col items-center gap-4 text-center pointer-events-none">
									<div className={`p-4 rounded-full transition-colors ${isHovering ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
										<UploadCloud className="w-8 h-8" />
									</div>
									<div>
										<h3 className="text-lg sm:text-xl font-semibold text-zinc-200 mb-1">
											<span className="sm:hidden">{t.upload_tap}</span>
											<span className="hidden sm:inline">{t.upload_click}</span>
										</h3>
										<p className="text-zinc-500 text-sm">{t.upload_formats}</p>
									</div>
								</div>
							</div>
						</motion.div>
					) : (
						<motion.div key="file-ready" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-8">
							<div className="flex items-center justify-between bg-zinc-800/50 p-3 sm:p-4 rounded-xl border border-zinc-700/50">
								<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
									<div className="p-2 sm:p-3 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
										<FileVideo className="w-5 h-5 sm:w-6 sm:h-6" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-medium text-zinc-200 truncate text-sm sm:text-base">{file.name}</p>
										<p className="text-xs sm:text-sm text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
									</div>
								</div>
								<button onClick={() => setFile(null)} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0" disabled={isProcessing}>
									<X className="w-5 h-5" />
								</button>
							</div>

							<div className="flex flex-col gap-4">
								<div className="flex items-center justify-between">
									<label className="text-sm font-medium text-zinc-300">{t.speed} <span className="text-indigo-400 text-lg font-bold ml-1">{speed}x</span></label>
									<div className="flex gap-2">
										{[1.25, 1.5, 2.0].map((s) => (
											<button key={s} onClick={() => setSpeed(s)}
												className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${speed === s ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}>
												{s}x
											</button>
										))}
									</div>
								</div>
								<input type="range" min="1.1" max="3.0" step="0.05" value={speed}
									onChange={(e) => setSpeed(parseFloat(e.target.value))}
									className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
									disabled={isProcessing}
								/>
							</div>

							<button onClick={processVideo} disabled={isProcessing}
								className="relative flex items-center justify-center gap-2 w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed group overflow-hidden"
							>
								<div className="absolute inset-0 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
								{isProcessing ? (
									<><Loader2 className="w-5 h-5 animate-spin" /><span>{status || t.btn_processing}</span></>
								) : (
									<><span>{t.btn_process}</span><Play className="w-5 h-5 fill-current" /></>
								)}
							</button>

							{logs.length > 0 && (
								<div className="mt-4 p-3 bg-black/40 rounded-lg border border-zinc-800 text-left">
									<p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">System Status Trace</p>
									<div className="space-y-1">
										{logs.map((log, i) => (
											<div key={i} className="text-xs font-mono text-zinc-400 flex gap-2">
												<span className="text-indigo-500/60 leading-none">›</span>{log}
											</div>
										))}
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			{/* AdSense */}
			<div className="z-10 w-full max-w-4xl mt-12 mb-2">
				<ins className="adsbygoogle" style={{ display: "block" }}
					data-ad-client="ca-pub-1705879673378260" data-ad-format="auto" data-full-width-responsive="true" />
			</div>

			{/* HOW IT WORKS */}
			<section className="z-10 w-full max-w-4xl mt-8 sm:mt-12 mb-8 sm:mb-12">
				<h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-3">{t.how_title}</h2>
				<p className="text-center text-zinc-500 mb-8 sm:mb-12 text-sm sm:text-base">{t.how_sub}</p>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
					{[
						{ step: "01", title: t.step1_title, desc: t.step1_desc },
						{ step: "02", title: t.step2_title, desc: t.step2_desc },
						{ step: "03", title: t.step3_title, desc: t.step3_desc },
					].map(({ step, title, desc }) => (
						<div key={step} className="flex flex-col gap-3 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
							<span className="text-5xl font-black text-indigo-500/30 leading-none">{step}</span>
							<h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
							<p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* WHY + FAQ */}
			<section className="z-10 w-full max-w-4xl mt-10 sm:mt-20 mb-10 sm:mb-20">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12">
					<div>
						<h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
							<Zap className="w-5 h-5 text-indigo-400" />{t.why_title}
						</h2>
						<ul className="space-y-4 text-zinc-400">
							<li className="flex gap-3"><span className="text-indigo-500 font-bold">✓</span><p><strong className="text-zinc-200">{t.why1_strong}</strong> {t.why1_text}</p></li>
							<li className="flex gap-3"><span className="text-indigo-500 font-bold">✓</span><p><strong className="text-zinc-200">{t.why2_strong}</strong> {t.why2_text}</p></li>
							<li className="flex gap-3"><span className="text-indigo-500 font-bold">✓</span><p><strong className="text-zinc-200">{t.why3_strong}</strong> {t.why3_text}</p></li>
						</ul>
					</div>
					<div>
						<h2 className="text-2xl font-bold text-zinc-100 mb-6">{t.faq_title}</h2>
						<div className="space-y-6">
							<div><h3 className="text-zinc-200 font-semibold mb-2">{t.faq1_q}</h3><p className="text-sm text-zinc-500 leading-relaxed">{t.faq1_a}</p></div>
							<div><h3 className="text-zinc-200 font-semibold mb-2">{t.faq2_q}</h3><p className="text-sm text-zinc-500 leading-relaxed">{t.faq2_a}</p></div>
							<div><h3 className="text-zinc-200 font-semibold mb-2">{t.faq3_q}</h3><p className="text-sm text-zinc-500 leading-relaxed">{t.faq3_a}</p></div>
						</div>
					</div>
				</div>
			</section>

			{/* CONTACT */}
			<section className="z-10 w-full max-w-4xl mb-10 sm:mb-20">
				<div className="text-center mb-8 sm:mb-12">
					<h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3">{t.contact_title}</h2>
					<p className="text-center text-zinc-500">{t.contact_sub}</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit"><UploadCloud className="w-6 h-6" /></div>
						<h3 className="text-lg font-semibold text-zinc-100">{t.support_title}</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">{t.support_desc}</p>
						<a href="mailto:myappsense@gmail.com?subject=FastVid Support Request&body=Hi, I need help with FastVid:"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2">
							myappsense@gmail.com
						</a>
					</div>
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit"><Zap className="w-6 h-6" /></div>
						<h3 className="text-lg font-semibold text-zinc-100">{t.partner_title}</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">{t.partner_desc}</p>
						<a href="mailto:myappsense@gmail.com?subject=FastVid Proposal&body=Hi, I'd like to discuss:"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2">
							myappsense@gmail.com
						</a>
					</div>
					<div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/50 transition-colors">
						<div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg w-fit"><MessageCircle className="w-6 h-6" /></div>
						<h3 className="text-lg font-semibold text-zinc-100">{t.chat_title}</h3>
						<p className="text-sm text-zinc-500 leading-relaxed">{t.chat_desc}</p>
						<a href="https://t.me/Tolik_Motion" target="_blank" rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg transition-colors mt-2">
							@Tolik_Motion
						</a>
					</div>
				</div>
			</section>

			{/* PRO PLAN */}
			<section className="z-10 w-full max-w-4xl mb-14 sm:mb-24">
				<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-zinc-900/60 p-6 sm:p-12">
					<div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
					<div className="flex flex-col gap-6 sm:gap-8 sm:flex-row sm:items-center justify-between relative z-10">
						<div className="flex flex-col gap-3 sm:gap-4">
							<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium w-fit">
								<Zap className="w-3.5 h-3.5 fill-current" /> {t.pro_badge}
							</div>
							<h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">{t.pro_title}</h2>
							<ul className="flex flex-col gap-2 text-sm text-zinc-400">
								{[t.pro_f1, t.pro_f2, t.pro_f3, t.pro_f4].map(f => (
									<li key={f} className="flex items-center gap-2">
										<span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />{f}
									</li>
								))}
							</ul>
						</div>
						<div className="flex flex-col items-start sm:items-end gap-4 shrink-0">
							<div className="text-left sm:text-right">
								<p className="text-4xl sm:text-5xl font-black text-zinc-100">$9<span className="text-xl sm:text-2xl text-zinc-400">/mo</span></p>
								<p className="text-zinc-500 text-sm mt-1">{t.pro_yearly}</p>
							</div>
							<a href="mailto:myappsense@gmail.com?subject=FastVid Pro Plan&body=Hi, I want to subscribe to FastVid Pro!"
								className="inline-flex items-center gap-2 px-6 sm:px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] w-full sm:w-auto justify-center">
								<Zap className="w-4 h-4 fill-current" />{t.pro_btn}
							</a>
							<p className="text-xs text-zinc-600">{t.pro_reply}</p>
						</div>
					</div>
				</div>
			</section>

			{/* FOOTER */}
			<div className="pb-8 text-center">
				<div className="flex items-center justify-center gap-2 mb-3">
					<span className="text-lg">🇺🇦</span>
					<span className="text-xs text-zinc-500 font-medium">{t.made_in}</span>
					<span className="text-lg">🇺🇦</span>
				</div>
				<div className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest mb-2">
					fastvid.online • {new Date().getFullYear()}
				</div>
				<div className="flex items-center justify-center gap-1 text-xs text-zinc-600">
					<a href="mailto:myappsense@gmail.com" className="px-3 py-2 hover:text-zinc-400 transition-colors">Support</a>
					<span>•</span>
					<a href="mailto:myappsense@gmail.com" className="px-3 py-2 hover:text-zinc-400 transition-colors">Contact</a>
					<span>•</span>
					<a href="https://t.me/Tolik_Motion" target="_blank" rel="noopener noreferrer" className="px-3 py-2 hover:text-zinc-400 transition-colors">Telegram</a>
				</div>
			</div>
		</main>
	);
}
