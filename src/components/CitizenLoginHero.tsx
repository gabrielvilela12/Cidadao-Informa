import React from 'react';
import { Zap, BarChart3 } from 'lucide-react';
import { CASCADE_WIDTH, CASCADE_HEIGHT, useFitScale, Connector, StatusCard, FeatureItem, SendIcon, SearchIcon, CheckIcon } from './loginHeroShared';

function AccessibilityIcon() {
    return (
        <svg viewBox="0 0 1000 1000" width="19" height="19" style={{ color: '#fff' }} aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32.8947">
                <path d="M105.7,408.6c0,0,393.3,238.2,786.6,0" />
                <line x1="739.6" y1="876.6" x2="500" y2="520.2" />
                <line x1="260.2" y1="876.6" x2="500" y2="520.2" />
            </g>
            <g fill="currentColor" stroke="currentColor" strokeMiterlimit="10" strokeWidth="32.8947">
                <circle cx="500" cy="284.3" r="114.9" />
                <circle cx="932.2" cy="374.1" r="51.3" />
                <circle cx="67.6" cy="374.1" r="51.3" />
                <circle cx="739.6" cy="876.6" r="51.3" />
                <circle cx="260.2" cy="876.6" r="51.3" />
            </g>
            <g fill="currentColor">
                <path d="M807.6,802.4c8.2,7.5,15.1,16.3,20.5,26.1c87.3-87,136.2-205.3,135.9-328.6c0-10.1-0.4-20.1-1-30.1 c-9.9,3.2-20.3,4.8-30.8,4.8c-0.6,0-1.3,0-1.9,0c0.5,8.4,0.8,16.8,0.8,25.3C931.3,613.1,887,721.8,807.6,802.4z" />
                <path d="M498.6,932.4c-48.7,0.1-97-8.1-143-24.1c-3.5,10.6-8.8,20.5-15.5,29.4c103.1,37,216,36.8,319-0.7 c-6.7-8.9-11.8-18.9-15.2-29.5C597.2,924,548.1,932.4,498.6,932.4z" />
                <path d="M67,474.7c-11.1-0.1-22.1-2-32.6-5.6c-0.7,10.2-1,20.5-1,30.9C33,623.5,82.1,741.9,169.6,829 c0.4,0.4,0.8,0.8,1.2,1.2c5.2-9.9,11.9-18.9,20-26.5C110.8,723,66,613.7,66.3,500C66.3,491.5,66.5,483.1,67,474.7z" />
                <path d="M827.6,171c-181.7-181.7-476.3-181.7-658,0c0,0,0,0,0,0c-31.2,31.1-57.8,66.5-79.1,105.2 c10.8,2.5,21.1,6.8,30.5,12.7c19.5-34.7,43.7-66.5,71.8-94.6c168.9-168.9,442.6-168.9,611.5,0c0,0,0,0,0,0 c28.5,28.4,52.9,60.7,72.5,95.8c9.2-6.1,19.4-10.6,30.2-13.4C885.7,237.9,859,202.3,827.6,171z" />
            </g>
        </svg>
    );
}

export function CitizenLoginHero() {
    const { wrapperRef, scale } = useFitScale(CASCADE_WIDTH);

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: '#F2F2F4' }}>
            {/* illustration background — contained (never cropped/stretched); the panel's own background color matches its edges so there's no visible seam */}
            <img
                src="/login-cidadao-isometric-wide.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain"
            />

            {/* soft wash so the text/cards stay readable over the photo, without dulling the illustration on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#eef4ff] from-5% via-[#eef4ff]/65 via-38% to-transparent to-68%" />

            {/* dot grid */}
            <svg className="pointer-events-none absolute bottom-32 left-0 h-24 w-24 text-[#9db3d9] opacity-40" viewBox="0 0 200 200" fill="currentColor" aria-hidden="true">
                {[10, 30, 50, 70, 90].flatMap((cy) =>
                    [10, 30, 50, 70, 90].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} />)
                )}
            </svg>

            <div className="relative z-10 flex h-full flex-col px-10 py-8 xl:px-14">
                <div className="w-fit">
                    <span className="inline-block w-fit rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold tracking-wide text-white">
                        PARTICIPAÇÃO CIDADÃ
                    </span>

                    <h1
                        className="mt-6 whitespace-nowrap text-5xl font-extrabold leading-[1.1] text-slate-900 xl:text-[3.25rem]"
                        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9), 0 2px 20px rgba(255,255,255,0.6)' }}
                    >
                        Sua cidade melhora<br />
                        quando <span className="text-blue-600">você participa.</span>
                    </h1>

                    <p
                        className="mt-5 max-w-md text-lg font-medium leading-relaxed text-slate-800"
                        style={{ textShadow: '0 1px 3px rgba(255,255,255,0.9), 0 2px 14px rgba(255,255,255,0.7)' }}
                    >
                        Relate problemas urbanos, acompanhe cada etapa e ajude a construir uma cidade mais acessível para todos.
                    </p>
                </div>

                {/* Status cards cascade, floating over the illustration — scales down as a unit on the narrowest panels */}
                <div ref={wrapperRef} className="mt-8 w-full max-w-full" style={{ height: CASCADE_HEIGHT * scale }}>
                    <div
                        className="relative"
                        style={{ width: CASCADE_WIDTH, height: CASCADE_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                    >
                        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${CASCADE_WIDTH} ${CASCADE_HEIGHT}`} fill="none" aria-hidden="true">
                            {/* card1 right-center -> card2 left-center */}
                            <Connector x1={220} y1={45} x2={270} y2={112.5} />
                            {/* card2 right-center -> card3 left-center — identical shape (same dx, same dy), just translated */}
                            <Connector x1={490} y1={112.5} x2={540} y2={180} />
                        </svg>

                        <StatusCard top={0} left={0} color="#1e4fd6" icon={<SendIcon />} label="Solicitação enviada" />
                        <StatusCard top={67.5} left={270} color="#f5a623" icon={<SearchIcon />} label="Em análise" />
                        <StatusCard top={135} left={540} color="#1fa652" icon={<CheckIcon />} label="Problema resolvido" />
                    </div>
                </div>

                {/* Bottom features */}
                <div className="mt-auto flex items-center gap-10 pt-8">
                    <FeatureItem icon={<Zap size={18} color="#fff" />} color="bg-blue-600" label="Envio rápido" />
                    <FeatureItem icon={<BarChart3 size={18} color="#fff" />} color="bg-blue-600" label={<>Acompanhamento<br />em tempo real</>} />
                    <FeatureItem icon={<AccessibilityIcon />} color="bg-emerald-600" label={<>Cidade mais<br />acessível</>} />
                </div>
            </div>
        </div>
    );
}
