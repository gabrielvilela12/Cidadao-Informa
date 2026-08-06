import React from 'react';
import { FileText, Users, Target, Clock, Zap } from 'lucide-react';
import { CASCADE_WIDTH, CASCADE_HEIGHT, useFitScale, Connector, StatusCard, FeatureItem, CheckIcon } from './loginHeroShared';

export function ServerLoginHero() {
    const { wrapperRef, scale } = useFitScale(CASCADE_WIDTH);

    return (
        <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ backgroundColor: '#FEF5E4' }}>
            {/* illustration background — contained (never cropped/stretched); the panel's own background color matches its edges so there's no visible seam */}
            <img
                src="/login-servidor-isometric.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain"
            />

            {/* soft wash so the text/cards stay readable over the illustration, without dulling it on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FEF5E4] from-5% via-[#FEF5E4]/65 via-38% to-transparent to-68%" />

            {/* dot grid */}
            <svg className="pointer-events-none absolute bottom-32 left-0 h-24 w-24 text-[#d9c19a] opacity-40" viewBox="0 0 200 200" fill="currentColor" aria-hidden="true">
                {[10, 30, 50, 70, 90].flatMap((cy) =>
                    [10, 30, 50, 70, 90].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} />)
                )}
            </svg>

            <div className="relative z-10 flex h-full flex-col px-10 py-8 xl:px-14">
                <div className="w-fit">
                    <span className="inline-block w-fit rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold tracking-wide text-slate-900">
                        GESTÃO MUNICIPAL
                    </span>

                    <h1
                        className="mt-6 text-5xl font-extrabold leading-[1.1] text-slate-900 xl:text-[3.25rem]"
                        style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9), 0 2px 20px rgba(255,255,255,0.6)' }}
                    >
                        Transforme solicitações<br />
                        em <span className="text-amber-600">soluções.</span>
                    </h1>

                    <p
                        className="mt-5 max-w-md text-lg font-medium leading-relaxed text-slate-800"
                        style={{ textShadow: '0 1px 3px rgba(255,255,255,0.9), 0 2px 14px rgba(255,255,255,0.7)' }}
                    >
                        Organize demandas, distribua equipes e acompanhe cada atendimento com clareza e agilidade.
                    </p>
                </div>

                {/* Status cards cascade, floating over the illustration — scales down as a unit on the narrowest panels */}
                <div ref={wrapperRef} className="mt-60 w-full max-w-full" style={{ height: CASCADE_HEIGHT * scale }}>
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

                        <StatusCard top={0} left={0} color="#1e4fd6" icon={<FileText size={20} color="#fff" />} label="Nova solicitação" />
                        <StatusCard top={67.5} left={270} color="#f5a623" icon={<Users size={20} color="#fff" />} label="Equipe atribuída" />
                        <StatusCard top={135} left={540} color="#1fa652" icon={<CheckIcon />} label="Atendimento concluído" />
                    </div>
                </div>

                {/* Bottom features */}
                <div className="mt-auto flex items-center gap-10 pt-8">
                    <FeatureItem icon={<Target size={18} color="#fff" />} color="bg-blue-600" label="Priorize demandas" />
                    <FeatureItem icon={<Clock size={18} color="#fff" />} color="bg-amber-500" label="Acompanhe o SLA" />
                    <FeatureItem icon={<Zap size={18} color="#fff" />} color="bg-emerald-600" label="Resolva com agilidade" />
                </div>
            </div>
        </div>
    );
}
