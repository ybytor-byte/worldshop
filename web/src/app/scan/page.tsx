'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from '../../components/layout/Header';

export default function ScanPage() {
  const [phase, setPhase] = useState<'idle' | 'camera' | 'preview' | 'scanning' | 'done'>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase('camera');
    } catch {
      // Camera not available — fall back to file upload
      fileRef.current?.click();
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    processImage(dataUrl);
  }, []);

  const processImage = useCallback(async (base64: string) => {
    setPhase('scanning');
    setStatusText('Ищем товар через Google Lens...');

    const blob = await fetch(base64).then(r => r.blob());
    const form = new FormData();
    form.append('image', blob, 'photo.jpg');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/search-by-image`,
        { method: 'POST', body: form }
      );
      const data = await res.json();
      setPhase('done');
      setResult(data);
    } catch {
      setPhase('idle');
      setPreview(null);
      setResult({ error: 'Ошибка соединения с сервером', message: 'Проверьте, запущен ли бэкенд на :3001' });
    }
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('image', file);
    setPhase('scanning');
    setStatusText('Ищем товар через Google Lens...');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/search-by-image`, { method: 'POST', body: form })
      .then(r => r.json())
      .then(data => { setPhase('done'); setResult(data); })
      .catch(() => { setPhase('idle'); setPreview(null); setResult({ error: 'Ошибка соединения с сервером', message: 'Проверьте, запущен ли бэкенд на :3001' }); });
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setPreview(null);
    setStatusText('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center py-8 px-4 bg-theme-section">
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold text-center text-theme-primary">
            Сканировать товар
          </h1>
          <p className="text-sm text-center text-theme-secondary">
            Сфотографируйте товар или загрузите фото из галереи
          </p>

          {phase === 'idle' && (
            <div className="flex flex-col gap-3">
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-3 rounded-2xl py-4 px-6 font-semibold text-white text-base btn-gradient shadow-theme active:scale-[0.98] transition-all"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Открыть камеру
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-3 rounded-2xl py-4 px-6 font-semibold text-base border-2 border-theme bg-theme-card text-theme-primary shadow-theme active:scale-[0.98] transition-all"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Выбрать из галереи
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
            </div>
          )}

          {phase === 'camera' && (
            <div className="relative rounded-2xl overflow-hidden border border-theme bg-black shadow-theme">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 border-[3px] border-transparent pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 3px var(--accent-secondary), inset 0 0 20px rgba(6,182,212,0.2)' }}
              />
              <button
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-theme shadow-lg flex items-center justify-center active:scale-90 transition-transform"
              >
                <div className="w-11 h-11 rounded-full" style={{ background: 'var(--gradient-primary)' }} />
              </button>
            </div>
          )}

          {(phase === 'preview' || phase === 'scanning') && preview && (
            <div className="relative rounded-2xl overflow-hidden border border-theme bg-theme-card shadow-theme">
              <img src={preview} alt="Фото" className="w-full aspect-[4/3] object-contain" />
              <div className="scan-overlay" style={{ background: 'color-mix(in srgb, var(--bg-primary) 70%, transparent)' }}>
                <div className="scan-line" />
                <div className="scan-label">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {statusText}
                </div>
              </div>
            </div>
          )}
          {phase === 'done' && result && (
            <div className="flex flex-col gap-3">
              {result.error ? (
                <div className="rounded-xl border p-4 text-center bg-theme-card border-theme"
                  style={{ background: 'color-mix(in srgb, #ef4444 10%, var(--bg-card))', borderColor: 'color-mix(in srgb, #ef4444 20%, var(--border-color))' }}>
                  <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{result.error}</p>
                  <p className="text-xs mt-1" style={{ color: '#f87171' }}>{result.message}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-theme p-4 bg-theme-card shadow-theme">
                  {result.identified ? (
                    <>
                      <p className="text-sm font-bold text-theme-primary">
                        {result.productName || ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-theme-secondary">{result.message || 'Не удалось распознать товар'}</p>
                  )}
                  {(result.offers?.length > 0) && (
                    <div className={`${result.identified ? 'mt-3' : ''} space-y-1.5`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-theme-muted">Предложения</p>
                        {result.offers.map((offer: any, i: number) => {
                          const name = offer.shop || offer.name;
                          const url = offer.url;
                          const price = offer.price ? `${Number(offer.price).toLocaleString('ru-RU')} ₽` : '';
                          const shipping = offer.shipping ? `+ ${Number(offer.shipping).toLocaleString('ru-RU')} ₽ дост.` : '';
                          const duty = offer.duty && offer.duty > 0 ? `+ ${Number(offer.duty).toLocaleString('ru-RU')} ₽ пошл.` : '';
                          const total = offer.totalPrice ? `= ${Number(offer.totalPrice).toLocaleString('ru-RU')} ₽` : '';
                          const rank = offer.rank ? `#${offer.rank}` : '';
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener"
                              className="flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors bg-theme-card-hover border border-theme">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {rank && <span className="text-[10px] font-bold text-theme-muted">{rank}</span>}
                                  <span className="text-theme-primary font-medium truncate">{name}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                  {price && <span className="text-xs font-bold">{price}</span>}
                                  {shipping && <span className="text-[10px] text-theme-muted">{shipping}</span>}
                                  {duty && <span className="text-[10px] text-theme-muted">{duty}</span>}
                                  {total && <span className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>{total}</span>}
                                </div>
                              </div>
                              <svg className="h-3.5 w-3.5 text-theme-muted shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          );
                        })}
                      </div>
                  )}
                </div>
              )}
              <button onClick={reset}
                className="rounded-xl py-3 text-sm font-semibold border-2 border-theme bg-theme-card text-theme-primary shadow-theme active:scale-[0.98] transition-all">
                Сканировать ещё
              </button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} hidden />
      </main>
    </>
  );
}
