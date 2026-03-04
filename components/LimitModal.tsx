'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LimitModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdWatched: () => void;
}

export default function LimitModal({ isOpen, onClose, onAdWatched }: LimitModalProps) {
	const [adWatching, setAdWatching] = useState(false);
	const [adCountdown, setAdCountdown] = useState(10);
	const [adDone, setAdDone] = useState(false);

	const startWatchingAd = () => {
		setAdWatching(true);
		setAdCountdown(10);
		// Simulate showing an ad — in prod, trigger AdSense interstitial or reward unit here
		// For now, we show a countdown and then unlock
		const interval = setInterval(() => {
			setAdCountdown(prev => {
				if (prev <= 1) {
					clearInterval(interval);
					setAdWatching(false);
					setAdDone(true);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleAdUnlock = () => {
		onAdWatched();
		onClose();
		setAdDone(false);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10"
					>
						<button
							onClick={onClose}
							className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>

						{adWatching ? (
							/* Ad countdown screen */
							<div className="flex flex-col items-center gap-6 text-center py-4">
								<div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
									<span className="text-4xl font-black text-indigo-400">{adCountdown}</span>
								</div>
								<div>
									<h3 className="text-xl font-bold text-zinc-100 mb-2">Ad is playing...</h3>
									<p className="text-zinc-500 text-sm">Your next video will unlock in {adCountdown}s</p>
								</div>
								{/* Ad block — Google AdSense slot for in-modal ad */}
								<div className="w-full min-h-[100px] bg-zinc-800/50 rounded-xl border border-dashed border-zinc-700 flex items-center justify-center relative overflow-hidden">
									<ins
										className="adsbygoogle"
										style={{ display: 'inline-block', width: '100%', height: '90px' }}
										data-ad-client="ca-pub-1705879673378260"
										data-ad-slot="9170807496"
									/>
									<script>
										{`(adsbygoogle = window.adsbygoogle || []).push({});`}
									</script>
								</div>
							</div>
						) : adDone ? (
							/* Unlocked screen */
							<div className="flex flex-col items-center gap-6 text-center py-4">
								<div className="text-5xl">🎉</div>
								<div>
									<h3 className="text-xl font-bold text-zinc-100 mb-2">Unlocked!</h3>
									<p className="text-zinc-400 text-sm">You can now process one more video.</p>
								</div>
								<button
									onClick={handleAdUnlock}
									className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
								>
									Continue
								</button>
							</div>
						) : (
							/* Default choice screen */
							<>
								<div className="flex flex-col items-center text-center mb-8">
									<div className="text-4xl mb-4">⏱️</div>
									<h2 className="text-2xl font-extrabold text-zinc-100 mb-2">Daily limit reached</h2>
									<p className="text-zinc-400 text-sm">
										You&apos;ve used your 3 free daily videos. To process more — upgrade to Pro or watch a short ad to unlock one more!
									</p>
								</div>

								<div className="flex flex-col gap-3">
									{/* Option 1: Pro */}
									<a
										href="mailto:hello@fastvid.online?subject=Pro Plan&body=I want to subscribe to Fastvid Pro!"
										className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 hover:border-indigo-500 hover:bg-indigo-600/30 transition-all cursor-pointer"
									>
										<div className="p-2 bg-indigo-500/20 rounded-xl">
											<Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
										</div>
										<div className="text-left">
											<p className="font-semibold text-zinc-100">Upgrade to Pro — $9/mo</p>
											<p className="text-zinc-400 text-xs">Videos up to 3 hours, priority processing</p>
										</div>
									</a>

									{/* Option 2: Watch ad */}
									<button
										onClick={startWatchingAd}
										className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-500 transition-all cursor-pointer"
									>
										<div className="p-2 bg-zinc-700 rounded-xl">
											<Play className="w-6 h-6 text-zinc-300" />
										</div>
										<div className="text-left">
											<p className="font-semibold text-zinc-100">Watch a short ad</p>
											<p className="text-zinc-400 text-xs">~10 seconds — unlock next video for free</p>
										</div>
									</button>
								</div>
							</>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
